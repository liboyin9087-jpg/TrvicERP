"""
Sessions API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from typing import List
from app.db.database import get_db
from app.schemas.schemas import SessionCreate, SessionUpdate, SessionResponse
from app.models.models import Session, Tour
from uuid import uuid4
from datetime import datetime

router = APIRouter(prefix="/api/v1/sessions", tags=["Sessions"])


@router.get("", response_model=List[SessionResponse])
async def list_sessions(db: DBSession = Depends(get_db)):
    """List all sessions"""
    sessions = db.query(Session).all()
    return sessions


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(session: SessionCreate, db: DBSession = Depends(get_db)):
    """Create a new session"""
    # Verify tour exists
    tour = db.query(Tour).filter(Tour.id == session.tour_id).first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="行程不存在")
    
    # Check if group number already exists
    existing = db.query(Session).filter(Session.group_number == session.group_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="團號已存在"
        )
    
    db_session = Session(
        id=f"sess_{uuid4().hex[:12]}",
        **session.dict()
    )
    
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    return db_session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: DBSession = Depends(get_db)):
    """Get session by ID"""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="團次不存在")
    return session


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(session_id: str, session_update: SessionUpdate, db: DBSession = Depends(get_db)):
    """Update session"""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="團次不存在")
    
    for key, value in session_update.dict(exclude_unset=True).items():
        setattr(session, key, value)
    
    db.commit()
    db.refresh(session)
    
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str, db: DBSession = Depends(get_db)):
    """Delete session"""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="團次不存在")
    
    db.delete(session)
    db.commit()
    
    return None
