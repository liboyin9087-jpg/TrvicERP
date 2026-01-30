"""
API routes for Insurance, Hotel Allotment, Notifications, and Exchange Rates
保險、飯店房控、通知、匯率管理 API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
from app.models.models import Insurance, HotelAllotment, Notification, ExchangeRate
from app.schemas.schemas import (
    InsuranceCreate, InsuranceUpdate, InsuranceResponse,
    HotelAllotmentCreate, HotelAllotmentUpdate, HotelAllotmentResponse,
    NotificationCreate, NotificationUpdate, NotificationResponse,
    ExchangeRateCreate, ExchangeRateUpdate, ExchangeRateResponse
)
from app.core.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/v1", tags=["operations"])


# ============ Insurance Endpoints ============

@router.get("/insurances", response_model=List[InsuranceResponse])
async def list_insurances(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    order_id: Optional[str] = None,
    session_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all insurance records"""
    query = db.query(Insurance)
    
    if order_id:
        query = query.filter(Insurance.order_id == order_id)
    if session_id:
        query = query.filter(Insurance.session_id == session_id)
    if status:
        query = query.filter(Insurance.status == status)
    
    insurances = query.offset(skip).limit(limit).all()
    return insurances


@router.get("/insurances/{insurance_id}", response_model=InsuranceResponse)
async def get_insurance(
    insurance_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific insurance record"""
    insurance = db.query(Insurance).filter(Insurance.id == insurance_id).first()
    if not insurance:
        raise HTTPException(status_code=404, detail="Insurance not found")
    return insurance


@router.post("/insurances", response_model=InsuranceResponse)
async def create_insurance(
    insurance_data: InsuranceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new insurance record"""
    insurance = Insurance(
        id=str(uuid.uuid4()),
        **insurance_data.model_dump()
    )
    db.add(insurance)
    db.commit()
    db.refresh(insurance)
    return insurance


@router.put("/insurances/{insurance_id}", response_model=InsuranceResponse)
async def update_insurance(
    insurance_id: str,
    insurance_data: InsuranceUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an existing insurance record"""
    insurance = db.query(Insurance).filter(Insurance.id == insurance_id).first()
    if not insurance:
        raise HTTPException(status_code=404, detail="Insurance not found")
    
    update_data = insurance_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(insurance, key, value)
    
    db.commit()
    db.refresh(insurance)
    return insurance


@router.delete("/insurances/{insurance_id}")
async def delete_insurance(
    insurance_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete an insurance record"""
    insurance = db.query(Insurance).filter(Insurance.id == insurance_id).first()
    if not insurance:
        raise HTTPException(status_code=404, detail="Insurance not found")
    
    db.delete(insurance)
    db.commit()
    return {"message": "Insurance deleted successfully"}


# ============ Hotel Allotment Endpoints ============

@router.get("/hotel-allotments", response_model=List[HotelAllotmentResponse])
async def list_hotel_allotments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    session_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all hotel allotments"""
    query = db.query(HotelAllotment)
    
    if session_id:
        query = query.filter(HotelAllotment.session_id == session_id)
    if supplier_id:
        query = query.filter(HotelAllotment.supplier_id == supplier_id)
    if status:
        query = query.filter(HotelAllotment.status == status)
    
    allotments = query.offset(skip).limit(limit).all()
    return allotments


@router.get("/hotel-allotments/{allotment_id}", response_model=HotelAllotmentResponse)
async def get_hotel_allotment(
    allotment_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific hotel allotment"""
    allotment = db.query(HotelAllotment).filter(HotelAllotment.id == allotment_id).first()
    if not allotment:
        raise HTTPException(status_code=404, detail="Hotel allotment not found")
    return allotment


@router.post("/hotel-allotments", response_model=HotelAllotmentResponse)
async def create_hotel_allotment(
    allotment_data: HotelAllotmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new hotel allotment"""
    # Calculate available rooms
    available_rooms = allotment_data.total_rooms - allotment_data.allocated_rooms
    
    allotment = HotelAllotment(
        id=str(uuid.uuid4()),
        **allotment_data.model_dump(),
        available_rooms=available_rooms
    )
    db.add(allotment)
    db.commit()
    db.refresh(allotment)
    return allotment


@router.put("/hotel-allotments/{allotment_id}", response_model=HotelAllotmentResponse)
async def update_hotel_allotment(
    allotment_id: str,
    allotment_data: HotelAllotmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an existing hotel allotment"""
    allotment = db.query(HotelAllotment).filter(HotelAllotment.id == allotment_id).first()
    if not allotment:
        raise HTTPException(status_code=404, detail="Hotel allotment not found")
    
    update_data = allotment_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(allotment, key, value)
    
    # Always recalculate available rooms when allocated_rooms changes
    if 'allocated_rooms' in update_data or 'total_rooms' in update_data:
        allotment.available_rooms = allotment.total_rooms - allotment.allocated_rooms
    
    db.commit()
    db.refresh(allotment)
    return allotment


@router.post("/hotel-allotments/{allotment_id}/allocate")
async def allocate_rooms(
    allotment_id: str,
    rooms_to_allocate: int = Query(..., gt=0, description="Number of rooms to allocate (must be positive)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Allocate rooms from an allotment"""
    allotment = db.query(HotelAllotment).filter(HotelAllotment.id == allotment_id).first()
    if not allotment:
        raise HTTPException(status_code=404, detail="Hotel allotment not found")
    
    # Check if cutoff date has passed
    if allotment.cutoff_date and allotment.cutoff_date < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Cutoff date has passed")
    
    # Calculate available rooms if not set
    if allotment.available_rooms is None:
        allotment.available_rooms = allotment.total_rooms - (allotment.allocated_rooms or 0)
    
    # Check if enough rooms are available
    if allotment.available_rooms < rooms_to_allocate:
        raise HTTPException(status_code=400, detail="Not enough rooms available")
    
    allotment.allocated_rooms += rooms_to_allocate
    allotment.available_rooms -= rooms_to_allocate
    db.commit()
    
    return {"message": f"{rooms_to_allocate} rooms allocated successfully"}


# ============ Notification Endpoints ============

@router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    user_id: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all notifications"""
    query = db.query(Notification)
    
    if user_id:
        query = query.filter(Notification.user_id == user_id)
    if type:
        query = query.filter(Notification.type == type)
    if status:
        query = query.filter(Notification.status == status)
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications


@router.post("/notifications", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new notification"""
    notification = Notification(
        id=str(uuid.uuid4()),
        **notification_data.model_dump()
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/notifications/{notification_id}/mark-read")
async def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read_at = datetime.utcnow()
    db.commit()
    return {"message": "Notification marked as read"}


@router.post("/notifications/{notification_id}/send")
async def send_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Send a notification (mark as sent)"""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.status = "sent"
    notification.sent_at = datetime.utcnow()
    db.commit()
    return {"message": "Notification sent"}


# ============ Exchange Rate Endpoints ============

@router.get("/exchange-rates", response_model=List[ExchangeRateResponse])
async def list_exchange_rates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    base_currency: Optional[str] = None,
    target_currency: Optional[str] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all exchange rates"""
    query = db.query(ExchangeRate)
    
    if base_currency:
        query = query.filter(ExchangeRate.base_currency == base_currency)
    if target_currency:
        query = query.filter(ExchangeRate.target_currency == target_currency)
    if is_active is not None:
        query = query.filter(ExchangeRate.is_active == is_active)
    
    rates = query.offset(skip).limit(limit).all()
    return rates


@router.get("/exchange-rates/{rate_id}", response_model=ExchangeRateResponse)
async def get_exchange_rate(
    rate_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific exchange rate"""
    rate = db.query(ExchangeRate).filter(ExchangeRate.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Exchange rate not found")
    return rate


@router.post("/exchange-rates", response_model=ExchangeRateResponse)
async def create_exchange_rate(
    rate_data: ExchangeRateCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new exchange rate"""
    rate = ExchangeRate(
        id=str(uuid.uuid4()),
        **rate_data.model_dump()
    )
    db.add(rate)
    db.commit()
    db.refresh(rate)
    return rate


@router.put("/exchange-rates/{rate_id}", response_model=ExchangeRateResponse)
async def update_exchange_rate(
    rate_id: str,
    rate_data: ExchangeRateUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an existing exchange rate"""
    rate = db.query(ExchangeRate).filter(ExchangeRate.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Exchange rate not found")
    
    update_data = rate_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rate, key, value)
    
    db.commit()
    db.refresh(rate)
    return rate


@router.get("/exchange-rates/convert")
async def convert_currency(
    amount: float = Query(..., gt=0, description="Amount to convert (must be positive)"),
    from_currency: str = Query(..., description="Source currency code"),
    to_currency: str = Query(..., description="Target currency code"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Convert amount from one currency to another"""
    # Find active exchange rate
    rate = db.query(ExchangeRate).filter(
        ExchangeRate.base_currency == from_currency,
        ExchangeRate.target_currency == to_currency,
        ExchangeRate.is_active == True
    ).order_by(ExchangeRate.valid_from.desc()).first()
    
    if not rate:
        raise HTTPException(status_code=404, detail=f"No active exchange rate found for {from_currency} to {to_currency}")
    
    converted_amount = amount * rate.rate
    
    return {
        "from_currency": from_currency,
        "to_currency": to_currency,
        "original_amount": amount,
        "exchange_rate": rate.rate,
        "converted_amount": converted_amount
    }
