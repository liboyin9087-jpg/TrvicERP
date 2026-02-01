"""
Passports API endpoints for TrvicERP
Manages passport information, visa tracking, and document management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import uuid4
from app.db.database import get_db

router = APIRouter(prefix="/api/v1/passports", tags=["Passports"])


# Pydantic Schemas
class PassportBase(BaseModel):
    customer_id: str = Field(..., description="Associated customer ID")
    passport_number: str = Field(..., description="Passport number")
    nationality: str = Field(..., description="Country of citizenship")
    surname: str = Field(..., description="Surname as in passport")
    given_names: str = Field(..., description="Given names as in passport")
    date_of_birth: date
    gender: str = Field(..., description="M, F, or X")
    place_of_birth: Optional[str] = None
    issue_date: date
    expiry_date: date
    issuing_authority: Optional[str] = None
    passport_type: str = Field(default="ordinary", description="ordinary, diplomatic, official, service")
    mrz_line1: Optional[str] = Field(None, description="Machine Readable Zone line 1")
    mrz_line2: Optional[str] = Field(None, description="Machine Readable Zone line 2")
    scan_url: Optional[str] = Field(None, description="URL to passport scan image")
    notes: Optional[str] = None
    is_primary: bool = Field(default=True, description="Primary passport for this customer")


class PassportCreate(PassportBase):
    pass


class PassportUpdate(BaseModel):
    passport_number: Optional[str] = None
    nationality: Optional[str] = None
    surname: Optional[str] = None
    given_names: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    place_of_birth: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    issuing_authority: Optional[str] = None
    mrz_line1: Optional[str] = None
    mrz_line2: Optional[str] = None
    scan_url: Optional[str] = None
    notes: Optional[str] = None
    is_primary: Optional[bool] = None


class PassportResponse(PassportBase):
    id: str
    validity_status: str
    days_until_expiry: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VisaBase(BaseModel):
    passport_id: str = Field(..., description="Associated passport ID")
    country: str = Field(..., description="Visa issuing country")
    visa_type: str = Field(..., description="tourist, business, work, student, transit")
    visa_number: Optional[str] = None
    entries: str = Field(default="single", description="single, double, multiple")
    issue_date: date
    expiry_date: date
    duration_of_stay: Optional[int] = Field(None, description="Maximum days per visit")
    visa_status: str = Field(default="valid", description="valid, expired, cancelled, pending")
    application_date: Optional[date] = None
    notes: Optional[str] = None


class VisaCreate(VisaBase):
    pass


class VisaResponse(VisaBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# In-memory storage
passports_db: dict = {}
visas_db: dict = {}


def calculate_passport_status(expiry_date: date) -> tuple:
    """Calculate passport validity status and days until expiry"""
    today = date.today()
    days_until_expiry = (expiry_date - today).days
    
    if days_until_expiry < 0:
        status = "expired"
    elif days_until_expiry < 30:
        status = "expiring_soon"
    elif days_until_expiry < 180:
        status = "valid_limited"  # Some countries require 6 months validity
    else:
        status = "valid"
    
    return status, days_until_expiry


@router.get("", response_model=List[PassportResponse])
async def list_passports(
    customer_id: Optional[str] = None,
    nationality: Optional[str] = None,
    expiring_within_days: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
):
    """List all passports with optional filtering"""
    results = []
    
    for passport in passports_db.values():
        status, days = calculate_passport_status(passport["expiry_date"])
        passport_with_status = {
            **passport,
            "validity_status": status,
            "days_until_expiry": days
        }
        results.append(passport_with_status)
    
    if customer_id:
        results = [p for p in results if p.get("customer_id") == customer_id]
    if nationality:
        results = [p for p in results if p.get("nationality") == nationality]
    if expiring_within_days:
        results = [p for p in results if p["days_until_expiry"] <= expiring_within_days and p["days_until_expiry"] >= 0]
    
    return results[skip:skip + limit]


@router.post("", response_model=PassportResponse, status_code=status.HTTP_201_CREATED)
async def create_passport(passport: PassportCreate):
    """Create a new passport record"""
    passport_id = f"ppt_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    status, days = calculate_passport_status(passport.expiry_date)
    
    passport_data = {
        "id": passport_id,
        **passport.dict(),
        "validity_status": status,
        "days_until_expiry": days,
        "created_at": now,
        "updated_at": now
    }
    
    passports_db[passport_id] = passport_data
    return passport_data


@router.get("/{passport_id}", response_model=PassportResponse)
async def get_passport(passport_id: str):
    """Get a specific passport by ID"""
    if passport_id not in passports_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Passport {passport_id} not found"
        )
    
    passport = passports_db[passport_id]
    status, days = calculate_passport_status(passport["expiry_date"])
    
    return {
        **passport,
        "validity_status": status,
        "days_until_expiry": days
    }


@router.put("/{passport_id}", response_model=PassportResponse)
async def update_passport(passport_id: str, passport: PassportUpdate):
    """Update a passport record"""
    if passport_id not in passports_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Passport {passport_id} not found"
        )
    
    existing = passports_db[passport_id]
    update_data = passport.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        existing[key] = value
    
    existing["updated_at"] = datetime.utcnow()
    
    status, days = calculate_passport_status(existing["expiry_date"])
    existing["validity_status"] = status
    existing["days_until_expiry"] = days
    
    passports_db[passport_id] = existing
    
    return existing


@router.delete("/{passport_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_passport(passport_id: str):
    """Delete a passport record"""
    if passport_id not in passports_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Passport {passport_id} not found"
        )
    
    del passports_db[passport_id]
    return None


# Visa endpoints
@router.get("/{passport_id}/visas", response_model=List[VisaResponse])
async def list_passport_visas(passport_id: str):
    """List all visas for a passport"""
    if passport_id not in passports_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Passport {passport_id} not found"
        )
    
    return [v for v in visas_db.values() if v.get("passport_id") == passport_id]


@router.post("/{passport_id}/visas", response_model=VisaResponse, status_code=status.HTTP_201_CREATED)
async def create_visa(passport_id: str, visa: VisaCreate):
    """Create a new visa record for a passport"""
    if passport_id not in passports_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Passport {passport_id} not found"
        )
    
    visa_id = f"vis_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    visa_data = {
        "id": visa_id,
        **visa.dict(),
        "passport_id": passport_id,
        "created_at": now,
        "updated_at": now
    }
    
    visas_db[visa_id] = visa_data
    return visa_data


@router.get("/expiring/alerts")
async def get_expiring_passports(days: int = 180):
    """Get passports expiring within specified days"""
    alerts = []
    
    for passport in passports_db.values():
        status, days_left = calculate_passport_status(passport["expiry_date"])
        
        if 0 <= days_left <= days:
            alerts.append({
                "passport_id": passport["id"],
                "customer_id": passport["customer_id"],
                "name": f"{passport['surname']}, {passport['given_names']}",
                "passport_number": passport["passport_number"],
                "expiry_date": passport["expiry_date"],
                "days_until_expiry": days_left,
                "status": status,
                "urgency": "critical" if days_left < 30 else ("warning" if days_left < 90 else "info")
            })
    
    # Sort by days until expiry
    alerts.sort(key=lambda x: x["days_until_expiry"])
    
    return {"alerts": alerts, "total": len(alerts)}


@router.get("/check/travel-ready")
async def check_travel_readiness(customer_id: str, destination_country: str, travel_date: date):
    """Check if customer's passport is travel-ready for a destination"""
    customer_passports = [p for p in passports_db.values() if p.get("customer_id") == customer_id and p.get("is_primary")]
    
    if not customer_passports:
        return {
            "ready": False,
            "reason": "No primary passport found for customer",
            "recommendations": ["Add passport information for this customer"]
        }
    
    passport = customer_passports[0]
    expiry_date = passport["expiry_date"]
    days_until_expiry = (expiry_date - travel_date).days
    
    issues = []
    recommendations = []
    
    # Most countries require 6 months validity
    if days_until_expiry < 180:
        issues.append(f"Passport expires in {days_until_expiry} days - most countries require 6 months validity")
        recommendations.append("Renew passport before travel")
    
    if days_until_expiry < 0:
        issues.append("Passport is expired")
        recommendations.append("Renew passport immediately")
    
    # Check for visas (simplified - in production, use visa requirements database)
    passport_visas = [v for v in visas_db.values() if v.get("passport_id") == passport["id"] and v.get("country") == destination_country]
    
    # Note: This is simplified. In production, check actual visa requirements
    visa_free_countries = ["JP", "KR", "SG", "MY", "TH"]  # Simplified list
    
    if destination_country not in visa_free_countries and not passport_visas:
        issues.append(f"No valid visa found for {destination_country}")
        recommendations.append(f"Apply for {destination_country} visa")
    
    return {
        "ready": len(issues) == 0,
        "passport_id": passport["id"],
        "passport_number": passport["passport_number"],
        "expiry_date": expiry_date,
        "days_until_expiry": days_until_expiry,
        "issues": issues,
        "recommendations": recommendations
    }
