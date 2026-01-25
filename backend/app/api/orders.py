"""
Orders API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.schemas import OrderCreate, OrderUpdate, OrderResponse
from app.models.models import Order
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
    """Update order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="訂單不存在")
    
    for key, value in order_update.dict(exclude_unset=True).items():
        setattr(order, key, value)
    
    db.commit()
    db.refresh(order)
    
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(order_id: str, db: Session = Depends(get_db)):
    """Delete order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="訂單不存在")
    
    db.delete(order)
    db.commit()
    
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
