"""
Orders API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.schemas import OrderCreate, OrderUpdate, OrderResponse
from app.models.models import Order
from app.core.audit import AuditLogger, get_current_user_id
from uuid import uuid4
from datetime import datetime

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


@router.get("", response_model=List[OrderResponse])
async def list_orders(db: Session = Depends(get_db)):
    """List all orders"""
    orders = db.query(Order).all()
    return orders


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    """Create a new order"""
    db_order = Order(
        id=f"ord_{uuid4().hex[:12]}",
        order_number=f"ORD-{datetime.now().strftime('%Y%m%d')}-{uuid4().hex[:6].upper()}",
        **order.dict()
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Log the creation
    user_id = get_current_user_id()
    AuditLogger.log_create(
        db=db,
        user_id=user_id,
        resource_type="order",
        resource_id=db_order.id,
        new_data=order.dict()
    )
    
    return db_order


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, db: Session = Depends(get_db)):
    """Get order by ID"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="訂單不存在")
    return order


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, order_update: OrderUpdate, db: Session = Depends(get_db)):
    """Update order with optimistic locking"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="訂單不存在")
    
    # Check version for optimistic locking
    if order_update.version is not None and order.version != order_update.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "Version conflict",
                "message": "The resource has been modified by another user",
                "current_version": order.version,
                "provided_version": order_update.version
            }
        )
    
    # Store old values for audit
    old_data = {
        "status": order.status,
        "payment_status": order.payment_status,
        "paid_amount": order.paid_amount,
        "payment_method": order.payment_method,
        "participants": order.participants,
        "notes": order.notes,
        "version": order.version
    }
    
    # Update fields
    update_data = order_update.dict(exclude_unset=True, exclude={"version"})
    for key, value in update_data.items():
        setattr(order, key, value)
    
    # Increment version
    order.version += 1
    
    db.commit()
    db.refresh(order)
    
    # Log the update
    user_id = get_current_user_id()
    AuditLogger.log_update(
        db=db,
        user_id=user_id,
        resource_type="order",
        resource_id=order.id,
        old_data=old_data,
        new_data=update_data
    )
    
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(order_id: str, db: Session = Depends(get_db)):
    """Delete order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="訂單不存在")
    
    # Store old values for audit
    old_data = {
        "order_number": order.order_number,
        "customer_id": order.customer_id,
        "status": order.status,
        "total_amount": order.total_amount
    }
    
    db.delete(order)
    db.commit()
    
    # Log the deletion
    user_id = get_current_user_id()
    AuditLogger.log_delete(
        db=db,
        user_id=user_id,
        resource_type="order",
        resource_id=order_id,
        old_data=old_data
    )
    
    return None


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: str, db: Session = Depends(get_db)):
    """Cancel order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="訂單不存在")
    
    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    
    return order


@router.post("/{order_id}/refund", response_model=OrderResponse)
async def refund_order(order_id: str, db: Session = Depends(get_db)):
    """Refund order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="訂單不存在")
    
    order.status = "refunded"
    order.payment_status = "refunded"
    db.commit()
    db.refresh(order)
    
    return order
