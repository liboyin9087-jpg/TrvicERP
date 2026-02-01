"""
Database models for TrvicERP
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, nullable=False, default="staff")  # admin, manager, sales, operator, finance, welfare, traveler
    avatar_url = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    orders = relationship("Order", back_populates="created_by_user")
    quotations = relationship("Quotation", back_populates="created_by_user")


class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, index=True)
    phone = Column(String)
    id_number = Column(String)  # 身份證字號
    passport_number = Column(String)
    date_of_birth = Column(String)
    address = Column(String)
    emergency_contact = Column(String)
    emergency_phone = Column(String)
    dietary_restrictions = Column(String)
    medical_notes = Column(Text)
    tags = Column(JSON)  # 客戶標籤
    version = Column(Integer, default=1, nullable=False)  # For optimistic locking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    orders = relationship("Order", back_populates="customer")


class CorporateAccount(Base):
    __tablename__ = "corporate_accounts"
    
    id = Column(String, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    tax_id = Column(String)
    industry = Column(String)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    website = Column(String)
    account_manager_id = Column(String, ForeignKey("users.id"))
    status = Column(String, default="active")  # active, inactive
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    contacts = relationship("CorporateContact", back_populates="company")
    engagements = relationship("CorporateEngagement", back_populates="company")


class CorporateContact(Base):
    __tablename__ = "corporate_contacts"
    
    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("corporate_accounts.id"), nullable=False)
    name = Column(String, nullable=False)
    title = Column(String)
    email = Column(String)
    phone = Column(String)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("CorporateAccount", back_populates="contacts")


class CorporateEngagement(Base):
    __tablename__ = "corporate_engagements"
    
    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("corporate_accounts.id"), nullable=False)
    type = Column(String, nullable=False)  # meeting, call, email, proposal
    date = Column(DateTime, nullable=False)
    notes = Column(Text)
    outcome = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("CorporateAccount", back_populates="engagements")


class Tour(Base):
    __tablename__ = "tours"
    
    id = Column(String, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    destination = Column(String)
    days = Column(Integer)
    nights = Column(Integer)
    description = Column(Text)
    itinerary = Column(JSON)  # 行程細節
    inclusions = Column(JSON)  # 包含項目
    exclusions = Column(JSON)  # 不包含項目
    base_price = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="tour")


class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True, index=True)
    tour_id = Column(String, ForeignKey("tours.id"), nullable=False)
    group_number = Column(String, unique=True, index=True, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    max_participants = Column(Integer)
    current_participants = Column(Integer, default=0)
    status = Column(String, default="planned")  # planned, confirmed, ongoing, completed, cancelled
    leader_id = Column(String, ForeignKey("users.id"))
    meeting_location = Column(String)
    meeting_time = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tour = relationship("Tour", back_populates="sessions")
    orders = relationship("Order", back_populates="session")


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    session_id = Column(String, ForeignKey("sessions.id"))
    status = Column(String, default="pending")  # pending, confirmed, paid, cancelled, refunded
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0)
    payment_method = Column(String)
    payment_status = Column(String, default="unpaid")  # unpaid, partial, paid, refunded
    participants = Column(JSON)  # 參團人員資料
    notes = Column(Text)
    created_by = Column(String, ForeignKey("users.id"))
    version = Column(Integer, default=1, nullable=False)  # For optimistic locking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="orders")
    session = relationship("Session", back_populates="orders")
    created_by_user = relationship("User", back_populates="orders")


class Quotation(Base):
    __tablename__ = "quotations"
    
    id = Column(String, primary_key=True, index=True)
    quote_number = Column(String, unique=True, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String)
    customer_phone = Column(String)
    destination = Column(String)
    travel_dates = Column(String)
    participants = Column(Integer)
    items = Column(JSON)  # 報價項目
    total_amount = Column(Float)
    status = Column(String, default="draft")  # draft, sent, accepted, rejected, expired
    valid_until = Column(DateTime)
    notes = Column(Text)
    version = Column(Integer, default=1)
    parent_id = Column(String)  # 用於版本管理
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by_user = relationship("User", back_populates="quotations")


class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    fiscal_year = Column(String)
    total_budget = Column(Float)
    spent_amount = Column(Float, default=0)
    category = Column(String)
    department = Column(String)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Poll(Base):
    __tablename__ = "polls"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    options = Column(JSON)  # 投票選項及票數
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    status = Column(String, default="active")  # active, closed
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)  # Who performed the action
    action = Column(String, nullable=False, index=True)  # e.g., CREATE_ORDER, UPDATE_ITINERARY
    resource_id = Column(String, nullable=False, index=True)  # The ID of the affected resource
    resource_type = Column(String, nullable=False, index=True)  # order, customer, etc.
    changes = Column(JSON)  # JSON field containing the diff or the new state
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User")
