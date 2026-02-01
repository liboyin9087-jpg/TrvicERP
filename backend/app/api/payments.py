"""
Payments API endpoints for TrvicERP
Manages payment processing, invoices, and financial transactions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import uuid4
from decimal import Decimal
from app.db.database import get_db

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])


# Pydantic Schemas
class PaymentBase(BaseModel):
    order_id: str = Field(..., description="Associated order ID")
    customer_id: Optional[str] = None
    payment_type: str = Field(..., description="deposit, balance, refund, penalty")
    payment_method: str = Field(..., description="cash, credit_card, bank_transfer, line_pay")
    amount: float = Field(..., ge=0)
    currency: str = Field(default="TWD")
    exchange_rate: float = Field(default=1.0)
    payment_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_status: str = Field(default="pending", description="pending, completed, failed, refunded")
    reference_number: Optional[str] = None
    invoice_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    payment_type: Optional[str] = None
    payment_method: Optional[str] = None
    amount: Optional[float] = None
    payment_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_status: Optional[str] = None
    reference_number: Optional[str] = None
    invoice_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(PaymentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    order_id: str
    customer_id: Optional[str] = None
    invoice_type: str = Field(default="standard", description="standard, proforma, credit_note")
    subtotal: float = Field(..., ge=0)
    tax_rate: float = Field(default=0.05, ge=0, le=1)
    tax_amount: float = Field(..., ge=0)
    total_amount: float = Field(..., ge=0)
    currency: str = Field(default="TWD")
    issue_date: date
    due_date: date
    invoice_status: str = Field(default="draft", description="draft, issued, paid, cancelled")
    buyer_name: str
    buyer_tax_id: Optional[str] = None
    buyer_address: Optional[str] = None
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceResponse(InvoiceBase):
    id: str
    invoice_number: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# In-memory storage
payments_db: dict = {}
invoices_db: dict = {}
invoice_counter = 1


@router.get("", response_model=List[PaymentResponse])
async def list_payments(
    order_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    payment_status: Optional[str] = None,
    payment_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """List all payments with optional filtering"""
    results = list(payments_db.values())
    
    if order_id:
        results = [p for p in results if p.get("order_id") == order_id]
    if customer_id:
        results = [p for p in results if p.get("customer_id") == customer_id]
    if payment_status:
        results = [p for p in results if p.get("payment_status") == payment_status]
    if payment_type:
        results = [p for p in results if p.get("payment_type") == payment_type]
    
    return results[skip:skip + limit]


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(payment: PaymentCreate):
    """Create a new payment record"""
    payment_id = f"pay_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    payment_data = {
        "id": payment_id,
        **payment.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    payments_db[payment_id] = payment_data
    return payment_data


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str):
    """Get a specific payment by ID"""
    if payment_id not in payments_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment {payment_id} not found"
        )
    return payments_db[payment_id]


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(payment_id: str, payment: PaymentUpdate):
    """Update a payment record"""
    if payment_id not in payments_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment {payment_id} not found"
        )
    
    existing = payments_db[payment_id]
    update_data = payment.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        existing[key] = value
    
    existing["updated_at"] = datetime.utcnow()
    payments_db[payment_id] = existing
    
    return existing


@router.post("/{payment_id}/complete")
async def complete_payment(payment_id: str, reference_number: Optional[str] = None):
    """Mark a payment as completed"""
    if payment_id not in payments_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment {payment_id} not found"
        )
    
    payments_db[payment_id]["payment_status"] = "completed"
    payments_db[payment_id]["payment_date"] = date.today()
    if reference_number:
        payments_db[payment_id]["reference_number"] = reference_number
    payments_db[payment_id]["updated_at"] = datetime.utcnow()
    
    return {"message": "Payment completed", "payment_id": payment_id}


@router.post("/{payment_id}/refund")
async def refund_payment(payment_id: str, refund_amount: Optional[float] = None, reason: Optional[str] = None):
    """Process a refund for a payment"""
    if payment_id not in payments_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment {payment_id} not found"
        )
    
    original = payments_db[payment_id]
    if original["payment_status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only refund completed payments"
        )
    
    refund_amt = refund_amount or original["amount"]
    
    # Create refund record
    refund_id = f"pay_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    refund_data = {
        "id": refund_id,
        "order_id": original["order_id"],
        "customer_id": original.get("customer_id"),
        "payment_type": "refund",
        "payment_method": original["payment_method"],
        "amount": -refund_amt,
        "currency": original["currency"],
        "exchange_rate": original.get("exchange_rate", 1.0),
        "payment_date": date.today(),
        "payment_status": "completed",
        "reference_number": f"REF-{payment_id}",
        "notes": reason or f"Refund for {payment_id}",
        "created_at": now,
        "updated_at": now
    }
    
    payments_db[refund_id] = refund_data
    payments_db[payment_id]["payment_status"] = "refunded"
    payments_db[payment_id]["updated_at"] = now
    
    return {"message": "Refund processed", "refund_id": refund_id, "refund_amount": refund_amt}


# Invoice endpoints
@router.get("/invoices", response_model=List[InvoiceResponse])
async def list_invoices(
    order_id: Optional[str] = None,
    invoice_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """List all invoices"""
    results = list(invoices_db.values())
    
    if order_id:
        results = [i for i in results if i.get("order_id") == order_id]
    if invoice_status:
        results = [i for i in results if i.get("invoice_status") == invoice_status]
    
    return results[skip:skip + limit]


@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(invoice: InvoiceCreate):
    """Create a new invoice"""
    global invoice_counter
    
    invoice_id = f"inv_{uuid4().hex[:12]}"
    invoice_number = f"INV-{datetime.now().strftime('%Y%m')}-{invoice_counter:05d}"
    invoice_counter += 1
    now = datetime.utcnow()
    
    invoice_data = {
        "id": invoice_id,
        "invoice_number": invoice_number,
        **invoice.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    invoices_db[invoice_id] = invoice_data
    return invoice_data


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str):
    """Get a specific invoice by ID"""
    if invoice_id not in invoices_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {invoice_id} not found"
        )
    return invoices_db[invoice_id]


@router.get("/summary/{order_id}")
async def get_order_payment_summary(order_id: str):
    """Get payment summary for an order"""
    order_payments = [p for p in payments_db.values() if p.get("order_id") == order_id]
    
    total_paid = sum(p["amount"] for p in order_payments if p["payment_status"] == "completed" and p["amount"] > 0)
    total_refunded = abs(sum(p["amount"] for p in order_payments if p["payment_type"] == "refund"))
    pending = sum(p["amount"] for p in order_payments if p["payment_status"] == "pending")
    
    return {
        "order_id": order_id,
        "total_paid": total_paid,
        "total_refunded": total_refunded,
        "net_paid": total_paid - total_refunded,
        "pending_amount": pending,
        "payment_count": len(order_payments)
    }
