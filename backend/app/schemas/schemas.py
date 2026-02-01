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
    version: Optional[int] = None  # For optimistic locking


class CustomerResponse(CustomerBase):
    id: str
    version: int
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
    version: Optional[int] = None  # For optimistic locking


class OrderResponse(OrderBase):
    id: str
    order_number: str
    status: str
    paid_amount: float
    payment_status: str
    created_by: Optional[str] = None
    version: int
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


# ============ AuditLog Schemas ============
class AuditLogBase(BaseModel):
    user_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: str
    changes: Optional[Dict[str, Any]] = None


class AuditLogResponse(AuditLogBase):
    id: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

    created_at: datetime
    
    class Config:
        from_attributes = True
