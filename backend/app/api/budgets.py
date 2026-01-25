"""
Budgets API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.schemas import BudgetUpdate, BudgetResponse
from app.models.models import Budget

router = APIRouter(prefix="/api/v1/budgets", tags=["Budgets"])


@router.get("", response_model=List[BudgetResponse])
async def list_budgets(db: Session = Depends(get_db)):
    """List all budgets"""
    budgets = db.query(Budget).all()
    return budgets


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: str, db: Session = Depends(get_db)):
    """Get budget by ID"""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="預算不存在")
    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: str, budget_update: BudgetUpdate, db: Session = Depends(get_db)):
    """Update budget"""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="預算不存在")
    
    for key, value in budget_update.dict(exclude_unset=True).items():
        setattr(budget, key, value)
    
    db.commit()
    db.refresh(budget)
    
    return budget
