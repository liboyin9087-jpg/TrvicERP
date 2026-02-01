"""
Suppliers API endpoints for TrvicERP
Manages supplier relationships, contracts, and services
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4
from app.db.database import get_db

router = APIRouter(prefix="/api/v1/suppliers", tags=["Suppliers"])


# Pydantic Schemas
class SupplierBase(BaseModel):
    name: str = Field(..., description="Supplier company name")
    supplier_type: str = Field(..., description="Type: hotel, airline, transport, restaurant, guide, insurance")
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    currency: str = Field(default="TWD", description="Preferred currency")
    payment_terms: Optional[str] = Field(default="NET30", description="Payment terms")
    rating: Optional[float] = Field(default=0.0, ge=0, le=5)
    notes: Optional[str] = None
    is_active: bool = True


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    supplier_type: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    payment_terms: Optional[str] = None
    rating: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierResponse(SupplierBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# In-memory storage (replace with database model in production)
suppliers_db: dict = {}


@router.get("", response_model=List[SupplierResponse])
async def list_suppliers(
    supplier_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    country: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """List all suppliers with optional filtering"""
    results = list(suppliers_db.values())
    
    if supplier_type:
        results = [s for s in results if s.get("supplier_type") == supplier_type]
    if is_active is not None:
        results = [s for s in results if s.get("is_active") == is_active]
    if country:
        results = [s for s in results if s.get("country") == country]
    
    return results[skip:skip + limit]


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_supplier(supplier: SupplierCreate):
    """Create a new supplier"""
    supplier_id = f"sup_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    supplier_data = {
        "id": supplier_id,
        **supplier.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    suppliers_db[supplier_id] = supplier_data
    return supplier_data


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: str):
    """Get a specific supplier by ID"""
    if supplier_id not in suppliers_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier {supplier_id} not found"
        )
    return suppliers_db[supplier_id]


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: str, supplier: SupplierUpdate):
    """Update a supplier"""
    if supplier_id not in suppliers_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier {supplier_id} not found"
        )
    
    existing = suppliers_db[supplier_id]
    update_data = supplier.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        existing[key] = value
    
    existing["updated_at"] = datetime.utcnow()
    suppliers_db[supplier_id] = existing
    
    return existing


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier(supplier_id: str):
    """Delete a supplier"""
    if supplier_id not in suppliers_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier {supplier_id} not found"
        )
    
    del suppliers_db[supplier_id]
    return None


@router.get("/types/list")
async def list_supplier_types():
    """List all available supplier types"""
    return {
        "types": [
            {"id": "hotel", "name": "飯店/住宿", "name_en": "Hotel/Accommodation"},
            {"id": "airline", "name": "航空公司", "name_en": "Airline"},
            {"id": "transport", "name": "交通運輸", "name_en": "Transportation"},
            {"id": "restaurant", "name": "餐廳", "name_en": "Restaurant"},
            {"id": "guide", "name": "導遊/領隊", "name_en": "Tour Guide"},
            {"id": "insurance", "name": "保險公司", "name_en": "Insurance"},
            {"id": "attraction", "name": "景點/門票", "name_en": "Attraction/Ticket"},
            {"id": "other", "name": "其他", "name_en": "Other"}
        ]
    }
