"""
LINE Messaging API endpoints
LINE 訊息服務 API
"""
from fastapi import APIRouter, HTTPException, Request, Header, status
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import httpx
import hashlib
import hmac
import base64
import json
from app.core.config import settings

router = APIRouter(prefix="/api/v1/line", tags=["LINE"])


# ============ Pydantic Models ============

class LineMessage(BaseModel):
    type: str  # 'text' | 'image' | 'flex' | 'template'
    text: Optional[str] = None
    imageUrl: Optional[str] = None
    altText: Optional[str] = None
    contents: Optional[Any] = None  # Flex Message contents


class LineSendTarget(BaseModel):
    type: str  # 'user' | 'group' | 'room'
    id: str
    name: Optional[str] = None


class LineSendRequest(BaseModel):
    targets: List[LineSendTarget]
    messages: List[LineMessage]


class LineSendResult(BaseModel):
    success: bool
    sentCount: int
    failedCount: int
    errors: Optional[List[Dict[str, str]]] = None


# ============ LINE API Client ============

LINE_API_BASE = "https://api.line.me/v2/bot"


async def send_line_push_message(
    to: str,
    messages: List[dict],
    access_token: str
) -> bool:
    """
    發送 LINE 推播訊息
    """
    url = f"{LINE_API_BASE}/message/push"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    payload = {
        "to": to,
        "messages": messages
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            return response.status_code == 200
        except Exception as e:
            print(f"LINE API 錯誤: {e}")
            return False


def convert_message_to_line_format(msg: LineMessage) -> dict:
    """
    將前端訊息格式轉換為 LINE API 格式
    """
    if msg.type == "text":
        return {
            "type": "text",
            "text": msg.text or ""
        }
    elif msg.type == "image":
        return {
            "type": "image",
            "originalContentUrl": msg.imageUrl,
            "previewImageUrl": msg.imageUrl
        }
    elif msg.type == "flex":
        return {
            "type": "flex",
            "altText": msg.altText or "Flex Message",
            "contents": msg.contents
        }
    elif msg.type == "template":
        return {
            "type": "template",
            "altText": msg.altText or "Template Message",
            "template": msg.contents
        }
    else:
        return {
            "type": "text",
            "text": msg.text or ""
        }


def verify_line_signature(body: bytes, signature: str, channel_secret: str) -> bool:
    """
    驗證 LINE Webhook 簽名
    """
    hash_value = hmac.new(
        channel_secret.encode('utf-8'),
        body,
        hashlib.sha256
    ).digest()
    expected_signature = base64.b64encode(hash_value).decode('utf-8')
    return hmac.compare_digest(signature, expected_signature)


# ============ API Endpoints ============

@router.post("/send", response_model=LineSendResult)
async def send_line_message(request: LineSendRequest):
    """
    發送 LINE 訊息給指定目標
    Send LINE messages to specified targets
    """
    access_token = settings.LINE_CHANNEL_ACCESS_TOKEN

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LINE Channel Access Token 未設定"
        )

    # 轉換訊息格式
    line_messages = [convert_message_to_line_format(msg) for msg in request.messages]

    # 限制每次最多 5 則訊息 (LINE API 限制)
    if len(line_messages) > 5:
        line_messages = line_messages[:5]

    sent_count = 0
    failed_count = 0
    errors = []

    for target in request.targets:
        target_id = target.id

        success = await send_line_push_message(target_id, line_messages, access_token)

        if success:
            sent_count += 1
        else:
            failed_count += 1
            errors.append({
                "targetId": target_id,
                "error": "發送失敗"
            })

    return LineSendResult(
        success=failed_count == 0,
        sentCount=sent_count,
        failedCount=failed_count,
        errors=errors if errors else None
    )


@router.post("/broadcast")
async def broadcast_line_message(messages: List[LineMessage]):
    """
    廣播 LINE 訊息給所有關注者
    Broadcast LINE messages to all followers
    """
    access_token = settings.LINE_CHANNEL_ACCESS_TOKEN

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LINE Channel Access Token 未設定"
        )

    url = f"{LINE_API_BASE}/message/broadcast"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    line_messages = [convert_message_to_line_format(msg) for msg in messages]

    if len(line_messages) > 5:
        line_messages = line_messages[:5]

    payload = {"messages": line_messages}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                return {"success": True, "message": "廣播成功"}
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"LINE API 錯誤: {response.text}"
                )
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"無法連接 LINE API: {str(e)}"
            )


@router.post("/webhook")
async def line_webhook(
    request: Request,
    x_line_signature: str = Header(None, alias="X-Line-Signature")
):
    """
    LINE Webhook 接收端點
    處理來自 LINE 的事件（訊息、加入好友等）
    """
    channel_secret = settings.LINE_CHANNEL_SECRET

    # 取得原始請求體
    body = await request.body()

    # 驗證簽名 (生產環境必須啟用)
    if channel_secret and x_line_signature:
        if not verify_line_signature(body, x_line_signature, channel_secret):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid signature"
            )

    # 解析事件
    try:
        data = json.loads(body)
        events = data.get("events", [])
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON"
        )

    # 處理每個事件
    for event in events:
        event_type = event.get("type")

        if event_type == "message":
            await handle_message_event(event)
        elif event_type == "follow":
            await handle_follow_event(event)
        elif event_type == "unfollow":
            await handle_unfollow_event(event)
        elif event_type == "postback":
            await handle_postback_event(event)

    return {"status": "ok"}


# ============ Event Handlers ============

async def handle_message_event(event: dict):
    """
    處理訊息事件
    """
    message = event.get("message", {})
    message_type = message.get("type")
    reply_token = event.get("replyToken")
    source = event.get("source", {})
    user_id = source.get("userId")

    print(f"[LINE] 收到訊息 - 用戶: {user_id}, 類型: {message_type}")

    if message_type == "text":
        text = message.get("text", "")

        # 自動回覆邏輯
        if text.startswith("/"):
            await handle_command(reply_token, text, user_id)
        else:
            # 記錄訊息，可用於後續客服功能
            print(f"[LINE] 文字訊息: {text}")


async def handle_follow_event(event: dict):
    """
    處理加入好友事件
    """
    source = event.get("source", {})
    user_id = source.get("userId")
    reply_token = event.get("replyToken")

    print(f"[LINE] 新用戶加入: {user_id}")

    # 發送歡迎訊息
    if reply_token and settings.LINE_CHANNEL_ACCESS_TOKEN:
        welcome_message = {
            "type": "flex",
            "altText": "歡迎加入",
            "contents": {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": "🎉 歡迎加入！",
                            "weight": "bold",
                            "size": "xl",
                            "color": "#ffffff"
                        }
                    ],
                    "backgroundColor": "#06c167",
                    "paddingAll": "20px"
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": "感謝您加入我們的旅遊服務！",
                            "wrap": True,
                            "size": "md"
                        },
                        {
                            "type": "text",
                            "text": "您將會收到行程通知、集合提醒等重要資訊。",
                            "wrap": True,
                            "size": "sm",
                            "color": "#666666",
                            "margin": "md"
                        }
                    ],
                    "paddingAll": "20px"
                }
            }
        }

        await reply_message(reply_token, [welcome_message])


async def handle_unfollow_event(event: dict):
    """
    處理取消關注事件
    """
    source = event.get("source", {})
    user_id = source.get("userId")
    print(f"[LINE] 用戶取消關注: {user_id}")


async def handle_postback_event(event: dict):
    """
    處理 Postback 事件（按鈕點擊）
    """
    postback = event.get("postback", {})
    data = postback.get("data", "")
    reply_token = event.get("replyToken")

    print(f"[LINE] Postback: {data}")

    # 解析 postback data 並處理
    # 格式範例: action=view_itinerary&session_id=xxx
    params = dict(p.split("=") for p in data.split("&") if "=" in p)
    action = params.get("action")

    if action == "view_itinerary":
        session_id = params.get("session_id")
        if reply_token:
            await reply_message(reply_token, [{
                "type": "text",
                "text": f"請前往網站查看行程詳情。團次ID: {session_id}"
            }])


async def handle_command(reply_token: str, text: str, user_id: str):
    """
    處理指令
    """
    command = text.lower().strip()

    if command in ["/help", "/說明"]:
        await reply_message(reply_token, [{
            "type": "text",
            "text": "📋 可用指令：\n/help - 顯示說明\n/status - 查詢行程狀態\n/contact - 聯絡客服"
        }])
    elif command in ["/status", "/狀態"]:
        await reply_message(reply_token, [{
            "type": "text",
            "text": "請登入網站查看您的行程狀態。"
        }])
    elif command in ["/contact", "/客服"]:
        await reply_message(reply_token, [{
            "type": "text",
            "text": "📞 客服專線：(02) 1234-5678\n📧 Email：service@example.com\n⏰ 服務時間：週一至週五 09:00-18:00"
        }])


async def reply_message(reply_token: str, messages: List[dict]):
    """
    回覆訊息
    """
    access_token = settings.LINE_CHANNEL_ACCESS_TOKEN
    if not access_token:
        return

    url = f"{LINE_API_BASE}/message/reply"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    payload = {
        "replyToken": reply_token,
        "messages": messages
    }

    async with httpx.AsyncClient() as client:
        try:
            await client.post(url, json=payload, headers=headers)
        except Exception as e:
            print(f"回覆訊息失敗: {e}")


@router.get("/profile/{user_id}")
async def get_user_profile(user_id: str):
    """
    取得 LINE 用戶資料
    """
    access_token = settings.LINE_CHANNEL_ACCESS_TOKEN

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LINE Channel Access Token 未設定"
        )

    url = f"{LINE_API_BASE}/profile/{user_id}"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="無法取得用戶資料"
                )
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"無法連接 LINE API: {str(e)}"
            )
