"""
Email Notification Service
P0 Critical: Email/SMS notifications for market-ready deployment
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from jinja2 import Environment, BaseLoader
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class EmailMessage(BaseModel):
    """Schema for email message"""
    to: List[EmailStr]
    subject: str
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    cc: Optional[List[EmailStr]] = None
    bcc: Optional[List[EmailStr]] = None
    reply_to: Optional[EmailStr] = None


class EmailTemplateData(BaseModel):
    """Schema for email template rendering"""
    template_name: str
    data: Dict[str, Any]


# Email templates
EMAIL_TEMPLATES = {
    "welcome": {
        "subject": "歡迎加入 TrvicERP - {{user_name}}",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Microsoft JhengHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 歡迎加入 TrvicERP</h1>
        </div>
        <div class="content">
            <p>親愛的 {{user_name}}，</p>
            <p>感謝您註冊 TrvicERP 旅遊業企業資源規劃系統！</p>
            <p>您的帳號已成功建立，現在可以開始使用以下功能：</p>
            <ul>
                <li>📋 團期管理與報價</li>
                <li>👥 客戶關係管理</li>
                <li>🤖 AI 智能助手</li>
                <li>📊 數據分析報表</li>
            </ul>
            <a href="{{login_url}}" class="button">立即登入</a>
        </div>
        <div class="footer">
            <p>© 2024 TrvicERP. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """,
    },
    "order_confirmation": {
        "subject": "訂單確認 - {{order_number}}",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Microsoft JhengHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .total { font-size: 24px; font-weight: bold; color: #10b981; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ 訂單確認</h1>
        </div>
        <div class="content">
            <p>親愛的 {{customer_name}}，</p>
            <p>感謝您的訂購！您的訂單已成功建立。</p>
            
            <div class="order-details">
                <h3>訂單資訊</h3>
                <p><strong>訂單編號：</strong>{{order_number}}</p>
                <p><strong>行程名稱：</strong>{{tour_name}}</p>
                <p><strong>出發日期：</strong>{{departure_date}}</p>
                <p><strong>人數：</strong>{{participants}} 人</p>
                <hr>
                <p class="total">總金額：NT$ {{total_amount}}</p>
            </div>
            
            <p>如有任何問題，請聯繫我們的客服團隊。</p>
        </div>
        <div class="footer">
            <p>© 2024 TrvicERP. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """,
    },
    "payment_success": {
        "subject": "付款成功 - 訂單 {{order_number}}",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Microsoft JhengHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-icon { font-size: 48px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">💳</div>
            <h1>付款成功</h1>
        </div>
        <div class="content">
            <p>親愛的 {{customer_name}}，</p>
            <p>您的付款已成功處理！</p>
            
            <p><strong>訂單編號：</strong>{{order_number}}</p>
            <p><strong>付款金額：</strong>NT$ {{amount}}</p>
            <p><strong>付款時間：</strong>{{payment_time}}</p>
            <p><strong>交易編號：</strong>{{transaction_id}}</p>
            
            <p>感謝您的信任與支持！</p>
        </div>
        <div class="footer">
            <p>© 2024 TrvicERP. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """,
    },
    "password_reset": {
        "subject": "密碼重設請求 - TrvicERP",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Microsoft JhengHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .warning { background: #fef3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 密碼重設</h1>
        </div>
        <div class="content">
            <p>親愛的 {{user_name}}，</p>
            <p>我們收到了您的密碼重設請求。請點擊下方按鈕設定新密碼：</p>
            
            <a href="{{reset_url}}" class="button">重設密碼</a>
            
            <div class="warning">
                <strong>⚠️ 注意：</strong>此連結將在 24 小時後失效。如果您沒有發出此請求，請忽略此郵件。
            </div>
        </div>
        <div class="footer">
            <p>© 2024 TrvicERP. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """,
    },
    "trip_reminder": {
        "subject": "出團提醒 - {{tour_name}} ({{departure_date}})",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Microsoft JhengHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✈️ 出團提醒</h1>
        </div>
        <div class="content">
            <p>親愛的 {{customer_name}}，</p>
            <p>您的行程即將出發，請準備好您的行囊！</p>
            
            <div class="info-box">
                <h3>📋 行程資訊</h3>
                <p><strong>行程名稱：</strong>{{tour_name}}</p>
                <p><strong>出發日期：</strong>{{departure_date}}</p>
                <p><strong>集合時間：</strong>{{meeting_time}}</p>
                <p><strong>集合地點：</strong>{{meeting_location}}</p>
                <p><strong>領隊：</strong>{{leader_name}}</p>
            </div>
            
            <h3>📝 行前準備清單</h3>
            <ul>
                <li>護照（效期需超過 6 個月）</li>
                <li>身份證件</li>
                <li>行程確認單</li>
                <li>個人藥品</li>
            </ul>
            
            <p>祝您旅途愉快！</p>
        </div>
        <div class="footer">
            <p>© 2024 TrvicERP. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """,
    },
}


class EmailService:
    """
    Service class for sending email notifications.
    Supports both plain text and HTML emails with templates.
    """
    
    def __init__(self):
        self.is_configured = all([
            settings.SMTP_HOST,
            settings.SMTP_USER,
            settings.SMTP_PASSWORD,
        ])
        self.jinja_env = Environment(loader=BaseLoader())
        
        if not self.is_configured:
            logger.warning("SMTP is not configured. Email features will be disabled.")
    
    async def send_email(self, message: EmailMessage) -> Dict[str, Any]:
        """
        Send an email message.
        
        Args:
            message: Email message with recipients, subject, and body
            
        Returns:
            Send result with status
        """
        if not self.is_configured:
            logger.warning("Email service not configured, skipping email send")
            return {"status": "skipped", "reason": "not_configured"}
        
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = message.subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = ", ".join(message.to)
            
            if message.cc:
                msg["Cc"] = ", ".join(message.cc)
            
            if message.reply_to:
                msg["Reply-To"] = message.reply_to
            
            # Attach text and HTML parts
            if message.body_text:
                msg.attach(MIMEText(message.body_text, "plain", "utf-8"))
            
            if message.body_html:
                msg.attach(MIMEText(message.body_html, "html", "utf-8"))
            
            # Build recipient list
            recipients = list(message.to)
            if message.cc:
                recipients.extend(message.cc)
            if message.bcc:
                recipients.extend(message.bcc)
            
            # Send email
            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=settings.SMTP_USE_TLS,
            )
            
            logger.info(f"Email sent successfully to {message.to}")
            return {"status": "sent", "recipients": message.to}
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def send_template_email(
        self,
        to: List[str],
        template_name: str,
        template_data: Dict[str, Any],
        cc: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Send an email using a predefined template.
        
        Args:
            to: List of recipient email addresses
            template_name: Name of the template to use
            template_data: Data to render in the template
            cc: Optional CC recipients
            
        Returns:
            Send result with status
        """
        template = EMAIL_TEMPLATES.get(template_name)
        if not template:
            logger.error(f"Email template '{template_name}' not found")
            return {"status": "failed", "error": f"Template '{template_name}' not found"}
        
        try:
            # Render subject
            subject_template = self.jinja_env.from_string(template["subject"])
            subject = subject_template.render(**template_data)
            
            # Render HTML body
            body_template = self.jinja_env.from_string(template["body_html"])
            body_html = body_template.render(**template_data)
            
            # Send email
            message = EmailMessage(
                to=to,
                subject=subject,
                body_html=body_html,
                cc=cc,
            )
            
            return await self.send_email(message)
            
        except Exception as e:
            logger.error(f"Failed to send template email: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def send_welcome_email(
        self,
        to: str,
        user_name: str,
        login_url: str = "https://trvicerp.com/login",
    ) -> Dict[str, Any]:
        """Send welcome email to new user"""
        return await self.send_template_email(
            to=[to],
            template_name="welcome",
            template_data={
                "user_name": user_name,
                "login_url": login_url,
            },
        )
    
    async def send_order_confirmation(
        self,
        to: str,
        customer_name: str,
        order_number: str,
        tour_name: str,
        departure_date: str,
        participants: int,
        total_amount: str,
    ) -> Dict[str, Any]:
        """Send order confirmation email"""
        return await self.send_template_email(
            to=[to],
            template_name="order_confirmation",
            template_data={
                "customer_name": customer_name,
                "order_number": order_number,
                "tour_name": tour_name,
                "departure_date": departure_date,
                "participants": participants,
                "total_amount": total_amount,
            },
        )
    
    async def send_payment_success(
        self,
        to: str,
        customer_name: str,
        order_number: str,
        amount: str,
        payment_time: str,
        transaction_id: str,
    ) -> Dict[str, Any]:
        """Send payment success email"""
        return await self.send_template_email(
            to=[to],
            template_name="payment_success",
            template_data={
                "customer_name": customer_name,
                "order_number": order_number,
                "amount": amount,
                "payment_time": payment_time,
                "transaction_id": transaction_id,
            },
        )
    
    async def send_password_reset(
        self,
        to: str,
        user_name: str,
        reset_url: str,
    ) -> Dict[str, Any]:
        """Send password reset email"""
        return await self.send_template_email(
            to=[to],
            template_name="password_reset",
            template_data={
                "user_name": user_name,
                "reset_url": reset_url,
            },
        )
    
    async def send_trip_reminder(
        self,
        to: str,
        customer_name: str,
        tour_name: str,
        departure_date: str,
        meeting_time: str,
        meeting_location: str,
        leader_name: str,
    ) -> Dict[str, Any]:
        """Send trip reminder email"""
        return await self.send_template_email(
            to=[to],
            template_name="trip_reminder",
            template_data={
                "customer_name": customer_name,
                "tour_name": tour_name,
                "departure_date": departure_date,
                "meeting_time": meeting_time,
                "meeting_location": meeting_location,
                "leader_name": leader_name,
            },
        )


# Singleton instance
email_service = EmailService()
