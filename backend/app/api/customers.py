"""
Customers API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.schemas import CustomerCreate, CustomerUpdate, CustomerResponse
from app.models.models import Customer
from uuid import uuid4

router = APIRouter(prefix="/api/v1/customers", tags=["Customers"])


@router.get("", response_model=List[CustomerResponse])
async def list_customers(db: Session = Depends(get_db)):
    """List all customers"""
    customers = db.query(Customer).all()
    return customers


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer"""
    db_customer = Customer(
        id=f"cust_{uuid4().hex[:12]}",
        **customer.dict()
    )
    
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    return db_customer


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, db: Session = Depends(get_db)):
    """Get customer by ID"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="客戶不存在")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, customer_update: CustomerUpdate, db: Session = Depends(get_db)):
    """Update customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="客戶不存在")
    
    for key, value in customer_update.dict(exclude_unset=True).items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    """Delete customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="客戶不存在")
    
    db.delete(customer)
    db.commit()
    
    return None
