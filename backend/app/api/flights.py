"""
Flights API endpoints for TrvicERP
Manages flight bookings, tracking, and airline integration
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, date, time
from uuid import uuid4
from app.db.database import get_db

router = APIRouter(prefix="/api/v1/flights", tags=["Flights"])


# Pydantic Schemas
class FlightSegment(BaseModel):
    airline_code: str = Field(..., description="IATA airline code (e.g., CI, BR)")
    flight_number: str = Field(..., description="Flight number")
    departure_airport: str = Field(..., description="IATA airport code")
    arrival_airport: str = Field(..., description="IATA airport code")
    departure_date: date
    departure_time: time
    arrival_date: date
    arrival_time: time
    cabin_class: str = Field(default="economy", description="economy, business, first")
    aircraft_type: Optional[str] = None
    meal_included: bool = True
    baggage_allowance: Optional[str] = Field(default="30kg")


class FlightBookingBase(BaseModel):
    tour_id: Optional[str] = None
    order_id: Optional[str] = None
    booking_reference: Optional[str] = None
    pnr: Optional[str] = Field(None, description="Passenger Name Record")
    segments: List[FlightSegment]
    total_passengers: int = Field(..., ge=1)
    total_price: float = Field(..., ge=0)
    currency: str = Field(default="TWD")
    booking_status: str = Field(default="pending", description="pending, confirmed, ticketed, cancelled")
    ticketing_deadline: Optional[datetime] = None
    notes: Optional[str] = None


class FlightBookingCreate(FlightBookingBase):
    pass


class FlightBookingUpdate(BaseModel):
    booking_reference: Optional[str] = None
    pnr: Optional[str] = None
    segments: Optional[List[FlightSegment]] = None
    total_passengers: Optional[int] = None
    total_price: Optional[float] = None
    booking_status: Optional[str] = None
    ticketing_deadline: Optional[datetime] = None
    notes: Optional[str] = None


class FlightBookingResponse(FlightBookingBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# In-memory storage (replace with database model in production)
flights_db: dict = {}


@router.get("", response_model=List[FlightBookingResponse])
async def list_flight_bookings(
    tour_id: Optional[str] = None,
    order_id: Optional[str] = None,
    booking_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """List all flight bookings with optional filtering"""
    results = list(flights_db.values())
    
    if tour_id:
        results = [f for f in results if f.get("tour_id") == tour_id]
    if order_id:
        results = [f for f in results if f.get("order_id") == order_id]
    if booking_status:
        results = [f for f in results if f.get("booking_status") == booking_status]
    
    return results[skip:skip + limit]


@router.post("", response_model=FlightBookingResponse, status_code=status.HTTP_201_CREATED)
async def create_flight_booking(booking: FlightBookingCreate):
    """Create a new flight booking"""
    booking_id = f"flt_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    booking_data = {
        "id": booking_id,
        **booking.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    flights_db[booking_id] = booking_data
    return booking_data


@router.get("/{booking_id}", response_model=FlightBookingResponse)
async def get_flight_booking(booking_id: str):
    """Get a specific flight booking by ID"""
    if booking_id not in flights_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight booking {booking_id} not found"
        )
    return flights_db[booking_id]


@router.put("/{booking_id}", response_model=FlightBookingResponse)
async def update_flight_booking(booking_id: str, booking: FlightBookingUpdate):
    """Update a flight booking"""
    if booking_id not in flights_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight booking {booking_id} not found"
        )
    
    existing = flights_db[booking_id]
    update_data = booking.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        existing[key] = value
    
    existing["updated_at"] = datetime.utcnow()
    flights_db[booking_id] = existing
    
    return existing


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flight_booking(booking_id: str):
    """Delete a flight booking"""
    if booking_id not in flights_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight booking {booking_id} not found"
        )
    
    del flights_db[booking_id]
    return None


@router.post("/{booking_id}/confirm")
async def confirm_flight_booking(booking_id: str, pnr: str):
    """Confirm a flight booking with PNR"""
    if booking_id not in flights_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight booking {booking_id} not found"
        )
    
    flights_db[booking_id]["pnr"] = pnr
    flights_db[booking_id]["booking_status"] = "confirmed"
    flights_db[booking_id]["updated_at"] = datetime.utcnow()
    
    return {"message": "Booking confirmed", "pnr": pnr}


@router.post("/{booking_id}/ticket")
async def issue_tickets(booking_id: str, ticket_numbers: List[str]):
    """Issue tickets for a confirmed booking"""
    if booking_id not in flights_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight booking {booking_id} not found"
        )
    
    booking = flights_db[booking_id]
    if booking["booking_status"] != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking must be confirmed before ticketing"
        )
    
    flights_db[booking_id]["booking_status"] = "ticketed"
    flights_db[booking_id]["ticket_numbers"] = ticket_numbers
    flights_db[booking_id]["updated_at"] = datetime.utcnow()
    
    return {"message": "Tickets issued", "ticket_numbers": ticket_numbers}


@router.get("/airlines/list")
async def list_airlines():
    """List common airlines for Taiwan market"""
    return {
        "airlines": [
            {"code": "CI", "name": "中華航空", "name_en": "China Airlines"},
            {"code": "BR", "name": "長榮航空", "name_en": "EVA Air"},
            {"code": "IT", "name": "台灣虎航", "name_en": "Tigerair Taiwan"},
            {"code": "JX", "name": "星宇航空", "name_en": "Starlux Airlines"},
            {"code": "B7", "name": "立榮航空", "name_en": "UNI Air"},
            {"code": "AE", "name": "華信航空", "name_en": "Mandarin Airlines"},
            {"code": "CX", "name": "國泰航空", "name_en": "Cathay Pacific"},
            {"code": "SQ", "name": "新加坡航空", "name_en": "Singapore Airlines"},
            {"code": "JL", "name": "日本航空", "name_en": "Japan Airlines"},
            {"code": "NH", "name": "全日空", "name_en": "All Nippon Airways"}
        ]
    }
