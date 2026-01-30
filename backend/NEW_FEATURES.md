# TrvicERP Backend API - New Features Documentation

## Overview
This document describes the newly implemented P0 (Critical) and P1 (High Priority) backend modules for TrvicERP.

## P0 Critical Modules

### 1. Supplier Management (供應商管理)
**Purpose**: Manage all suppliers including hotels, restaurants, transportation, ground handlers, and airlines.

**Key Features**:
- CRUD operations for suppliers
- Supplier type classification (hotel, restaurant, transport, activity, ground_handler, airline)
- Contract tracking (start/end dates)
- Supplier rating system
- Payment terms management
- Multi-currency support

**Database Schema**:
```sql
CREATE TABLE suppliers (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    contact_person VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    address VARCHAR,
    tax_id VARCHAR,
    payment_terms VARCHAR,
    currency VARCHAR DEFAULT 'TWD',
    bank_account VARCHAR,
    rating FLOAT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    contract_start DATETIME,
    contract_end DATETIME,
    notes TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
```

**API Endpoints**:
- `GET /api/v1/suppliers` - List suppliers with optional filtering by type and active status
- `POST /api/v1/suppliers` - Create new supplier
- `GET /api/v1/suppliers/{id}` - Get supplier details
- `PUT /api/v1/suppliers/{id}` - Update supplier
- `DELETE /api/v1/suppliers/{id}` - Soft delete (sets is_active to False)
- `GET /api/v1/suppliers/types/list` - Get list of available supplier types

### 2. Flight/Ticket Management (航班/機票管理)
**Purpose**: Manage flight bookings, PNR records, and ticket lifecycle.

**Key Features**:
- PNR (Passenger Name Record) tracking
- Flight booking status management (pending → confirmed → ticketed → cancelled/refunded)
- Multiple passenger support
- Multi-currency pricing
- GDS data storage
- Booking operations (confirm, issue ticket, cancel, refund)

**Database Schema**:
```sql
CREATE TABLE flights (
    id VARCHAR PRIMARY KEY,
    pnr VARCHAR UNIQUE,
    booking_reference VARCHAR,
    airline VARCHAR NOT NULL,
    flight_number VARCHAR NOT NULL,
    departure_airport VARCHAR NOT NULL,
    arrival_airport VARCHAR NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    booking_class VARCHAR,
    ticket_status VARCHAR DEFAULT 'pending',
    passenger_count INTEGER DEFAULT 1,
    total_price FLOAT,
    currency VARCHAR DEFAULT 'TWD',
    supplier_id VARCHAR REFERENCES suppliers(id),
    session_id VARCHAR REFERENCES sessions(id),
    order_id VARCHAR REFERENCES orders(id),
    notes TEXT,
    gds_data JSON,
    created_at DATETIME,
    updated_at DATETIME
);
```

**Status Flow**:
```
pending → confirmed → ticketed → cancelled/refunded
                                ↓
                            refunded
```

### 3. Payment Management - AR/AP (收付款管理)
**Purpose**: Comprehensive accounts receivable and accounts payable management.

**Key Features**:
- Separate tracking for AR (receivable) and AP (payable)
- Installment plan support
- Payment reconciliation
- Overdue payment tracking
- Multi-currency support
- Payment method tracking
- Summary statistics

**Database Schema**:
```sql
CREATE TABLE payments (
    id VARCHAR PRIMARY KEY,
    type VARCHAR NOT NULL,  -- 'receivable' or 'payable'
    order_id VARCHAR REFERENCES orders(id),
    supplier_id VARCHAR REFERENCES suppliers(id),
    customer_id VARCHAR REFERENCES customers(id),
    amount FLOAT NOT NULL,
    currency VARCHAR DEFAULT 'TWD',
    payment_method VARCHAR,
    payment_status VARCHAR DEFAULT 'pending',
    due_date DATETIME,
    paid_date DATETIME,
    installment_plan JSON,
    reference_number VARCHAR,
    reconciled BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
```

**Key Endpoints**:
- `GET /api/v1/payments/receivable` - List accounts receivable
- `GET /api/v1/payments/payable` - List accounts payable
- `GET /api/v1/payments/overdue/list` - List overdue payments
- `POST /api/v1/payments/{id}/reconcile` - Mark payment as reconciled
- `GET /api/v1/payments/summary/stats` - Get comprehensive statistics

### 4. Passport & Visa Management (護照與簽證管理)
**Purpose**: Track passport data and visa applications for group tours.

**Key Features**:
- Passport information storage
- Expiry date tracking and alerts
- Passport status workflow (pending → reviewing → approved → expired)
- Visa application management
- Visa approval/rejection workflow
- Document scan storage

**Database Schemas**:
```sql
CREATE TABLE passports (
    id VARCHAR PRIMARY KEY,
    customer_id VARCHAR REFERENCES customers(id),
    passport_number VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    nationality VARCHAR NOT NULL,
    date_of_birth VARCHAR,
    issue_date VARCHAR,
    expiry_date VARCHAR NOT NULL,
    issue_country VARCHAR,
    status VARCHAR DEFAULT 'pending',
    scan_url VARCHAR,
    session_id VARCHAR REFERENCES sessions(id),
    submitted_at DATETIME,
    reviewed_at DATETIME,
    notes TEXT,
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE visas (
    id VARCHAR PRIMARY KEY,
    passport_id VARCHAR REFERENCES passports(id),
    destination_country VARCHAR NOT NULL,
    visa_type VARCHAR,
    application_status VARCHAR DEFAULT 'pending',
    application_date DATETIME,
    approval_date DATETIME,
    valid_from VARCHAR,
    valid_until VARCHAR,
    visa_number VARCHAR,
    processing_fee FLOAT,
    notes TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
```

**Special Feature**: 
- `GET /api/v1/passports/expiring?days=90` - Get passports expiring within specified days

## P1 High Impact Features

### 5. Insurance Management (保險管理)
**Purpose**: Track travel insurance policies and claims.

**Key Features**:
- Policy management
- Premium tracking
- Coverage amount recording
- Claim records (stored as JSON)
- Status tracking (pending → active → expired → claimed)

### 6. Hotel Allotment Management (飯店房控管理)
**Purpose**: Manage hotel room allocations and rooming lists.

**Key Features**:
- Room inventory tracking
- Cut-off date management
- Room allocation with validation
- Rooming list storage (JSON format)
- Available rooms calculation
- Multi-currency pricing

**Database Schema**:
```sql
CREATE TABLE hotel_allotments (
    id VARCHAR PRIMARY KEY,
    supplier_id VARCHAR REFERENCES suppliers(id),
    session_id VARCHAR REFERENCES sessions(id),
    hotel_name VARCHAR NOT NULL,
    room_type VARCHAR NOT NULL,
    total_rooms INTEGER NOT NULL,
    allocated_rooms INTEGER DEFAULT 0,
    available_rooms INTEGER,
    check_in_date DATETIME NOT NULL,
    check_out_date DATETIME NOT NULL,
    cutoff_date DATETIME,
    price_per_room FLOAT,
    currency VARCHAR DEFAULT 'TWD',
    rooming_list JSON,
    status VARCHAR DEFAULT 'available',
    notes TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
```

**Allocation Logic**:
```
POST /api/v1/hotel-allotments/{id}/allocate
- Validates cutoff date hasn't passed
- Checks room availability
- Updates allocated_rooms and available_rooms
```

### 7. Notification System (通知系統)
**Purpose**: Central notification management for email, SMS, and system notifications.

**Key Features**:
- Multi-channel support (email, sms, system)
- Priority levels (low, normal, high, urgent)
- Status tracking (pending → sent → failed)
- Read receipt tracking
- Template support
- Metadata storage for context

**Note**: The notification_metadata field (renamed from 'metadata' to avoid SQLAlchemy conflict) stores additional context like order IDs, session IDs, etc.

### 8. Exchange Rate Management (匯率管理)
**Purpose**: Manage currency exchange rates for multi-currency operations.

**Key Features**:
- Multiple currency pair support
- Rate validity period tracking
- Active/inactive status
- Source tracking (API or manual entry)
- Currency conversion endpoint

**Database Schema**:
```sql
CREATE TABLE exchange_rates (
    id VARCHAR PRIMARY KEY,
    base_currency VARCHAR DEFAULT 'TWD',
    target_currency VARCHAR NOT NULL,
    rate FLOAT NOT NULL,
    source VARCHAR,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    updated_at DATETIME
);
```

**Currency Conversion**:
```
GET /api/v1/exchange-rates/convert/{amount}?from_currency=USD&to_currency=TWD
Response: {
    "from_currency": "USD",
    "to_currency": "TWD",
    "original_amount": 100.0,
    "exchange_rate": 31.5,
    "converted_amount": 3150.0
}
```

### 9. Excel Import/Export (Excel 匯入/匯出)
**Purpose**: Import and export data in Excel/CSV format.

**Features**:
- Customer list import/export
- Group roster import with session linking
- Quotation export with templates
- Rooming list export for hotels
- Import validation endpoint
- Multiple format support (xlsx, csv, pdf)

**Available Templates**:
1. Customer List (客戶名單)
2. Group Roster (團員名單)
3. Quotation - Standard (報價單-標準版)
4. Quotation - Detailed (報價單-詳細版)
5. Rooming List (住房名單)
6. Insurance List (保險投保名單)
7. Itinerary (行程表)

**Note**: Current implementation returns stubs. Full implementation requires pandas or openpyxl library.

### 10. Analytics & Profit/Loss Calculation (損益分析)
**Purpose**: Calculate profit and loss for orders and sessions with comprehensive case closure reports.

**Key Features**:
- Order-level P&L calculation
- Session-level P&L calculation
- Comprehensive case closure reports
- Dashboard summary statistics
- Cost breakdown by category
- Profit margin calculation

**Calculation Logic**:
```python
# Revenue
total_revenue = sum(completed_receivables)

# Costs
total_cost = sum(payables) + sum(flights_cost) + sum(hotel_cost) + sum(insurance_cost)

# Profit
gross_profit = total_revenue - total_cost
profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
```

**Case Closure Report Includes**:
- Financial summary (revenue, cost, profit, margin)
- Payment status (receivables and payables completion rate)
- Operations data (total orders, confirmed passengers)
- Detailed cost breakdown (optional)

## Authentication
All endpoints require JWT Bearer token authentication.

**Header Format**:
```
Authorization: Bearer <access_token>
```

**Token Payload**:
```json
{
  "sub": "user_id",
  "role": "staff",
  "exp": 1234567890,
  "type": "access"
}
```

## Error Handling
All endpoints return standard HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Testing
To test the API endpoints:

1. Start the backend server:
```bash
cd backend
python main.py
```

2. Access Swagger documentation:
```
http://localhost:4000/api/docs
```

3. Login to get access token:
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

4. Use token in subsequent requests:
```bash
curl http://localhost:4000/api/v1/suppliers \
  -H "Authorization: Bearer <access_token>"
```

## Future Enhancements
### Excel Import/Export
- Implement actual Excel parsing using pandas/openpyxl
- Add data validation and error reporting
- Support batch operations
- Add progress tracking for large files

### Notifications
- Integrate with email service (SendGrid, AWS SES)
- Integrate with SMS service (Twilio)
- Add notification templates
- Implement scheduled notifications

### Analytics
- Add more KPI calculations
- Support custom date ranges
- Add comparison with previous periods
- Export reports to PDF/Excel

### Exchange Rates
- Integrate with live exchange rate APIs
- Auto-update rates on schedule
- Support historical rate queries
- Add rate change alerts

## Database Migration
To apply all new database models:

```bash
cd backend
python init_db.py
```

This will create all new tables while preserving existing data.

## API Versioning
Current API version: `v1`
All endpoints are prefixed with `/api/v1/`

## Support
For issues or questions, please refer to the main project README or create an issue in the repository.
