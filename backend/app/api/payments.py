"""
API routes for Payment Management (AR/AP)
收付款管理 API - 應收帳款 (Accounts Receivable) / 應付帳款 (Accounts Payable)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
from app.models.models import Payment
from app.schemas.schemas import PaymentCreate, PaymentUpdate, PaymentResponse
from app.core.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


@router.get("", response_model=List[PaymentResponse])
async def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    type: Optional[str] = None,  # receivable, payable
    payment_status: Optional[str] = None,
    order_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    reconciled: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all payments with optional filtering"""
    query = db.query(Payment)
    
    if type:
        query = query.filter(Payment.type == type)
    if payment_status:
        query = query.filter(Payment.payment_status == payment_status)
    if order_id:
        query = query.filter(Payment.order_id == order_id)
    if supplier_id:
        query = query.filter(Payment.supplier_id == supplier_id)
    if customer_id:
        query = query.filter(Payment.customer_id == customer_id)
    if reconciled is not None:
        query = query.filter(Payment.reconciled == reconciled)
    
    payments = query.offset(skip).limit(limit).all()
    return payments


@router.get("/receivable", response_model=List[PaymentResponse])
async def list_receivables(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List accounts receivable (AR) - 應收帳款"""
    query = db.query(Payment).filter(Payment.type == "receivable")
    
    if status:
        query = query.filter(Payment.payment_status == status)
    
    payments = query.offset(skip).limit(limit).all()
    return payments


@router.get("/payable", response_model=List[PaymentResponse])
async def list_payables(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List accounts payable (AP) - 應付帳款"""
    query = db.query(Payment).filter(Payment.type == "payable")
    
    if status:
        query = query.filter(Payment.payment_status == status)
    
    payments = query.offset(skip).limit(limit).all()
    return payments


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific payment by ID"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new payment record"""
    payment = Payment(
        id=str(uuid.uuid4()),
        **payment_data.model_dump()
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: str,
    payment_data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an existing payment"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    update_data = payment_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(payment, key, value)
    
    db.commit()
    db.refresh(payment)
    return payment


@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a payment record"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    db.delete(payment)
    db.commit()
    return {"message": "Payment deleted successfully"}


@router.post("/{payment_id}/confirm")
async def confirm_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Confirm a payment"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment.payment_status = "completed"
    payment.paid_date = datetime.utcnow()
    db.commit()
    return {"message": "Payment confirmed successfully"}


@router.post("/{payment_id}/reconcile")
async def reconcile_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Reconcile a payment (mark as reconciled in accounting)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.payment_status != "completed":
        raise HTTPException(status_code=400, detail="Only completed payments can be reconciled")
    
    payment.reconciled = True
    db.commit()
    return {"message": "Payment reconciled successfully"}


@router.get("/overdue/list", response_model=List[PaymentResponse])
async def list_overdue_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List overdue payments (past due date and not completed)"""
    now = datetime.utcnow()
    payments = db.query(Payment).filter(
        Payment.due_date < now,
        Payment.payment_status != "completed",
        Payment.payment_status != "refunded"
    ).offset(skip).limit(limit).all()
    return payments


@router.get("/summary/stats")
async def get_payment_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get payment summary statistics"""
    # Receivables
    total_receivable = db.query(Payment).filter(Payment.type == "receivable").count()
    pending_receivable = db.query(Payment).filter(
        Payment.type == "receivable",
        Payment.payment_status == "pending"
    ).count()
    completed_receivable = db.query(Payment).filter(
        Payment.type == "receivable",
        Payment.payment_status == "completed"
    ).count()
    
    # Payables
    total_payable = db.query(Payment).filter(Payment.type == "payable").count()
    pending_payable = db.query(Payment).filter(
        Payment.type == "payable",
        Payment.payment_status == "pending"
    ).count()
    completed_payable = db.query(Payment).filter(
        Payment.type == "payable",
        Payment.payment_status == "completed"
    ).count()
    
    # Overdue
    now = datetime.utcnow()
    overdue_count = db.query(Payment).filter(
        Payment.due_date < now,
        Payment.payment_status != "completed",
        Payment.payment_status != "refunded"
    ).count()
    
    return {
        "receivable": {
            "total": total_receivable,
            "pending": pending_receivable,
            "completed": completed_receivable
        },
        "payable": {
            "total": total_payable,
            "pending": pending_payable,
            "completed": completed_payable
        },
        "overdue": overdue_count
    }
