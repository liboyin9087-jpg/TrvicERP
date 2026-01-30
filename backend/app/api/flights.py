"""
API routes for Flight/Ticket Management
航班/機票管理 API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
from app.models.models import Flight
from app.schemas.schemas import FlightCreate, FlightUpdate, FlightResponse
from app.core.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/v1/flights", tags=["flights"])


@router.get("", response_model=List[FlightResponse])
async def list_flights(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    session_id: Optional[str] = None,
    order_id: Optional[str] = None,
    ticket_status: Optional[str] = None,
    airline: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all flights with optional filtering"""
    query = db.query(Flight)
    
    if session_id:
        query = query.filter(Flight.session_id == session_id)
    if order_id:
        query = query.filter(Flight.order_id == order_id)
    if ticket_status:
        query = query.filter(Flight.ticket_status == ticket_status)
    if airline:
        query = query.filter(Flight.airline == airline)
    
    flights = query.offset(skip).limit(limit).all()
    return flights


@router.get("/{flight_id}", response_model=FlightResponse)
async def get_flight(
    flight_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific flight by ID"""
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    return flight


@router.get("/pnr/{pnr}", response_model=FlightResponse)
async def get_flight_by_pnr(
    pnr: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific flight by PNR (Passenger Name Record)"""
    flight = db.query(Flight).filter(Flight.pnr == pnr).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    return flight


@router.post("", response_model=FlightResponse)
async def create_flight(
    flight_data: FlightCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new flight booking"""
    flight = Flight(
        id=str(uuid.uuid4()),
        **flight_data.model_dump()
    )
    db.add(flight)
    db.commit()
    db.refresh(flight)
    return flight


@router.put("/{flight_id}", response_model=FlightResponse)
async def update_flight(
    flight_id: str,
    flight_data: FlightUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an existing flight"""
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    update_data = flight_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(flight, key, value)
    
    db.commit()
    db.refresh(flight)
    return flight


@router.delete("/{flight_id}")
async def delete_flight(
    flight_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a flight"""
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    db.delete(flight)
    db.commit()
    return {"message": "Flight deleted successfully"}


@router.post("/{flight_id}/confirm")
async def confirm_flight(
    flight_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Confirm a flight booking"""
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    flight.ticket_status = "confirmed"
    db.commit()
    return {"message": "Flight confirmed successfully"}


@router.post("/{flight_id}/ticket")
async def issue_ticket(
    flight_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Issue ticket for a confirmed flight"""
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    if flight.ticket_status != "confirmed":
        raise HTTPException(status_code=400, detail="Flight must be confirmed before issuing ticket")
    
    flight.ticket_status = "ticketed"
    db.commit()
    return {"message": "Ticket issued successfully"}


@router.post("/{flight_id}/cancel")
async def cancel_flight(
    flight_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cancel a flight booking"""
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    flight.ticket_status = "cancelled"
    db.commit()
    return {"message": "Flight cancelled successfully"}


@router.post("/{flight_id}/refund")
async def refund_flight(
    flight_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Process refund for a cancelled flight"""
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    if flight.ticket_status != "cancelled":
        raise HTTPException(status_code=400, detail="Flight must be cancelled before refunding")
    
    flight.ticket_status = "refunded"
    db.commit()
    return {"message": "Flight refunded successfully"}
