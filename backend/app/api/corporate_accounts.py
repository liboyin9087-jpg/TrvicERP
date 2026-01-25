"""
Corporate Accounts API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.schemas import (
    CorporateAccountCreate, CorporateAccountUpdate, CorporateAccountResponse,
    CorporateContactCreate, CorporateContactResponse,
    CorporateEngagementCreate, CorporateEngagementResponse
)
from app.models.models import CorporateAccount, CorporateContact, CorporateEngagement
from uuid import uuid4

router = APIRouter(prefix="/api/v1/corporate-accounts", tags=["Corporate Accounts"])


@router.get("", response_model=List[CorporateAccountResponse])
async def list_corporate_accounts(db: Session = Depends(get_db)):
    """List all corporate accounts"""
    accounts = db.query(CorporateAccount).all()
    return accounts


@router.post("", response_model=CorporateAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_corporate_account(account: CorporateAccountCreate, db: Session = Depends(get_db)):
    """Create a new corporate account"""
    db_account = CorporateAccount(
        id=f"corp_{uuid4().hex[:12]}",
        **account.dict()
    )
    
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    return db_account


@router.get("/{account_id}", response_model=CorporateAccountResponse)
async def get_corporate_account(account_id: str, db: Session = Depends(get_db)):
    """Get corporate account by ID"""
    account = db.query(CorporateAccount).filter(CorporateAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="企業帳戶不存在")
    return account


@router.put("/{account_id}", response_model=CorporateAccountResponse)
async def update_corporate_account(account_id: str, account_update: CorporateAccountUpdate, db: Session = Depends(get_db)):
    """Update corporate account"""
    account = db.query(CorporateAccount).filter(CorporateAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="企業帳戶不存在")
    
    for key, value in account_update.dict(exclude_unset=True).items():
        setattr(account, key, value)
    
    db.commit()
    db.refresh(account)
    
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_corporate_account(account_id: str, db: Session = Depends(get_db)):
    """Delete corporate account"""
    account = db.query(CorporateAccount).filter(CorporateAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="企業帳戶不存在")
    
    db.delete(account)
    db.commit()
    
    return None


# ============ Contacts Sub-resource ============

@router.get("/{account_id}/contacts", response_model=List[CorporateContactResponse])
async def list_contacts(account_id: str, db: Session = Depends(get_db)):
    """List all contacts for a corporate account"""
    account = db.query(CorporateAccount).filter(CorporateAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="企業帳戶不存在")
    
    contacts = db.query(CorporateContact).filter(CorporateContact.company_id == account_id).all()
    return contacts


@router.post("/{account_id}/contacts", response_model=CorporateContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(account_id: str, contact: CorporateContactCreate, db: Session = Depends(get_db)):
    """Create a new contact for a corporate account"""
    account = db.query(CorporateAccount).filter(CorporateAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="企業帳戶不存在")
    
    db_contact = CorporateContact(
        id=f"contact_{uuid4().hex[:12]}",
        company_id=account_id,
        name=contact.name,
        title=contact.title,
        email=contact.email,
        phone=contact.phone,
        is_primary=contact.is_primary
    )
    
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    
    return db_contact


@router.get("/{account_id}/contacts/{contact_id}", response_model=CorporateContactResponse)
async def get_contact(account_id: str, contact_id: str, db: Session = Depends(get_db)):
    """Get a specific contact"""
    contact = db.query(CorporateContact).filter(
        CorporateContact.id == contact_id,
        CorporateContact.company_id == account_id
    ).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="聯絡人不存在")
    return contact


@router.delete("/{account_id}/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(account_id: str, contact_id: str, db: Session = Depends(get_db)):
    """Delete a contact"""
    contact = db.query(CorporateContact).filter(
        CorporateContact.id == contact_id,
        CorporateContact.company_id == account_id
    ).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="聯絡人不存在")
    
    db.delete(contact)
    db.commit()
    
    return None


# ============ Engagements Sub-resource ============

@router.get("/{account_id}/engagements", response_model=List[CorporateEngagementResponse])
async def list_engagements(account_id: str, db: Session = Depends(get_db)):
    """List all engagements for a corporate account"""
    account = db.query(CorporateAccount).filter(CorporateAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="企業帳戶不存在")
    
    engagements = db.query(CorporateEngagement).filter(
        CorporateEngagement.company_id == account_id
    ).order_by(CorporateEngagement.date.desc()).all()
    return engagements


@router.post("/{account_id}/engagements", response_model=CorporateEngagementResponse, status_code=status.HTTP_201_CREATED)
async def create_engagement(account_id: str, engagement: CorporateEngagementCreate, db: Session = Depends(get_db)):
    """Create a new engagement for a corporate account"""
    account = db.query(CorporateAccount).filter(CorporateAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="企業帳戶不存在")
    
    db_engagement = CorporateEngagement(
        id=f"eng_{uuid4().hex[:12]}",
        company_id=account_id,
        type=engagement.type,
        date=engagement.date,
        notes=engagement.notes,
        outcome=engagement.outcome
    )
    
    db.add(db_engagement)
    db.commit()
    db.refresh(db_engagement)
    
    return db_engagement
