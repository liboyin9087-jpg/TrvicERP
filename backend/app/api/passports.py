"""
API routes for Passport & Visa Management
護照與簽證管理 API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.models import Passport, Visa
from app.schemas.schemas import (
    PassportCreate, PassportUpdate, PassportResponse,
    VisaCreate, VisaUpdate, VisaResponse
)
from app.core.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/v1/passports", tags=["passports"])


# ============ Passport Endpoints ============

@router.get("", response_model=List[PassportResponse])
async def list_passports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = None,
    session_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all passports with optional filtering"""
    query = db.query(Passport)
    
    if status:
        query = query.filter(Passport.status == status)
    if session_id:
        query = query.filter(Passport.session_id == session_id)
    if customer_id:
        query = query.filter(Passport.customer_id == customer_id)
    
    passports = query.offset(skip).limit(limit).all()
    return passports


@router.get("/expiring", response_model=List[PassportResponse])
async def list_expiring_passports(
    days: int = Query(90, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List passports expiring within specified days"""
    # Note: This is a simplified check. In production, convert expiry_date string to datetime for proper comparison
    passports = db.query(Passport).filter(Passport.status != "expired").all()
    
    # Filter by expiry date (simplified - in production use proper date parsing)
    expiring_soon = []
    for passport in passports:
        if passport.expiry_date:
            try:
                # Assuming expiry_date format is YYYY-MM-DD
                expiry = datetime.strptime(passport.expiry_date, "%Y-%m-%d")
                if expiry <= datetime.utcnow() + timedelta(days=days):
                    expiring_soon.append(passport)
            except ValueError:
                # Skip passports with invalid date format
                pass
    
    return expiring_soon


@router.get("/{passport_id}", response_model=PassportResponse)
async def get_passport(
    passport_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific passport by ID"""
    passport = db.query(Passport).filter(Passport.id == passport_id).first()
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not found")
    return passport


@router.post("", response_model=PassportResponse)
async def create_passport(
    passport_data: PassportCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new passport record"""
    passport = Passport(
        id=str(uuid.uuid4()),
        **passport_data.model_dump()
    )
    db.add(passport)
    db.commit()
    db.refresh(passport)
    return passport


@router.put("/{passport_id}", response_model=PassportResponse)
async def update_passport(
    passport_id: str,
    passport_data: PassportUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an existing passport"""
    passport = db.query(Passport).filter(Passport.id == passport_id).first()
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not found")
    
    update_data = passport_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(passport, key, value)
    
    db.commit()
    db.refresh(passport)
    return passport


@router.delete("/{passport_id}")
async def delete_passport(
    passport_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a passport record"""
    passport = db.query(Passport).filter(Passport.id == passport_id).first()
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not found")
    
    db.delete(passport)
    db.commit()
    return {"message": "Passport deleted successfully"}


@router.post("/{passport_id}/review")
async def review_passport(
    passport_id: str,
    approved: bool,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Review a passport submission"""
    passport = db.query(Passport).filter(Passport.id == passport_id).first()
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not found")
    
    passport.status = "approved" if approved else "reviewing"
    passport.reviewed_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Passport {'approved' if approved else 'under review'}"}


@router.get("/{passport_id}/visas", response_model=List[VisaResponse])
async def get_passport_visas(
    passport_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all visas for a specific passport"""
    visas = db.query(Visa).filter(Visa.passport_id == passport_id).all()
    return visas


# ============ Visa Endpoints ============

@router.post("/{passport_id}/visas", response_model=VisaResponse)
async def create_visa(
    passport_id: str,
    visa_data: VisaCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a visa application for a passport"""
    # Verify passport exists
    passport = db.query(Passport).filter(Passport.id == passport_id).first()
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not found")
    
    visa = Visa(
        id=str(uuid.uuid4()),
        **visa_data.model_dump()
    )
    db.add(visa)
    db.commit()
    db.refresh(visa)
    return visa


@router.get("/visas/{visa_id}", response_model=VisaResponse)
async def get_visa(
    visa_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific visa by ID"""
    visa = db.query(Visa).filter(Visa.id == visa_id).first()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa not found")
    return visa


@router.put("/visas/{visa_id}", response_model=VisaResponse)
async def update_visa(
    visa_id: str,
    visa_data: VisaUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an existing visa"""
    visa = db.query(Visa).filter(Visa.id == visa_id).first()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa not found")
    
    update_data = visa_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(visa, key, value)
    
    db.commit()
    db.refresh(visa)
    return visa


@router.delete("/visas/{visa_id}")
async def delete_visa(
    visa_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a visa record"""
    visa = db.query(Visa).filter(Visa.id == visa_id).first()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa not found")
    
    db.delete(visa)
    db.commit()
    return {"message": "Visa deleted successfully"}


@router.post("/visas/{visa_id}/approve")
async def approve_visa(
    visa_id: str,
    visa_number: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Approve a visa application"""
    visa = db.query(Visa).filter(Visa.id == visa_id).first()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa not found")
    
    visa.application_status = "approved"
    visa.approval_date = datetime.utcnow()
    visa.visa_number = visa_number
    db.commit()
    
    return {"message": "Visa approved successfully"}


@router.post("/visas/{visa_id}/reject")
async def reject_visa(
    visa_id: str,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Reject a visa application"""
    visa = db.query(Visa).filter(Visa.id == visa_id).first()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa not found")
    
    visa.application_status = "rejected"
    if reason:
        visa.notes = reason
    db.commit()
    
    return {"message": "Visa rejected"}
