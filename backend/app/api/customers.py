"""
Customers API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.schemas import CustomerCreate, CustomerUpdate, CustomerResponse
from app.models.models import Customer
from app.core.audit import AuditLogger, get_current_user_id
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
        version=1,
        **customer.dict()
    )
    
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    # Log the creation
    user_id = get_current_user_id()
    AuditLogger.log_create(
        db=db,
        user_id=user_id,
        resource_type="customer",
        resource_id=db_customer.id,
        new_data=customer.dict()
    )
    
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
    """Update customer with optimistic locking"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="客戶不存在")
    
    # Check version for optimistic locking
    if customer_update.version is not None and customer.version != customer_update.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "Version conflict",
                "message": "The resource has been modified by another user",
                "current_version": customer.version,
                "provided_version": customer_update.version
            }
        )
    
    # Store old values for audit
    old_data = {
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "version": customer.version
    }
    
    # Update fields
    update_data = customer_update.dict(exclude_unset=True, exclude={"version"})
    for key, value in update_data.items():
        setattr(customer, key, value)
    
    # Increment version
    customer.version += 1
    
    db.commit()
    db.refresh(customer)
    
    # Log the update
    user_id = get_current_user_id()
    AuditLogger.log_update(
        db=db,
        user_id=user_id,
        resource_type="customer",
        resource_id=customer.id,
        old_data=old_data,
        new_data=update_data
    )
    
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    """Delete customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="客戶不存在")
    
    # Store old values for audit
    old_data = {
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone
    }
    
    db.delete(customer)
    db.commit()
    
    # Log the deletion
    user_id = get_current_user_id()
    AuditLogger.log_delete(
        db=db,
        user_id=user_id,
        resource_type="customer",
        resource_id=customer_id,
        old_data=old_data
    )
    
    return None
