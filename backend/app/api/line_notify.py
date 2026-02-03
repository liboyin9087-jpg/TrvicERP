"""
LINE Messaging API & LINE Notify Integration
用於發送旅遊通知、行程提醒、付款確認等訊息

LINE Messaging API: https://developers.line.biz/en/docs/messaging-api/
LINE Notify: https://notify-bot.line.me/doc/
"""
from fastapi import APIRouter, HTTPException, Request, Header, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
import httpx
import hashlib
import hmac
import base64
import json
import logging
from datetime import datetime

from app.core.config import settings
from app.db.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/line-notify", tags=["LINE Notifications"])


# ===========================================
# Configuration
# ===========================================
class LINEConfig:
    """LINE API Configuration"""
    
    MESSAGING_API_URL = "https://api.line.me/v2/bot"
    NOTIFY_API_URL = "https://notify-api.line.me/api/notify"
    
    @classmethod
    def get_messaging_headers(cls) -> dict:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.LINE_CHANNEL_ACCESS_TOKEN}",
        }
    
    @classmethod
    def get_notify_headers(cls) -> dict:
        return {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Bearer {settings.LINE_NOTIFY_TOKEN}",
        }


# ===========================================
# Request/Response Models
# ===========================================
class SendMessageRequest(BaseModel):
    """發送訊息請求"""
    user_id: str = Field(..., description="LINE User ID")
    message: str = Field(..., description="訊息內容")
    message_type: Literal["text", "template", "flex"] = Field(default="text")


class BroadcastMessageRequest(BaseModel):
    """群發訊息請求"""
    message: str = Field(..., description="訊息內容")
    target_audience: Optional[str] = Field(None, description="目標受眾 ID")


class NotifyRequest(BaseModel):
    """LINE Notify 請求"""
    message: str = Field(..., max_length=1000, description="通知訊息")
    image_url: Optional[str] = Field(None, description="圖片 URL")
    sticker_package_id: Optional[int] = None
    sticker_id: Optional[int] = None


class TourNotificationRequest(BaseModel):
    """旅遊通知請求"""
    user_ids: List[str] = Field(..., description="接收者 LINE User IDs")
    tour_name: str = Field(..., description="行程名稱")
    notification_type: Literal[
        "booking_confirmed",  # 訂單確認
        "payment_received",   # 付款成功
        "departure_reminder", # 出發提醒
        "itinerary_update",   # 行程異動
        "weather_alert",      # 天氣警報
        "custom"              # 自訂訊息
    ]
    custom_message: Optional[str] = None
    departure_date: Optional[str] = None
    meeting_time: Optional[str] = None
    meeting_location: Optional[str] = None


# ===========================================
# Message Templates
# ===========================================
def create_booking_confirmed_message(tour_name: str, departure_date: str) -> dict:
    """訂單確認訊息模板"""
    return {
        "type": "flex",
        "altText": f"訂單確認 - {tour_name}",
        "contents": {
            "type": "bubble",
            "hero": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "✅ 訂單確認",
                        "weight": "bold",
                        "size": "xl",
                        "color": "#1DB446"
                    }
                ],
                "paddingAll": "20px",
                "backgroundColor": "#F0FFF4"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": tour_name,
                        "weight": "bold",
                        "size": "lg",
                        "wrap": True
                    },
                    {
                        "type": "separator",
                        "margin": "md"
                    },
                    {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                            {"type": "text", "text": "出發日期", "color": "#666666", "flex": 1},
                            {"type": "text", "text": departure_date, "weight": "bold", "flex": 2}
                        ],
                        "margin": "md"
                    },
                    {
                        "type": "text",
                        "text": "感謝您的預訂！我們將盡快與您聯繫確認細節。",
                        "size": "sm",
                        "color": "#888888",
                        "wrap": True,
                        "margin": "lg"
                    }
                ]
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "button",
                        "action": {
                            "type": "uri",
                            "label": "查看行程詳情",
                            "uri": f"{settings.VITE_APP_URL}/portal"
                        },
                        "style": "primary",
                        "color": "#1DB446"
                    }
                ]
            }
        }
    }


def create_departure_reminder_message(
    tour_name: str, 
    departure_date: str, 
    meeting_time: str, 
    meeting_location: str
) -> dict:
    """出發提醒訊息模板"""
    return {
        "type": "flex",
        "altText": f"出發提醒 - {tour_name}",
        "contents": {
            "type": "bubble",
            "hero": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "✈️ 出發提醒",
                        "weight": "bold",
                        "size": "xl",
                        "color": "#0066FF"
                    }
                ],
                "paddingAll": "20px",
                "backgroundColor": "#E6F0FF"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": tour_name,
                        "weight": "bold",
                        "size": "lg",
                        "wrap": True
                    },
                    {
                        "type": "separator",
                        "margin": "md"
                    },
                    {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                            {"type": "text", "text": "📅 出發日期", "color": "#666666", "flex": 1},
                            {"type": "text", "text": departure_date, "weight": "bold", "flex": 2}
                        ],
                        "margin": "md"
                    },
                    {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                            {"type": "text", "text": "⏰ 集合時間", "color": "#666666", "flex": 1},
                            {"type": "text", "text": meeting_time, "weight": "bold", "flex": 2}
                        ],
                        "margin": "md"
                    },
                    {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                            {"type": "text", "text": "📍 集合地點", "color": "#666666", "flex": 1},
                            {"type": "text", "text": meeting_location, "weight": "bold", "flex": 2, "wrap": True}
                        ],
                        "margin": "md"
                    },
                    {
                        "type": "text",
                        "text": "⚠️ 請攜帶護照、機票及相關文件",
                        "size": "sm",
                        "color": "#FF6600",
                        "wrap": True,
                        "margin": "lg"
                    }
                ]
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "button",
                        "action": {
                            "type": "uri",
                            "label": "查看行前說明",
                            "uri": f"{settings.VITE_APP_URL}/briefing"
                        },
                        "style": "primary"
                    }
                ]
            }
        }
    }


def create_payment_received_message(tour_name: str, amount: int) -> dict:
    """付款成功訊息模板"""
    return {
        "type": "flex",
        "altText": f"付款成功 - {tour_name}",
        "contents": {
            "type": "bubble",
            "hero": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "💰 付款成功",
                        "weight": "bold",
                        "size": "xl",
                        "color": "#1DB446"
                    }
                ],
                "paddingAll": "20px",
                "backgroundColor": "#F0FFF4"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": tour_name,
                        "weight": "bold",
                        "size": "lg",
                        "wrap": True
                    },
                    {
                        "type": "separator",
                        "margin": "md"
                    },
                    {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                            {"type": "text", "text": "付款金額", "color": "#666666", "flex": 1},
                            {"type": "text", "text": f"NT$ {amount:,}", "weight": "bold", "flex": 2, "color": "#1DB446"}
                        ],
                        "margin": "md"
                    },
                    {
                        "type": "text",
                        "text": f"付款時間: {datetime.now().strftime('%Y/%m/%d %H:%M')}",
                        "size": "xs",
                        "color": "#888888",
                        "margin": "lg"
                    }
                ]
            }
        }
    }


# ===========================================
# Utility Functions
# ===========================================
def verify_line_signature(body: bytes, signature: str) -> bool:
    """驗證 LINE Webhook 簽章"""
    if not settings.LINE_CHANNEL_SECRET:
        return False
    
    hash_value = hmac.new(
        settings.LINE_CHANNEL_SECRET.encode("utf-8"),
        body,
        hashlib.sha256
    ).digest()
    
    expected_signature = base64.b64encode(hash_value).decode("utf-8")
    return hmac.compare_digest(signature, expected_signature)


# ===========================================
# API Endpoints
# ===========================================
@router.post("/send")
async def send_message(request: SendMessageRequest):
    """
    發送訊息給單一使用者
    """
    if not settings.LINE_CHANNEL_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="LINE Messaging API is not configured")
    
    api_url = f"{LINEConfig.MESSAGING_API_URL}/message/push"
    
    payload = {
        "to": request.user_id,
        "messages": [
            {"type": "text", "text": request.message}
        ]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            api_url,
            json=payload,
            headers=LINEConfig.get_messaging_headers()
        )
        
        if response.status_code == 200:
            logger.info(f"Message sent to {request.user_id}")
            return {"success": True, "message": "Message sent successfully"}
        else:
            logger.error(f"Failed to send message: {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)


@router.post("/notify")
async def send_notify(request: NotifyRequest):
    """
    透過 LINE Notify 發送通知
    適合用於系統警報、管理者通知
    """
    if not settings.LINE_NOTIFY_TOKEN:
        raise HTTPException(status_code=500, detail="LINE Notify is not configured")
    
    data = {"message": request.message}
    
    if request.image_url:
        data["imageThumbnail"] = request.image_url
        data["imageFullsize"] = request.image_url
    
    if request.sticker_package_id and request.sticker_id:
        data["stickerPackageId"] = request.sticker_package_id
        data["stickerId"] = request.sticker_id
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            LINEConfig.NOTIFY_API_URL,
            data=data,
            headers=LINEConfig.get_notify_headers()
        )
        
        if response.status_code == 200:
            return {"success": True, "message": "Notification sent"}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)


@router.post("/tour-notification")
async def send_tour_notification(request: TourNotificationRequest):
    """
    發送旅遊相關通知
    支援多種通知類型，使用精美的 Flex Message 模板
    """
    if not settings.LINE_CHANNEL_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="LINE Messaging API is not configured")
    
    # 根據通知類型建立訊息
    if request.notification_type == "booking_confirmed":
        message = create_booking_confirmed_message(
            request.tour_name,
            request.departure_date or "待確認"
        )
    elif request.notification_type == "departure_reminder":
        message = create_departure_reminder_message(
            request.tour_name,
            request.departure_date or "待確認",
            request.meeting_time or "待確認",
            request.meeting_location or "待確認"
        )
    elif request.notification_type == "payment_received":
        # 假設金額從其他地方取得
        message = create_payment_received_message(request.tour_name, 0)
    else:
        # 自訂訊息
        message = {
            "type": "text",
            "text": request.custom_message or f"[{request.tour_name}] 通知"
        }
    
    # 發送給所有使用者
    api_url = f"{LINEConfig.MESSAGING_API_URL}/message/multicast"
    
    payload = {
        "to": request.user_ids,
        "messages": [message]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            api_url,
            json=payload,
            headers=LINEConfig.get_messaging_headers()
        )
        
        if response.status_code == 200:
            logger.info(f"Tour notification sent to {len(request.user_ids)} users")
            return {
                "success": True,
                "message": f"Notification sent to {len(request.user_ids)} users"
            }
        else:
            logger.error(f"Failed to send tour notification: {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)


@router.post("/webhook")
async def line_webhook(
    request: Request,
    x_line_signature: str = Header(None)
):
    """
    LINE Webhook 接收端點
    處理使用者訊息、加好友、取消追蹤等事件
    """
    body = await request.body()
    
    # 驗證簽章
    if x_line_signature and not verify_line_signature(body, x_line_signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    try:
        data = json.loads(body)
        events = data.get("events", [])
        
        for event in events:
            event_type = event.get("type")
            
            if event_type == "message":
                # 處理訊息事件
                user_id = event["source"]["userId"]
                message = event.get("message", {})
                message_type = message.get("type")
                
                if message_type == "text":
                    text = message.get("text", "")
                    logger.info(f"Received message from {user_id}: {text}")
                    
                    # TODO: 實作自動回覆或 AI 客服
                    
            elif event_type == "follow":
                # 新追蹤者
                user_id = event["source"]["userId"]
                logger.info(f"New follower: {user_id}")
                
                # TODO: 發送歡迎訊息
                
            elif event_type == "unfollow":
                # 取消追蹤
                user_id = event["source"]["userId"]
                logger.info(f"User unfollowed: {user_id}")
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
