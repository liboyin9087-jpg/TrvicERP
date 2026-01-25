"""
Quotations API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.schemas import QuotationCreate, QuotationUpdate, QuotationResponse
from app.models.models import Quotation
from uuid import uuid4
from datetime import datetime

router = APIRouter(prefix="/api/v1/quotations", tags=["Quotations"])


@router.get("", response_model=List[QuotationResponse])
async def list_quotations(db: Session = Depends(get_db)):
    """List all quotations"""
    quotations = db.query(Quotation).all()
    return quotations


@router.post("", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED)
async def create_quotation(quotation: QuotationCreate, db: Session = Depends(get_db)):
    """Create a new quotation"""
    db_quotation = Quotation(
        id=f"quot_{uuid4().hex[:12]}",
        quote_number=f"QT-{datetime.now().strftime('%Y%m%d')}-{uuid4().hex[:6].upper()}",
        **quotation.dict()
    )
    
    db.add(db_quotation)
    db.commit()
    db.refresh(db_quotation)
    
    return db_quotation


@router.get("/{quotation_id}", response_model=QuotationResponse)
async def get_quotation(quotation_id: str, db: Session = Depends(get_db)):
    """Get quotation by ID"""
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="報價單不存在")
    return quotation


@router.put("/{quotation_id}", response_model=QuotationResponse)
async def update_quotation(quotation_id: str, quotation_update: QuotationUpdate, db: Session = Depends(get_db)):
    """Update quotation"""
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="報價單不存在")
    
    for key, value in quotation_update.dict(exclude_unset=True).items():
        setattr(quotation, key, value)
    
    db.commit()
    db.refresh(quotation)
    
    return quotation


@router.delete("/{quotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quotation(quotation_id: str, db: Session = Depends(get_db)):
    """Delete quotation"""
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="報價單不存在")
    
    db.delete(quotation)
    db.commit()
    
    return None


@router.post("/{quotation_id}/convert", response_model=dict)
async def convert_quotation(quotation_id: str, db: Session = Depends(get_db)):
    """Convert quotation to order"""
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="報價單不存在")
    
    if quotation.status != "accepted":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能轉換已接受的報價單")
    
    # Return order ID placeholder - actual order creation would be done separately
    order_id = f"ord_{uuid4().hex[:12]}"
    
    return {"order_id": order_id, "message": "報價單已轉換為訂單"}


@router.get("/{quotation_id}/versions", response_model=List[QuotationResponse])
async def get_quotation_versions(quotation_id: str, db: Session = Depends(get_db)):
    """Get all versions of a quotation"""
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="報價單不存在")
    
    # Get all versions with same parent_id or this quotation as parent
    versions = db.query(Quotation).filter(
        (Quotation.parent_id == quotation_id) | 
        (Quotation.parent_id == quotation.parent_id) |
        (Quotation.id == quotation.parent_id)
    ).order_by(Quotation.version).all()
    
    return versions
