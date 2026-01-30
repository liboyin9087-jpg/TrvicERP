# TrvicERP Backend API

FastAPI-based backend server for TrvicERP Travel Management System.

## Features

- ✅ RESTful API endpoints for all ERP modules
- ✅ JWT-based authentication
- ✅ SQLAlchemy ORM with SQLite (easy to switch to PostgreSQL/MySQL)
- ✅ WebSocket support for real-time features
- ✅ LINE Messaging API integration (stub)
- ✅ Comprehensive API documentation (Swagger/ReDoc)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Key settings:
- `DATABASE_URL`: Database connection string
- `JWT_SECRET_KEY`: Secret key for JWT tokens (change in production!)
- `CORS_ORIGINS`: Allowed frontend origins

### 3. Initialize Database

```bash
python init_db.py
```

This creates tables and seeds default users:
- Username: `admin` / Password: `admin123` (Admin)
- Username: `manager` / Password: `manager123` (Manager)
- Username: `sales` / Password: `sales123` (Sales)
- Username: `hr` / Password: `hr123` (Welfare)
- Username: `employee` / Password: `employee123` (Traveler)

### 4. Run Server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --port 4000
```

The API will be available at:
- API: http://localhost:4000
- Swagger Docs: http://localhost:4000/api/docs
- ReDoc: http://localhost:4000/api/redoc
- WebSocket: ws://localhost:4000/ws

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/{id}` - Get user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/{id}` - Get order
- `PUT /api/v1/orders/{id}` - Update order
- `DELETE /api/v1/orders/{id}` - Delete order
- `POST /api/v1/orders/{id}/cancel` - Cancel order
- `POST /api/v1/orders/{id}/refund` - Refund order

### Quotations
- `GET /api/v1/quotations` - List quotations
- `POST /api/v1/quotations` - Create quotation
- `GET /api/v1/quotations/{id}` - Get quotation
- `PUT /api/v1/quotations/{id}` - Update quotation
- `DELETE /api/v1/quotations/{id}` - Delete quotation
- `POST /api/v1/quotations/{id}/convert` - Convert to order
- `GET /api/v1/quotations/{id}/versions` - Get versions

### Tours & Sessions
- `GET /api/v1/tours` - List tours
- `POST /api/v1/tours` - Create tour
- `GET /api/v1/tours/{id}/sessions` - Get tour sessions
- `GET /api/v1/sessions` - List sessions
- `POST /api/v1/sessions` - Create session

### Customers
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/{id}` - Get customer
- `PUT /api/v1/customers/{id}` - Update customer
- `DELETE /api/v1/customers/{id}` - Delete customer

### Corporate Accounts
- `GET /api/v1/corporate-accounts` - List accounts
- `POST /api/v1/corporate-accounts` - Create account
- `GET /api/v1/corporate-accounts/{id}/contacts` - List contacts
- `POST /api/v1/corporate-accounts/{id}/contacts` - Create contact
- `GET /api/v1/corporate-accounts/{id}/engagements` - List engagements
- `POST /api/v1/corporate-accounts/{id}/engagements` - Create engagement

### Reports
- `GET /api/v1/reports/revenue` - Revenue report
- `GET /api/v1/reports/customers` - Customer report
- `GET /api/v1/reports/teams` - Team report
- `GET /api/v1/reports/{type}/export` - Export report

### Budgets & Polls
- `GET /api/v1/budgets` - List budgets
- `GET /api/v1/budgets/{id}` - Get budget
- `PUT /api/v1/budgets/{id}` - Update budget
- `GET /api/v1/polls` - List polls
- `POST /api/v1/polls` - Create poll
- `POST /api/v1/polls/{id}/vote` - Vote on poll

### 🆕 P0 Critical Modules

### Suppliers (供應商管理)
- `GET /api/v1/suppliers` - List suppliers with filtering
- `POST /api/v1/suppliers` - Create supplier
- `GET /api/v1/suppliers/{id}` - Get supplier details
- `PUT /api/v1/suppliers/{id}` - Update supplier
- `DELETE /api/v1/suppliers/{id}` - Soft delete supplier
- `GET /api/v1/suppliers/types/list` - Get supplier types

### Flights (航班/機票管理)
- `GET /api/v1/flights` - List flights with filtering
- `POST /api/v1/flights` - Create flight booking
- `GET /api/v1/flights/{id}` - Get flight details
- `GET /api/v1/flights/pnr/{pnr}` - Get flight by PNR
- `PUT /api/v1/flights/{id}` - Update flight
- `DELETE /api/v1/flights/{id}` - Delete flight
- `POST /api/v1/flights/{id}/confirm` - Confirm booking
- `POST /api/v1/flights/{id}/ticket` - Issue ticket
- `POST /api/v1/flights/{id}/cancel` - Cancel flight
- `POST /api/v1/flights/{id}/refund` - Process refund

### Payments (收付款管理 AR/AP)
- `GET /api/v1/payments` - List all payments
- `GET /api/v1/payments/receivable` - List accounts receivable
- `GET /api/v1/payments/payable` - List accounts payable
- `POST /api/v1/payments` - Create payment record
- `GET /api/v1/payments/{id}` - Get payment details
- `PUT /api/v1/payments/{id}` - Update payment
- `DELETE /api/v1/payments/{id}` - Delete payment
- `POST /api/v1/payments/{id}/confirm` - Confirm payment
- `POST /api/v1/payments/{id}/reconcile` - Reconcile payment
- `GET /api/v1/payments/overdue/list` - List overdue payments
- `GET /api/v1/payments/summary/stats` - Get payment statistics

### Passports & Visas (護照與簽證管理)
- `GET /api/v1/passports` - List passports
- `GET /api/v1/passports/expiring` - List expiring passports
- `POST /api/v1/passports` - Create passport record
- `GET /api/v1/passports/{id}` - Get passport details
- `PUT /api/v1/passports/{id}` - Update passport
- `DELETE /api/v1/passports/{id}` - Delete passport
- `POST /api/v1/passports/{id}/review` - Review passport
- `GET /api/v1/passports/{id}/visas` - Get passport visas
- `POST /api/v1/passports/{passport_id}/visas` - Create visa application
- `GET /api/v1/passports/visas/{visa_id}` - Get visa details
- `PUT /api/v1/passports/visas/{visa_id}` - Update visa
- `DELETE /api/v1/passports/visas/{visa_id}` - Delete visa
- `POST /api/v1/passports/visas/{visa_id}/approve` - Approve visa
- `POST /api/v1/passports/visas/{visa_id}/reject` - Reject visa

### 🆕 P1 Features

### Insurance (保險管理)
- `GET /api/v1/insurances` - List insurance records
- `POST /api/v1/insurances` - Create insurance record
- `GET /api/v1/insurances/{id}` - Get insurance details
- `PUT /api/v1/insurances/{id}` - Update insurance
- `DELETE /api/v1/insurances/{id}` - Delete insurance

### Hotel Allotment (飯店房控)
- `GET /api/v1/hotel-allotments` - List hotel allotments
- `POST /api/v1/hotel-allotments` - Create allotment
- `GET /api/v1/hotel-allotments/{id}` - Get allotment details
- `PUT /api/v1/hotel-allotments/{id}` - Update allotment
- `POST /api/v1/hotel-allotments/{id}/allocate` - Allocate rooms

### Notifications (通知系統)
- `GET /api/v1/notifications` - List notifications
- `POST /api/v1/notifications` - Create notification
- `POST /api/v1/notifications/{id}/mark-read` - Mark as read
- `POST /api/v1/notifications/{id}/send` - Send notification

### Exchange Rates (匯率管理)
- `GET /api/v1/exchange-rates` - List exchange rates
- `POST /api/v1/exchange-rates` - Create exchange rate
- `GET /api/v1/exchange-rates/{id}` - Get rate details
- `PUT /api/v1/exchange-rates/{id}` - Update rate
- `GET /api/v1/exchange-rates/convert` - Convert currency

### Excel Import/Export
- `POST /api/v1/excel/import/customers` - Import customers from Excel
- `POST /api/v1/excel/import/group-roster/{session_id}` - Import group roster
- `GET /api/v1/excel/export/customers` - Export customers
- `GET /api/v1/excel/export/quotation/{id}` - Export quotation
- `GET /api/v1/excel/export/rooming-list/{session_id}` - Export rooming list
- `GET /api/v1/excel/templates/list` - List export templates
- `POST /api/v1/excel/validate/import` - Validate import file

### Analytics & Profit/Loss (損益分析)
- `GET /api/v1/analytics/profit-loss/order/{id}` - Calculate order P&L
- `GET /api/v1/analytics/profit-loss/session/{id}` - Calculate session P&L
- `GET /api/v1/analytics/case-closure/{session_id}` - Generate case closure report
- `GET /api/v1/analytics/dashboard/summary` - Get dashboard summary

## WebSocket Events

Connect to `ws://localhost:4000/ws` and send/receive:

### Client → Server
```json
{
  "type": "subscribe",
  "channel": "session:SESSION_ID"
}
```

### Server → Client
```json
{
  "type": "notification",
  "data": {
    "sessionId": "SESSION_ID",
    "title": "通知標題",
    "message": "通知內容"
  }
}
```

## Database

Default: SQLite (`trvicerp.db`)

To use PostgreSQL:
```env
DATABASE_URL=postgresql://user:password@localhost/trvicerp
```

To use MySQL:
```env
DATABASE_URL=mysql://user:password@localhost/trvicerp
```

## Development

### Project Structure
```
backend/
├── app/
│   ├── api/          # API route handlers
│   ├── core/         # Core utilities (auth, config)
│   ├── db/           # Database setup
│   ├── models/       # SQLAlchemy models
│   ├── schemas/      # Pydantic schemas
│   └── services/     # Business logic (future)
├── main.py           # FastAPI application
├── init_db.py        # Database initialization
└── requirements.txt  # Python dependencies
```

### Adding New Endpoints

1. Define model in `app/models/models.py`
2. Define schemas in `app/schemas/schemas.py`
3. Create router in `app/api/your_module.py`
4. Register router in `main.py`

## Security Notes

⚠️ **Important for Production:**

1. Change `JWT_SECRET_KEY` in `.env`
2. Use strong passwords for default users
3. Enable HTTPS
4. Use PostgreSQL/MySQL instead of SQLite
5. Implement rate limiting
6. Add proper authentication middleware
7. Validate all inputs
8. Enable security headers

## License

Proprietary - TrvicERP
