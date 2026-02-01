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


# --- P0 Critical Modules ---

class Supplier(Base):
    """供應商/供應商管理 - Vendor/Supplier Management"""
    __tablename__ = "suppliers"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)  # hotel, restaurant, transport, activity, ground_handler, airline
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(String)
    tax_id = Column(String)
    payment_terms = Column(String)  # 付款條件
    currency = Column(String, default="TWD")
    bank_account = Column(String)
    rating = Column(Float, default=0)  # 供應商評分
    is_active = Column(Boolean, default=True)
    contract_start = Column(DateTime)
    contract_end = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Flight(Base):
    """航班/機票管理 - Flight/Ticket Management"""
    __tablename__ = "flights"
    
    id = Column(String, primary_key=True, index=True)
    pnr = Column(String, unique=True, index=True)  # Passenger Name Record
    booking_reference = Column(String)
    airline = Column(String, nullable=False)
    flight_number = Column(String, nullable=False)
    departure_airport = Column(String, nullable=False)
    arrival_airport = Column(String, nullable=False)
    departure_time = Column(DateTime, nullable=False)
    arrival_time = Column(DateTime, nullable=False)
    booking_class = Column(String)  # Economy, Business, First
    ticket_status = Column(String, default="pending")  # pending, confirmed, ticketed, cancelled, refunded
    passenger_count = Column(Integer, default=1)
    total_price = Column(Float)
    currency = Column(String, default="TWD")
    supplier_id = Column(String, ForeignKey("suppliers.id"))
    session_id = Column(String, ForeignKey("sessions.id"))
    order_id = Column(String, ForeignKey("orders.id"))
    notes = Column(Text)
    gds_data = Column(JSON)  # GDS (Global Distribution System) raw data
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Passport(Base):
    """護照管理 - Passport Management"""
    __tablename__ = "passports"
    
    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    passport_number = Column(String, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    nationality = Column(String, nullable=False)
    date_of_birth = Column(String)
    issue_date = Column(String)
    expiry_date = Column(String, nullable=False)
    issue_country = Column(String)
    status = Column(String, default="pending")  # pending, reviewing, approved, expired
    scan_url = Column(String)  # 掃描檔案 URL
    session_id = Column(String, ForeignKey("sessions.id"))
    submitted_at = Column(DateTime)
    reviewed_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Visa(Base):
    """簽證管理 - Visa Management"""
    __tablename__ = "visas"
    
    id = Column(String, primary_key=True, index=True)
    passport_id = Column(String, ForeignKey("passports.id"), nullable=False)
    destination_country = Column(String, nullable=False)
    visa_type = Column(String)  # tourist, business, transit
    application_status = Column(String, default="pending")  # pending, processing, approved, rejected
    application_date = Column(DateTime)
    approval_date = Column(DateTime)
    valid_from = Column(String)
    valid_until = Column(String)
    visa_number = Column(String)
    processing_fee = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Payment(Base):
    """收付款管理 - Payment Management (AR/AP)"""
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)  # receivable (AR), payable (AP)
    order_id = Column(String, ForeignKey("orders.id"))
    supplier_id = Column(String, ForeignKey("suppliers.id"))
    customer_id = Column(String, ForeignKey("customers.id"))
    amount = Column(Float, nullable=False)
    currency = Column(String, default="TWD")
    payment_method = Column(String)  # credit_card, bank_transfer, cash, line_pay
    payment_status = Column(String, default="pending")  # pending, processing, completed, failed, refunded
    due_date = Column(DateTime)
    paid_date = Column(DateTime)
    installment_plan = Column(JSON)  # 分期付款計畫
    reference_number = Column(String)  # 交易參考號
    reconciled = Column(Boolean, default=False)  # 是否已對帳
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Insurance(Base):
    """旅遊保險管理 - Travel Insurance Management"""
    __tablename__ = "insurances"
    
    id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"))
    session_id = Column(String, ForeignKey("sessions.id"))
    customer_id = Column(String, ForeignKey("customers.id"))
    policy_number = Column(String, unique=True)
    insurance_company = Column(String)
    plan_type = Column(String)  # basic, premium, comprehensive
    coverage_amount = Column(Float)
    premium = Column(Float)
    currency = Column(String, default="TWD")
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    beneficiary = Column(String)
    status = Column(String, default="pending")  # pending, active, expired, claimed
    claim_records = Column(JSON)  # 理賠紀錄
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class HotelAllotment(Base):
    """飯店房控管理 - Hotel Room Allotment Management"""
    __tablename__ = "hotel_allotments"
    
    id = Column(String, primary_key=True, index=True)
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)  # 酒店供應商
    session_id = Column(String, ForeignKey("sessions.id"))
    hotel_name = Column(String, nullable=False)
    room_type = Column(String, nullable=False)
    total_rooms = Column(Integer, nullable=False)
    allocated_rooms = Column(Integer, default=0)
    available_rooms = Column(Integer)  # Calculated: total - allocated
    check_in_date = Column(DateTime, nullable=False)
    check_out_date = Column(DateTime, nullable=False)
    cutoff_date = Column(DateTime)  # 截止日期 - 超過此日期不能再訂房
    price_per_room = Column(Float)
    currency = Column(String, default="TWD")
    rooming_list = Column(JSON)  # 住房名單
    status = Column(String, default="available")  # available, blocked, released
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Notification(Base):
    """通知系統 - Notification System"""
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(String, nullable=False)  # email, sms, system
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, sent, failed
    priority = Column(String, default="normal")  # low, normal, high, urgent
    template_id = Column(String)
    sent_at = Column(DateTime)
    read_at = Column(DateTime)
    notification_metadata = Column(JSON)  # 額外資訊 (如訂單ID、session ID等)
    created_at = Column(DateTime, default=datetime.utcnow)


class ImportedOrder(Base):
    """匯入訂單 - 來自 Chrome Extension / JSON 匯入的外部競品訂單"""
    __tablename__ = "imported_orders"

    id = Column(String, primary_key=True, index=True)
    external_id = Column(String, unique=True, nullable=False, index=True)  # 外部單號（去重/追溯）
    company = Column(String, nullable=False)           # 來源公司（雄獅/山富/五福 etc.）
    product_name = Column(String)                      # 產品名稱
    group_name = Column(String)                        # 團名
    destination = Column(String)                       # 目的地
    depart_date = Column(String)                       # 出發日期
    return_date = Column(String)                       # 返回日期
    days = Column(Integer)                             # 天數
    nights = Column(Integer)                           # 夜數
    pax = Column(Integer)                              # 人數
    total_price = Column(Float)                        # 總價
    status = Column(String, default="scraped")         # scraped/imported/converted
    poi_list = Column(JSON, default=[])                # 行程景點串列
    itinerary = Column(JSON)                           # 完整行程資料
    cost_breakdown = Column(JSON)                      # 成本拆解
    inclusions = Column(JSON)                          # 包含項目
    exclusions = Column(JSON)                          # 不含項目
    payment_status = Column(String)                    # 付款狀態
    source = Column(String, default="chrome_extension") # chrome_extension / json_import / api
    raw_data = Column(JSON)                            # 原始擷取資料
    tags = Column(JSON, default=[])                    # AI 分析標籤 (e.g. #購物停留久)
    converted_order_id = Column(String, ForeignKey("orders.id"))  # 轉換為正式訂單後的 ID
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExchangeRate(Base):
    """匯率管理 - Exchange Rate Management"""
    __tablename__ = "exchange_rates"
    
    id = Column(String, primary_key=True, index=True)
    base_currency = Column(String, nullable=False, default="TWD")
    target_currency = Column(String, nullable=False)
    rate = Column(Float, nullable=False)
    source = Column(String)  # API source (e.g., "exchangerate-api", "manual")
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
