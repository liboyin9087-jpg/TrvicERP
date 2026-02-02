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


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    order_id = Column(String, ForeignKey("orders.id"))
    customer_id = Column(String, ForeignKey("customers.id"))
    customer_name = Column(String, nullable=False)
    invoice_type = Column(String, default="standard")  # standard, proforma, credit_note
    status = Column(String, default="draft")  # draft, pending, sent, partial, paid, overdue, cancelled, void
    issue_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    items = Column(JSON)  # InvoiceItem[]
    subtotal = Column(Float, default=0)
    tax_rate = Column(Float, default=0.05)
    tax_amount = Column(Float, default=0)
    total = Column(Float, nullable=False)
    currency = Column(String, default="TWD")
    exchange_rate = Column(Float, default=1.0)
    paid_amount = Column(Float, default=0)
    balance = Column(Float, default=0)
    payment_method = Column(String)
    buyer_tax_id = Column(String)
    buyer_address = Column(String)
    notes = Column(Text)
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AccountsReceivable(Base):
    __tablename__ = "accounts_receivable"

    id = Column(String, primary_key=True, index=True)
    invoice_id = Column(String, ForeignKey("invoices.id"))
    customer_id = Column(String, ForeignKey("customers.id"))
    amount = Column(Float, nullable=False)
    currency = Column(String, default="TWD")
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="pending")  # pending, partial, paid, overdue
    paid_amount = Column(Float, default=0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AccountsPayable(Base):
    __tablename__ = "accounts_payable"

    id = Column(String, primary_key=True, index=True)
    supplier_id = Column(String)
    supplier_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="TWD")
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="pending")  # pending, partial, paid, overdue
    paid_amount = Column(Float, default=0)
    description = Column(String)
    category = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    name_en = Column(String)
    supplier_type = Column(String, nullable=False)  # hotel, airline, restaurant, transportation, attraction, insurance, visa_service, other
    category = Column(JSON)  # SupplierCategory[]
    status = Column(String, default="active")  # active, inactive, pending_approval, suspended, blacklisted
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    mobile = Column(String)
    fax = Column(String)
    website = Column(String)
    address = Column(JSON)  # {street, city, state, country, postalCode}
    tax_id = Column(String)
    business_license = Column(String)
    payment_terms = Column(String, default="NET30")
    currency = Column(String, default="TWD")
    rating = Column(Float, default=0)
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0)
    on_time_delivery_rate = Column(Float, default=0)
    quality_score = Column(Float, default=0)
    account_manager_id = Column(String, ForeignKey("users.id"))
    notes = Column(Text)
    tags = Column(JSON)
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SupplierContract(Base):
    __tablename__ = "supplier_contracts"

    id = Column(String, primary_key=True, index=True)
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    contract_number = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    contract_type = Column(String)  # annual, seasonal, project_based, framework, one_time
    status = Column(String, default="draft")  # draft, under_negotiation, pending_signature, active, expired, terminated, renewed
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    auto_renewal = Column(Boolean, default=False)
    renewal_terms = Column(String)
    payment_terms = Column(String)
    currency = Column(String, default="TWD")
    total_value = Column(Float)
    document_url = Column(String)
    signed_by = Column(JSON)  # string[]
    signed_date = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id = Column(String, primary_key=True, index=True)
    policy_number = Column(String, unique=True, index=True, nullable=False)
    order_id = Column(String, ForeignKey("orders.id"))
    customer_id = Column(String, ForeignKey("customers.id"))
    customer_name = Column(String, nullable=False)
    provider = Column(String, nullable=False)  # 保險公司
    plan_type = Column(String, nullable=False)  # basic, standard, premium, comprehensive
    status = Column(String, default="active")  # active, expired, cancelled, claimed
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    destination = Column(String)
    coverage_amount = Column(Float)
    medical_coverage = Column(Float)
    flight_delay_coverage = Column(Float)
    luggage_coverage = Column(Float)
    premium = Column(Float, nullable=False)
    currency = Column(String, default="TWD")
    beneficiary = Column(String)
    emergency_contact = Column(String)
    emergency_phone = Column(String)
    notes = Column(Text)
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"

    id = Column(String, primary_key=True, index=True)
    claim_number = Column(String, unique=True, index=True, nullable=False)
    policy_id = Column(String, ForeignKey("insurance_policies.id"), nullable=False)
    claim_type = Column(String, nullable=False)  # medical, flight_delay, luggage_loss, trip_cancellation, other
    status = Column(String, default="submitted")  # submitted, under_review, approved, rejected, paid
    incident_date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=False)
    claim_amount = Column(Float, nullable=False)
    approved_amount = Column(Float)
    documents = Column(JSON)  # [{name, url, type}]
    reviewer = Column(String)
    review_date = Column(DateTime)
    review_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VisaApplication(Base):
    __tablename__ = "visa_applications"

    id = Column(String, primary_key=True, index=True)
    application_number = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"))
    customer_name = Column(String, nullable=False)
    passport_number = Column(String)
    nationality = Column(String)
    destination_country = Column(String, nullable=False)
    visa_type = Column(String, nullable=False)  # tourist, business, work, student, transit
    status = Column(String, default="draft")  # draft, submitted, processing, approved, rejected, expired, cancelled
    application_date = Column(DateTime)
    appointment_date = Column(DateTime)
    expected_issue_date = Column(DateTime)
    issue_date = Column(DateTime)
    expiry_date = Column(DateTime)
    entry_type = Column(String)  # single, multiple
    duration_of_stay = Column(String)
    processing_fee = Column(Float)
    service_fee = Column(Float)
    currency = Column(String, default="TWD")
    documents = Column(JSON)  # [{name, status, url}]
    embassy_notes = Column(Text)
    notes = Column(Text)
    assigned_to = Column(String, ForeignKey("users.id"))
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
