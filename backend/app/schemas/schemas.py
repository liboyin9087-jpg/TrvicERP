"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============ User Schemas ============
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "staff"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Auth Schemas ============
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ============ Customer Schemas ============
class CustomerBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    id_number: Optional[str] = None
    passport_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    medical_notes: Optional[str] = None
    tags: Optional[List[str]] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    id_number: Optional[str] = None
    passport_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    medical_notes: Optional[str] = None
    tags: Optional[List[str]] = None


class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Order Schemas ============
class OrderBase(BaseModel):
    customer_id: str
    session_id: Optional[str] = None
    total_amount: float
    payment_method: Optional[str] = None
    participants: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    paid_amount: Optional[float] = None
    payment_method: Optional[str] = None
    participants: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None


class OrderResponse(OrderBase):
    id: str
    order_number: str
    status: str
    paid_amount: float
    payment_status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Quotation Schemas ============
class QuotationBase(BaseModel):
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    destination: Optional[str] = None
    travel_dates: Optional[str] = None
    participants: Optional[int] = None
    items: Optional[List[Dict[str, Any]]] = None
    total_amount: Optional[float] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None


class QuotationCreate(QuotationBase):
    pass


class QuotationUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    destination: Optional[str] = None
    travel_dates: Optional[str] = None
    participants: Optional[int] = None
    items: Optional[List[Dict[str, Any]]] = None
    total_amount: Optional[float] = None
    status: Optional[str] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None


class QuotationResponse(QuotationBase):
    id: str
    quote_number: str
    status: str
    version: int
    parent_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Tour Schemas ============
class TourBase(BaseModel):
    code: str
    name: str
    destination: Optional[str] = None
    days: Optional[int] = None
    nights: Optional[int] = None
    description: Optional[str] = None
    itinerary: Optional[Dict[str, Any]] = None
    inclusions: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
    base_price: Optional[float] = None


class TourCreate(TourBase):
    pass


class TourUpdate(BaseModel):
    name: Optional[str] = None
    destination: Optional[str] = None
    days: Optional[int] = None
    nights: Optional[int] = None
    description: Optional[str] = None
    itinerary: Optional[Dict[str, Any]] = None
    inclusions: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
    base_price: Optional[float] = None
    is_active: Optional[bool] = None


class TourResponse(TourBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Session Schemas ============
class SessionBase(BaseModel):
    tour_id: str
    group_number: str
    start_date: datetime
    end_date: datetime
    max_participants: Optional[int] = None
    leader_id: Optional[str] = None
    meeting_location: Optional[str] = None
    meeting_time: Optional[datetime] = None
    notes: Optional[str] = None


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_participants: Optional[int] = None
    current_participants: Optional[int] = None
    status: Optional[str] = None
    leader_id: Optional[str] = None
    meeting_location: Optional[str] = None
    meeting_time: Optional[datetime] = None
    notes: Optional[str] = None


class SessionResponse(SessionBase):
    id: str
    current_participants: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Budget Schemas ============
class BudgetBase(BaseModel):
    name: str
    fiscal_year: Optional[str] = None
    total_budget: Optional[float] = None
    category: Optional[str] = None
    department: Optional[str] = None


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    total_budget: Optional[float] = None
    spent_amount: Optional[float] = None
    category: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None


class BudgetResponse(BudgetBase):
    id: str
    spent_amount: float
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Poll Schemas ============
class PollBase(BaseModel):
    title: str
    description: Optional[str] = None
    options: List[Dict[str, Any]]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class PollCreate(PollBase):
    pass


class PollVote(BaseModel):
    option_id: str


class PollResponse(PollBase):
    id: str
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Corporate Account Schemas ============
class CorporateAccountBase(BaseModel):
    company_name: str
    tax_id: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    account_manager_id: Optional[str] = None
    notes: Optional[str] = None


class CorporateAccountCreate(CorporateAccountBase):
    pass


class CorporateAccountUpdate(BaseModel):
    company_name: Optional[str] = None
    tax_id: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    account_manager_id: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class CorporateAccountResponse(CorporateAccountBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Corporate Contact Schemas ============
class CorporateContactBase(BaseModel):
    name: str
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_primary: bool = False


class CorporateContactCreate(CorporateContactBase):
    company_id: str


class CorporateContactResponse(CorporateContactBase):
    id: str
    company_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Corporate Engagement Schemas ============
class CorporateEngagementBase(BaseModel):
    type: str
    date: datetime
    notes: Optional[str] = None
    outcome: Optional[str] = None


class CorporateEngagementCreate(CorporateEngagementBase):
    company_id: str


class CorporateEngagementResponse(CorporateEngagementBase):
    id: str
    company_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ P0 Critical Modules Schemas ============

# --- Supplier Schemas ---
class SupplierBase(BaseModel):
    name: str
    type: str  # hotel, restaurant, transport, activity, ground_handler, airline
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    currency: str = "TWD"
    bank_account: Optional[str] = None
    rating: float = 0.0
    is_active: bool = True
    contract_start: Optional[datetime] = None
    contract_end: Optional[datetime] = None
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: Optional[bool] = None
    rating: Optional[float] = None
    notes: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# --- Flight Schemas ---
class FlightBase(BaseModel):
    pnr: Optional[str] = None
    booking_reference: Optional[str] = None
    airline: str
    flight_number: str
    departure_airport: str
    arrival_airport: str
    departure_time: datetime
    arrival_time: datetime
    booking_class: Optional[str] = None
    ticket_status: str = "pending"
    passenger_count: int = 1
    total_price: Optional[float] = None
    currency: str = "TWD"
    supplier_id: Optional[str] = None
    session_id: Optional[str] = None
    order_id: Optional[str] = None
    notes: Optional[str] = None
    gds_data: Optional[Dict[str, Any]] = None


class FlightCreate(FlightBase):
    pass


class FlightUpdate(BaseModel):
    ticket_status: Optional[str] = None
    total_price: Optional[float] = None
    notes: Optional[str] = None
    gds_data: Optional[Dict[str, Any]] = None


class FlightResponse(FlightBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# --- Passport Schemas ---
class PassportBase(BaseModel):
    customer_id: str
    passport_number: str
    full_name: str
    nationality: str
    date_of_birth: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: str
    issue_country: Optional[str] = None
    status: str = "pending"
    scan_url: Optional[str] = None
    session_id: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    notes: Optional[str] = None


class PassportCreate(PassportBase):
    pass


class PassportUpdate(BaseModel):
    status: Optional[str] = None
    scan_url: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    notes: Optional[str] = None


class PassportResponse(PassportBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# --- Visa Schemas ---
class VisaBase(BaseModel):
    passport_id: str
    destination_country: str
    visa_type: Optional[str] = None
    application_status: str = "pending"
    application_date: Optional[datetime] = None
    approval_date: Optional[datetime] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    visa_number: Optional[str] = None
    processing_fee: Optional[float] = None
    notes: Optional[str] = None


class VisaCreate(VisaBase):
    pass


class VisaUpdate(BaseModel):
    application_status: Optional[str] = None
    approval_date: Optional[datetime] = None
    visa_number: Optional[str] = None
    notes: Optional[str] = None


class VisaResponse(VisaBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# --- Payment Schemas ---
class PaymentBase(BaseModel):
    type: str  # receivable, payable
    order_id: Optional[str] = None
    supplier_id: Optional[str] = None
    customer_id: Optional[str] = None
    amount: float
    currency: str = "TWD"
    payment_method: Optional[str] = None
    payment_status: str = "pending"
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    installment_plan: Optional[Dict[str, Any]] = None
    reference_number: Optional[str] = None
    reconciled: bool = False
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    payment_status: Optional[str] = None
    paid_date: Optional[datetime] = None
    reconciled: Optional[bool] = None
    notes: Optional[str] = None


class PaymentResponse(PaymentBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# --- Insurance Schemas ---
class InsuranceBase(BaseModel):
    order_id: Optional[str] = None
    session_id: Optional[str] = None
    customer_id: Optional[str] = None
    policy_number: Optional[str] = None
    insurance_company: Optional[str] = None
    plan_type: Optional[str] = None
    coverage_amount: Optional[float] = None
    premium: Optional[float] = None
    currency: str = "TWD"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    beneficiary: Optional[str] = None
    status: str = "pending"
    claim_records: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class InsuranceCreate(InsuranceBase):
    pass


class InsuranceUpdate(BaseModel):
    status: Optional[str] = None
    policy_number: Optional[str] = None
    claim_records: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class InsuranceResponse(InsuranceBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# --- Hotel Allotment Schemas ---
class HotelAllotmentBase(BaseModel):
    supplier_id: str
    session_id: Optional[str] = None
    hotel_name: str
    room_type: str
    total_rooms: int
    allocated_rooms: int = 0
    available_rooms: Optional[int] = None
    check_in_date: datetime
    check_out_date: datetime
    cutoff_date: Optional[datetime] = None
    price_per_room: Optional[float] = None
    currency: str = "TWD"
    rooming_list: Optional[Dict[str, Any]] = None
    status: str = "available"
    notes: Optional[str] = None


class HotelAllotmentCreate(HotelAllotmentBase):
    pass


class HotelAllotmentUpdate(BaseModel):
    allocated_rooms: Optional[int] = None
    available_rooms: Optional[int] = None
    rooming_list: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class HotelAllotmentResponse(HotelAllotmentBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# --- Notification Schemas ---
class NotificationBase(BaseModel):
    user_id: Optional[str] = None
    type: str  # email, sms, system
    title: str
    message: str
    status: str = "pending"
    priority: str = "normal"
    template_id: Optional[str] = None
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    notification_metadata: Optional[Dict[str, Any]] = None  # renamed from 'metadata'


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    status: Optional[str] = None
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None


class NotificationResponse(NotificationBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# --- Exchange Rate Schemas ---
class ExchangeRateBase(BaseModel):
    base_currency: str = "TWD"
    target_currency: str
    rate: float
    source: Optional[str] = None
    valid_from: datetime
    valid_until: Optional[datetime] = None
    is_active: bool = True


class ExchangeRateCreate(ExchangeRateBase):
    pass


class ExchangeRateUpdate(BaseModel):
    rate: Optional[float] = None
    is_active: Optional[bool] = None
    valid_until: Optional[datetime] = None


class ExchangeRateResponse(ExchangeRateBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
