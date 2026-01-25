"""
Polls API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.schemas import PollCreate, PollVote, PollResponse
from app.models.models import Poll
from uuid import uuid4
from datetime import datetime

router = APIRouter(prefix="/api/v1/polls", tags=["Polls"])


@router.get("", response_model=List[PollResponse])
async def list_polls(db: Session = Depends(get_db)):
    """List all polls"""
    polls = db.query(Poll).all()
    return polls


@router.post("", response_model=PollResponse, status_code=status.HTTP_201_CREATED)
async def create_poll(poll: PollCreate, db: Session = Depends(get_db)):
    """Create a new poll"""
    db_poll = Poll(
        id=f"poll_{uuid4().hex[:12]}",
        **poll.dict()
    )
    
    db.add(db_poll)
    db.commit()
    db.refresh(db_poll)
    
    return db_poll


@router.get("/{poll_id}", response_model=PollResponse)
async def get_poll(poll_id: str, db: Session = Depends(get_db)):
    """Get poll by ID"""
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="投票不存在")
    return poll


@router.put("/{poll_id}", response_model=PollResponse)
async def update_poll(poll_id: str, poll_update: PollCreate, db: Session = Depends(get_db)):
    """Update poll"""
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="投票不存在")
    
    for key, value in poll_update.dict(exclude_unset=True).items():
        setattr(poll, key, value)
    
    db.commit()
    db.refresh(poll)
    
    return poll


@router.delete("/{poll_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_poll(poll_id: str, db: Session = Depends(get_db)):
    """Delete poll"""
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="投票不存在")
    
    db.delete(poll)
    db.commit()
    
    return None


@router.post("/{poll_id}/vote", response_model=PollResponse)
async def vote_on_poll(poll_id: str, vote: PollVote, db: Session = Depends(get_db)):
    """Vote on a poll"""
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="投票不存在")
    
    if poll.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="投票已關閉")
    
    # Check if poll has ended
    if poll.end_date and datetime.utcnow() > poll.end_date:
        poll.status = "closed"
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="投票已結束")
    
    # Update vote count for the option
    if poll.options:
        option_found = False
        for option in poll.options:
            if option.get("id") == vote.option_id:
                option["votes"] = option.get("votes", 0) + 1
                option_found = True
                break
        
        if not option_found:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="選項不存在")
    
    db.commit()
    db.refresh(poll)
    
    return poll
