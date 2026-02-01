"""
Stripe Payment Integration Service
P0 Critical: Real payment processing for market-ready deployment
"""
import stripe
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Stripe with secret key
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentIntentCreate(BaseModel):
    """Schema for creating a payment intent"""
    amount: int  # Amount in smallest currency unit (e.g., cents for USD, TWD for NT$)
    currency: str = "twd"
    order_id: str
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, str]] = None


class PaymentIntentResponse(BaseModel):
    """Response schema for payment intent"""
    id: str
    client_secret: str
    status: str
    amount: int
    currency: str


class RefundRequest(BaseModel):
    """Schema for refund request"""
    payment_intent_id: str
    amount: Optional[int] = None  # Partial refund if specified
    reason: Optional[str] = None


class StripeService:
    """
    Service class for Stripe payment operations.
    Handles payment intents, webhooks, and refunds.
    """
    
    def __init__(self):
        self.is_configured = bool(settings.STRIPE_SECRET_KEY)
        if not self.is_configured:
            logger.warning("Stripe is not configured. Payment features will be disabled.")
    
    async def create_payment_intent(
        self, 
        payment_data: PaymentIntentCreate
    ) -> PaymentIntentResponse:
        """
        Create a Stripe PaymentIntent for processing payment.
        
        Args:
            payment_data: Payment details including amount, currency, and metadata
            
        Returns:
            PaymentIntentResponse with client_secret for frontend
        """
        if not self.is_configured:
            raise ValueError("Stripe is not configured")
        
        try:
            # Build metadata
            metadata = payment_data.metadata or {}
            metadata["order_id"] = payment_data.order_id
            
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=payment_data.amount,
                currency=payment_data.currency or settings.STRIPE_CURRENCY,
                metadata=metadata,
                description=payment_data.description or f"Order {payment_data.order_id}",
                receipt_email=payment_data.customer_email,
                automatic_payment_methods={"enabled": True},
            )
            
            logger.info(f"Created PaymentIntent {intent.id} for order {payment_data.order_id}")
            
            return PaymentIntentResponse(
                id=intent.id,
                client_secret=intent.client_secret,
                status=intent.status,
                amount=intent.amount,
                currency=intent.currency,
            )
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {e}")
            raise
    
    async def retrieve_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """
        Retrieve a PaymentIntent by ID.
        
        Args:
            payment_intent_id: The Stripe PaymentIntent ID
            
        Returns:
            Payment intent details
        """
        if not self.is_configured:
            raise ValueError("Stripe is not configured")
        
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                "id": intent.id,
                "status": intent.status,
                "amount": intent.amount,
                "currency": intent.currency,
                "metadata": intent.metadata,
                "payment_method": intent.payment_method,
                "created": intent.created,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error retrieving payment intent: {e}")
            raise
    
    async def cancel_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """
        Cancel a PaymentIntent.
        
        Args:
            payment_intent_id: The Stripe PaymentIntent ID
            
        Returns:
            Cancelled payment intent details
        """
        if not self.is_configured:
            raise ValueError("Stripe is not configured")
        
        try:
            intent = stripe.PaymentIntent.cancel(payment_intent_id)
            logger.info(f"Cancelled PaymentIntent {payment_intent_id}")
            return {
                "id": intent.id,
                "status": intent.status,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error cancelling payment intent: {e}")
            raise
    
    async def create_refund(self, refund_data: RefundRequest) -> Dict[str, Any]:
        """
        Create a refund for a payment.
        
        Args:
            refund_data: Refund details including payment intent ID and optional amount
            
        Returns:
            Refund details
        """
        if not self.is_configured:
            raise ValueError("Stripe is not configured")
        
        try:
            refund_params = {
                "payment_intent": refund_data.payment_intent_id,
            }
            
            if refund_data.amount:
                refund_params["amount"] = refund_data.amount
            
            if refund_data.reason:
                refund_params["reason"] = refund_data.reason
            
            refund = stripe.Refund.create(**refund_params)
            
            logger.info(f"Created refund {refund.id} for payment {refund_data.payment_intent_id}")
            
            return {
                "id": refund.id,
                "status": refund.status,
                "amount": refund.amount,
                "currency": refund.currency,
                "payment_intent": refund.payment_intent,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating refund: {e}")
            raise
    
    def verify_webhook_signature(
        self, 
        payload: bytes, 
        signature: str
    ) -> stripe.Event:
        """
        Verify Stripe webhook signature and construct event.
        
        Args:
            payload: Raw webhook payload
            signature: Stripe signature header
            
        Returns:
            Verified Stripe Event
        """
        if not settings.STRIPE_WEBHOOK_SECRET:
            raise ValueError("Stripe webhook secret is not configured")
        
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise
    
    async def handle_webhook_event(self, event: stripe.Event) -> Dict[str, Any]:
        """
        Handle Stripe webhook events.
        
        Args:
            event: Verified Stripe Event
            
        Returns:
            Processing result
        """
        event_type = event.type
        data = event.data.object
        
        logger.info(f"Processing Stripe webhook event: {event_type}")
        
        handlers = {
            "payment_intent.succeeded": self._handle_payment_succeeded,
            "payment_intent.payment_failed": self._handle_payment_failed,
            "charge.refunded": self._handle_refund,
            "payment_intent.canceled": self._handle_payment_canceled,
        }
        
        handler = handlers.get(event_type)
        if handler:
            return await handler(data)
        else:
            logger.info(f"Unhandled webhook event type: {event_type}")
            return {"status": "ignored", "event_type": event_type}
    
    async def _handle_payment_succeeded(self, data: Dict) -> Dict[str, Any]:
        """Handle successful payment"""
        order_id = data.get("metadata", {}).get("order_id")
        logger.info(f"Payment succeeded for order {order_id}")
        
        # TODO: Update order status in database
        # TODO: Send confirmation email
        # TODO: Trigger LINE notification
        
        return {
            "status": "processed",
            "event": "payment_succeeded",
            "order_id": order_id,
            "payment_intent_id": data.get("id"),
        }
    
    async def _handle_payment_failed(self, data: Dict) -> Dict[str, Any]:
        """Handle failed payment"""
        order_id = data.get("metadata", {}).get("order_id")
        logger.warning(f"Payment failed for order {order_id}")
        
        # TODO: Update order status in database
        # TODO: Send failure notification
        
        return {
            "status": "processed",
            "event": "payment_failed",
            "order_id": order_id,
            "error": data.get("last_payment_error", {}).get("message"),
        }
    
    async def _handle_refund(self, data: Dict) -> Dict[str, Any]:
        """Handle refund event"""
        payment_intent = data.get("payment_intent")
        logger.info(f"Refund processed for payment {payment_intent}")
        
        return {
            "status": "processed",
            "event": "refund",
            "payment_intent_id": payment_intent,
            "amount_refunded": data.get("amount_refunded"),
        }
    
    async def _handle_payment_canceled(self, data: Dict) -> Dict[str, Any]:
        """Handle canceled payment"""
        order_id = data.get("metadata", {}).get("order_id")
        logger.info(f"Payment canceled for order {order_id}")
        
        return {
            "status": "processed",
            "event": "payment_canceled",
            "order_id": order_id,
        }


# Singleton instance
stripe_service = StripeService()
