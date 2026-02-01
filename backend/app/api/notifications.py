"""
Notifications API endpoints for TrvicERP
P0 Critical: Unified notification service for Email and LINE
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

from app.core.email_service import email_service
from app.core.observability import track_email_sent, track_line_message, get_logger, capture_exception
from app.core.config import settings

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])
logger = get_logger(__name__)


class NotificationChannel(str, Enum):
    EMAIL = "email"
    LINE = "line"
    BOTH = "both"


class NotificationTemplate(str, Enum):
    WELCOME = "welcome"
    ORDER_CONFIRMATION = "order_confirmation"
    PAYMENT_SUCCESS = "payment_success"
    PASSWORD_RESET = "password_reset"
    TRIP_REMINDER = "trip_reminder"
    CUSTOM = "custom"


class NotificationRequest(BaseModel):
    """Request to send a notification"""
    channel: NotificationChannel
    template: NotificationTemplate
    recipients: List[str]  # Email addresses or LINE user IDs
    template_data: Dict[str, Any]
    subject: Optional[str] = None  # For custom email
    body: Optional[str] = None  # For custom notification


class NotificationResponse(BaseModel):
    """Response from notification send"""
    success: bool
    channel: str
    recipients_count: int
    sent_count: int
    failed_count: int
    errors: Optional[List[Dict[str, str]]] = None


class BulkNotificationRequest(BaseModel):
    """Request to send bulk notifications"""
    channel: NotificationChannel
    template: NotificationTemplate
    recipients: List[Dict[str, Any]]  # List of {recipient, template_data}


class TripReminderRequest(BaseModel):
    """Request to send trip reminder"""
    customer_email: Optional[EmailStr] = None
    customer_line_id: Optional[str] = None
    customer_name: str
    tour_name: str
    departure_date: str
    meeting_time: str
    meeting_location: str
    leader_name: str


class PaymentNotificationRequest(BaseModel):
    """Request to send payment notification"""
    customer_email: Optional[EmailStr] = None
    customer_line_id: Optional[str] = None
    customer_name: str
    order_number: str
    amount: str
    payment_time: str
    transaction_id: str


@router.post("/send", response_model=NotificationResponse)
async def send_notification(request: NotificationRequest):
    """
    Send notification via specified channel(s).
    Supports Email and LINE channels with templates.
    """
    sent_count = 0
    failed_count = 0
    errors = []
    
    try:
        if request.channel in [NotificationChannel.EMAIL, NotificationChannel.BOTH]:
            # Send email notifications
            email_recipients = [r for r in request.recipients if "@" in r]
            
            for recipient in email_recipients:
                try:
                    if request.template == NotificationTemplate.CUSTOM:
                        # Custom email
                        from app.core.email_service import EmailMessage
                        result = await email_service.send_email(EmailMessage(
                            to=[recipient],
                            subject=request.subject or "TrvicERP Notification",
                            body_html=request.body,
                        ))
                    else:
                        # Template email
                        result = await email_service.send_template_email(
                            to=[recipient],
                            template_name=request.template.value,
                            template_data=request.template_data,
                        )
                    
                    if result.get("status") == "sent":
                        sent_count += 1
                        track_email_sent(template=request.template.value, status="success")
                    else:
                        failed_count += 1
                        errors.append({"recipient": recipient, "error": result.get("error", "Unknown error")})
                        track_email_sent(template=request.template.value, status="failed")
                        
                except Exception as e:
                    failed_count += 1
                    errors.append({"recipient": recipient, "error": str(e)})
                    track_email_sent(template=request.template.value, status="failed")
        
        if request.channel in [NotificationChannel.LINE, NotificationChannel.BOTH]:
            # Send LINE notifications
            line_recipients = [r for r in request.recipients if "@" not in r and r.startswith("U")]
            
            if line_recipients and settings.LINE_CHANNEL_ACCESS_TOKEN:
                # Import LINE service
                from app.api.line import send_line_push_message
                
                for recipient in line_recipients:
                    try:
                        # Build LINE message based on template
                        message = _build_line_message(request.template, request.template_data)
                        
                        success = await send_line_push_message(
                            recipient, 
                            [message], 
                            settings.LINE_CHANNEL_ACCESS_TOKEN
                        )
                        
                        if success:
                            sent_count += 1
                            track_line_message(status="success")
                        else:
                            failed_count += 1
                            errors.append({"recipient": recipient, "error": "LINE send failed"})
                            track_line_message(status="failed")
                            
                    except Exception as e:
                        failed_count += 1
                        errors.append({"recipient": recipient, "error": str(e)})
                        track_line_message(status="failed")
        
        logger.info(
            "Notification sent",
            channel=request.channel.value,
            template=request.template.value,
            sent=sent_count,
            failed=failed_count,
        )
        
        return NotificationResponse(
            success=failed_count == 0,
            channel=request.channel.value,
            recipients_count=len(request.recipients),
            sent_count=sent_count,
            failed_count=failed_count,
            errors=errors if errors else None,
        )
        
    except Exception as e:
        capture_exception(e, {"channel": request.channel.value, "template": request.template.value})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send notification: {str(e)}"
        )


@router.post("/trip-reminder", response_model=NotificationResponse)
async def send_trip_reminder(request: TripReminderRequest):
    """
    Send trip reminder to customer via Email and/or LINE.
    """
    recipients = []
    if request.customer_email:
        recipients.append(request.customer_email)
    if request.customer_line_id:
        recipients.append(request.customer_line_id)
    
    if not recipients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one recipient (email or LINE ID) is required"
        )
    
    notification_request = NotificationRequest(
        channel=NotificationChannel.BOTH if (request.customer_email and request.customer_line_id) 
                else (NotificationChannel.EMAIL if request.customer_email else NotificationChannel.LINE),
        template=NotificationTemplate.TRIP_REMINDER,
        recipients=recipients,
        template_data={
            "customer_name": request.customer_name,
            "tour_name": request.tour_name,
            "departure_date": request.departure_date,
            "meeting_time": request.meeting_time,
            "meeting_location": request.meeting_location,
            "leader_name": request.leader_name,
        },
    )
    
    return await send_notification(notification_request)


@router.post("/payment-success", response_model=NotificationResponse)
async def send_payment_notification(request: PaymentNotificationRequest):
    """
    Send payment success notification to customer.
    """
    recipients = []
    if request.customer_email:
        recipients.append(request.customer_email)
    if request.customer_line_id:
        recipients.append(request.customer_line_id)
    
    if not recipients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one recipient (email or LINE ID) is required"
        )
    
    notification_request = NotificationRequest(
        channel=NotificationChannel.BOTH if (request.customer_email and request.customer_line_id) 
                else (NotificationChannel.EMAIL if request.customer_email else NotificationChannel.LINE),
        template=NotificationTemplate.PAYMENT_SUCCESS,
        recipients=recipients,
        template_data={
            "customer_name": request.customer_name,
            "order_number": request.order_number,
            "amount": request.amount,
            "payment_time": request.payment_time,
            "transaction_id": request.transaction_id,
        },
    )
    
    return await send_notification(notification_request)


@router.get("/status")
async def get_notification_status():
    """
    Get notification service status.
    """
    return {
        "email": {
            "configured": email_service.is_configured,
            "provider": "SMTP" if email_service.is_configured else None,
        },
        "line": {
            "configured": bool(settings.LINE_CHANNEL_ACCESS_TOKEN),
        },
        "templates_available": [t.value for t in NotificationTemplate],
    }


def _build_line_message(template: NotificationTemplate, data: Dict[str, Any]) -> dict:
    """Build LINE Flex Message based on template"""
    
    if template == NotificationTemplate.TRIP_REMINDER:
        return {
            "type": "flex",
            "altText": f"出團提醒 - {data.get('tour_name', '')}",
            "contents": {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {"type": "text", "text": "✈️ 出團提醒", "weight": "bold", "size": "xl", "color": "#ffffff"}
                    ],
                    "backgroundColor": "#3b82f6",
                    "paddingAll": "20px"
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {"type": "text", "text": f"親愛的 {data.get('customer_name', '')}，", "wrap": True},
                        {"type": "text", "text": f"行程名稱：{data.get('tour_name', '')}", "margin": "md", "wrap": True},
                        {"type": "text", "text": f"出發日期：{data.get('departure_date', '')}", "margin": "sm"},
                        {"type": "text", "text": f"集合時間：{data.get('meeting_time', '')}", "margin": "sm"},
                        {"type": "text", "text": f"集合地點：{data.get('meeting_location', '')}", "margin": "sm", "wrap": True},
                        {"type": "text", "text": f"領隊：{data.get('leader_name', '')}", "margin": "sm"},
                    ],
                    "paddingAll": "20px"
                }
            }
        }
    
    elif template == NotificationTemplate.PAYMENT_SUCCESS:
        return {
            "type": "flex",
            "altText": f"付款成功 - 訂單 {data.get('order_number', '')}",
            "contents": {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {"type": "text", "text": "💳 付款成功", "weight": "bold", "size": "xl", "color": "#ffffff"}
                    ],
                    "backgroundColor": "#10b981",
                    "paddingAll": "20px"
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {"type": "text", "text": f"親愛的 {data.get('customer_name', '')}，", "wrap": True},
                        {"type": "text", "text": "您的付款已成功處理！", "margin": "md"},
                        {"type": "separator", "margin": "lg"},
                        {"type": "text", "text": f"訂單編號：{data.get('order_number', '')}", "margin": "lg"},
                        {"type": "text", "text": f"付款金額：NT$ {data.get('amount', '')}", "margin": "sm"},
                        {"type": "text", "text": f"付款時間：{data.get('payment_time', '')}", "margin": "sm"},
                        {"type": "text", "text": f"交易編號：{data.get('transaction_id', '')}", "margin": "sm", "size": "sm", "color": "#666666"},
                    ],
                    "paddingAll": "20px"
                }
            }
        }
    
    elif template == NotificationTemplate.ORDER_CONFIRMATION:
        return {
            "type": "flex",
            "altText": f"訂單確認 - {data.get('order_number', '')}",
            "contents": {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {"type": "text", "text": "✅ 訂單確認", "weight": "bold", "size": "xl", "color": "#ffffff"}
                    ],
                    "backgroundColor": "#10b981",
                    "paddingAll": "20px"
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {"type": "text", "text": f"親愛的 {data.get('customer_name', '')}，", "wrap": True},
                        {"type": "text", "text": "感謝您的訂購！", "margin": "md"},
                        {"type": "separator", "margin": "lg"},
                        {"type": "text", "text": f"訂單編號：{data.get('order_number', '')}", "margin": "lg"},
                        {"type": "text", "text": f"行程：{data.get('tour_name', '')}", "margin": "sm", "wrap": True},
                        {"type": "text", "text": f"出發日期：{data.get('departure_date', '')}", "margin": "sm"},
                        {"type": "text", "text": f"人數：{data.get('participants', '')} 人", "margin": "sm"},
                    ],
                    "paddingAll": "20px"
                }
            }
        }
    
    else:
        # Default text message for other templates
        return {
            "type": "text",
            "text": data.get("message", "您有一則來自 TrvicERP 的通知")
        }
