"""
Main FastAPI application for TrvicERP Backend API
Production-ready with health checks, error monitoring, and proper CORS
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys

from app.core.config import settings
from app.db.database import Base, engine, check_db_connection, init_db
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from prometheus_fastapi_instrumentator import Instrumentator
from app.api import (
    auth, users, orders, quotations, customers, tours,
    sessions, corporate_accounts, budgets, polls, reports, line,
    suppliers, flights, payments, passports, operations,
    excel, analytics, import_api, weather_push
)
# P1 新增功能
from app.api import ecpay, line_notify, report_export

import json
from typing import Dict, Set
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Initialize Sentry for error monitoring (production only)
if settings.SENTRY_DSN and settings.is_production:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
            ],
            traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
            environment=settings.ENVIRONMENT,
        )
        logger.info("Sentry error monitoring initialized")
    except ImportError:
        logger.warning("Sentry SDK not installed, skipping error monitoring")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info(f"Starting TrvicERP API in {settings.ENVIRONMENT} mode")
    
    # Initialize database tables
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        if settings.is_production:
            raise  # Fail fast in production
    
    yield
    
    # Shutdown
    logger.info("Shutting down TrvicERP API")


# Initialize FastAPI app
app = FastAPI(
    title="TrvicERP API",
    description="Travel Management ERP System API - AI-Powered Travel Intelligence Platform",
    version="2.0.0",
    docs_url="/api/docs" if not settings.is_production else None,  # Disable docs in production
    redoc_url="/api/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# Setup 1: Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Setup 2: Prometheus Metrics
instrumentator = Instrumentator().instrument(app)

@app.on_event("startup")
async def startup_event():
    instrumentator.expose(app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-RateLimit-Remaining"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred" if settings.is_production else str(exc),
        }
    )


# Include routers with proper prefixes
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX, tags=["Authentication"])
app.include_router(users.router, prefix=API_PREFIX, tags=["Users"])
app.include_router(orders.router, prefix=API_PREFIX, tags=["Orders"])
app.include_router(quotations.router, prefix=API_PREFIX, tags=["Quotations"])
app.include_router(customers.router, prefix=API_PREFIX, tags=["Customers"])
app.include_router(tours.router, prefix=API_PREFIX, tags=["Tours"])
app.include_router(sessions.router, prefix=API_PREFIX, tags=["Sessions"])
app.include_router(corporate_accounts.router, prefix=API_PREFIX, tags=["Corporate Accounts"])
app.include_router(budgets.router, prefix=API_PREFIX, tags=["Budgets"])
app.include_router(polls.router, prefix=API_PREFIX, tags=["Polls"])
app.include_router(reports.router, prefix=API_PREFIX, tags=["Reports"])
app.include_router(line.router, prefix=API_PREFIX, tags=["LINE Integration"])

# P0 Critical Modules
app.include_router(suppliers.router, prefix=API_PREFIX, tags=["Suppliers"])
app.include_router(flights.router, prefix=API_PREFIX, tags=["Flights"])
app.include_router(payments.router, prefix=API_PREFIX, tags=["Payments"])
app.include_router(passports.router, prefix=API_PREFIX, tags=["Passports"])
app.include_router(operations.router, prefix=API_PREFIX, tags=["Operations"])

# P1 Features
app.include_router(excel.router, prefix=API_PREFIX, tags=["Excel Export"])
app.include_router(analytics.router, prefix=API_PREFIX, tags=["Analytics"])

# P1 新增功能 - 金流與通知
app.include_router(ecpay.router, prefix=API_PREFIX, tags=["Payment - ECPay"])
app.include_router(line_notify.router, prefix=API_PREFIX, tags=["LINE Notifications"])
app.include_router(report_export.router, prefix=API_PREFIX, tags=["Report Export"])

# Import / Chrome Extension
app.include_router(import_api.router, prefix=API_PREFIX, tags=["Import"])

# Weather Push (CWA + Gemini AI)
app.include_router(weather_push.router, prefix=API_PREFIX, tags=["Weather"])


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str = "global"):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        self.active_connections[session_id].add(websocket)
        logger.debug(f"WebSocket connected to session: {session_id}")
    
    def disconnect(self, websocket: WebSocket, session_id: str = "global"):
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        logger.debug(f"WebSocket disconnected from session: {session_id}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast(self, message: str, session_id: str = "global"):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.warning(f"Failed to send WebSocket message: {e}")


manager = ConnectionManager()


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": "TrvicERP API",
        "version": "2.0.0",
        "status": "running",
        "environment": settings.ENVIRONMENT,
        "docs": "/api/docs" if not settings.is_production else "disabled",
    }


@app.get("/health")
async def health():
    """
    Health check endpoint for load balancers and monitoring
    Returns detailed status in development, simple status in production
    """
    db_healthy = check_db_connection()
    
    status = {
        "status": "healthy" if db_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
    }
    
    if not settings.is_production:
        status.update({
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG,
            "database_type": "sqlite" if settings.is_sqlite else "postgresql",
        })
    
    return JSONResponse(
        status_code=200 if db_healthy else 503,
        content=status
    )


@app.get("/health/ready")
async def readiness():
    """Kubernetes readiness probe - checks if app can serve traffic"""
    if check_db_connection():
        return {"status": "ready"}
    return JSONResponse(status_code=503, content={"status": "not ready"})


@app.get("/health/live")
async def liveness():
    """Kubernetes liveness probe - checks if app is alive"""
    return {"status": "alive"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await manager.connect(websocket, "global")
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            msg_type = message.get("type")
            
            if msg_type == "subscribe":
                channel = message.get("channel", "")
                if channel.startswith("session:"):
                    session_id = channel.replace("session:", "")
                    await manager.connect(websocket, session_id)
                    await manager.send_personal_message(
                        json.dumps({"type": "subscribed", "channel": channel}),
                        websocket
                    )
            
            elif msg_type == "unsubscribe":
                channel = message.get("channel", "")
                if channel.startswith("session:"):
                    session_id = channel.replace("session:", "")
                    manager.disconnect(websocket, session_id)
                    await manager.send_personal_message(
                        json.dumps({"type": "unsubscribed", "channel": channel}),
                        websocket
                    )
            
            elif msg_type == "notification":
                notification_data = message.get("data", {})
                session_id = notification_data.get("sessionId", "global")
                await manager.broadcast(
                    json.dumps({"type": "notification", "data": notification_data}),
                    session_id
                )
            
            elif msg_type == "location_update":
                location_data = message.get("data", {})
                session_id = location_data.get("sessionId", "global")
                await manager.broadcast(
                    json.dumps({"type": "location_update", "data": location_data}),
                    session_id
                )
            
            elif msg_type == "ping":
                await manager.send_personal_message(
                    json.dumps({"type": "pong"}),
                    websocket
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, "global")
        # Clean up all session subscriptions
        for session_id in list(manager.active_connections.keys()):
            manager.disconnect(websocket, session_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, "global")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=settings.SERVER_RELOAD and not settings.is_production,
        workers=1 if settings.is_sqlite else 4,  # Multiple workers only for PostgreSQL
        log_level="debug" if settings.DEBUG else "info",
    )
