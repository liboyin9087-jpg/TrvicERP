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
