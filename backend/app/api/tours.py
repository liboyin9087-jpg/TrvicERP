"""
Tours API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.schemas import TourCreate, TourUpdate, TourResponse, SessionResponse
from app.models.models import Tour, Session
from uuid import uuid4

router = APIRouter(prefix="/api/v1/tours", tags=["Tours"])


@router.get("", response_model=List[TourResponse])
async def list_tours(db: Session = Depends(get_db)):
    """List all tours"""
    tours = db.query(Tour).all()
    return tours


@router.post("", response_model=TourResponse, status_code=status.HTTP_201_CREATED)
async def create_tour(tour: TourCreate, db: Session = Depends(get_db)):
    """Create a new tour"""
    # Check if tour code already exists
    existing = db.query(Tour).filter(Tour.code == tour.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="行程代碼已存在"
        )
    
    db_tour = Tour(
        id=f"tour_{uuid4().hex[:12]}",
        **tour.dict()
    )
    
    db.add(db_tour)
    db.commit()
    db.refresh(db_tour)
    
    return db_tour


@router.get("/{tour_id}", response_model=TourResponse)
async def get_tour(tour_id: str, db: Session = Depends(get_db)):
    """Get tour by ID"""
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="行程不存在")
    return tour


@router.put("/{tour_id}", response_model=TourResponse)
async def update_tour(tour_id: str, tour_update: TourUpdate, db: Session = Depends(get_db)):
    """Update tour"""
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="行程不存在")
    
    for key, value in tour_update.dict(exclude_unset=True).items():
        setattr(tour, key, value)
    
    db.commit()
    db.refresh(tour)
    
    return tour


@router.delete("/{tour_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tour(tour_id: str, db: Session = Depends(get_db)):
    """Delete tour"""
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="行程不存在")
    
    db.delete(tour)
    db.commit()
    
    return None


@router.get("/{tour_id}/sessions", response_model=List[SessionResponse])
async def get_tour_sessions(tour_id: str, db: Session = Depends(get_db)):
    """Get all sessions for a tour"""
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="行程不存在")
    
    sessions = db.query(Session).filter(Session.tour_id == tour_id).all()
    return sessions
