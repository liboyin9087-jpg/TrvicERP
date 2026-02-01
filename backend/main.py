"""
Main FastAPI application for TrvicERP Backend API
P0 Enhanced: Production-ready with observability, security, and monitoring
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.db.database import Base, engine, check_database_health
from app.core.observability import (
    get_health_status, get_metrics, get_metrics_content_type,
    set_websocket_connections, capture_exception, get_logger,
    REQUEST_COUNT, REQUEST_LATENCY
)
from app.core.security import limiter, get_security_headers
from app.api import (
    auth, users, orders, quotations, customers, tours,
    sessions, corporate_accounts, budgets, polls, reports, line,
    suppliers, flights, payments, passports, operations,
    excel, analytics, import_api, weather_push, notifications
)
import json
from typing import Dict, Set
import asyncio
import time

logger = get_logger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Travel Management ERP System API - Production Ready",
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.is_development else None,
    redoc_url="/api/redoc" if settings.is_development else None,
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===================
# Middleware
# ===================

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    start_time = time.time()
    
    response = await call_next(request)
    
    # Add security headers
    if settings.is_production:
        for header, value in get_security_headers().items():
            response.headers[header] = value
    
    # Record metrics
    duration = time.time() - start_time
    endpoint = request.url.path
    method = request.method
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=response.status_code).inc()
    REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
    
    return response


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests for observability"""
    request_id = request.headers.get("X-Request-ID", "")
    
    logger.info(
        "Request started",
        method=request.method,
        path=request.url.path,
        request_id=request_id,
    )
    
    try:
        response = await call_next(request)
        
        logger.info(
            "Request completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            request_id=request_id,
        )
        
        return response
    except Exception as e:
        logger.error(
            "Request failed",
            method=request.method,
            path=request.url.path,
            error=str(e),
            request_id=request_id,
        )
        capture_exception(e, {"path": request.url.path, "method": request.method})
        raise


# ===================
# Global Exception Handler
# ===================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors"""
    capture_exception(exc, {"path": request.url.path, "method": request.method})
    
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        error_type=type(exc).__name__,
    )
    
    if settings.is_development:
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "type": type(exc).__name__,
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )


# ===================
# Include Routers
# ===================

# Core APIs
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(orders.router)
app.include_router(quotations.router)
app.include_router(customers.router)
app.include_router(tours.router)
app.include_router(sessions.router)
app.include_router(corporate_accounts.router)
app.include_router(budgets.router)
app.include_router(polls.router)
app.include_router(reports.router)

# Communication & Notifications
app.include_router(line.router)
app.include_router(notifications.router)

# P0 Critical Modules
app.include_router(suppliers.router)
app.include_router(flights.router)
app.include_router(payments.router)
app.include_router(passports.router)
app.include_router(operations.router)

# P1 Features
app.include_router(excel.router)
app.include_router(analytics.router)

# Import / Chrome Extension
app.include_router(import_api.router)

# Weather Push (CWA + Gemini AI)
app.include_router(weather_push.router)


# ===================
# WebSocket Connection Manager
# ===================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str = "global"):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        self.active_connections[session_id].add(websocket)
        
        # Update metrics
        total_connections = sum(len(conns) for conns in self.active_connections.values())
        set_websocket_connections(total_connections)
    
    def disconnect(self, websocket: WebSocket, session_id: str = "global"):
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        
        # Update metrics
        total_connections = sum(len(conns) for conns in self.active_connections.values())
        set_websocket_connections(total_connections)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast(self, message: str, session_id: str = "global"):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_text(message)
                except:
                    pass


manager = ConnectionManager()


# ===================
# Health & Monitoring Endpoints
# ===================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
async def health():
    """
    Health check endpoint.
    Returns detailed health status for monitoring.
    """
    db_health = await check_database_health()
    app_health = get_health_status()
    
    is_healthy = db_health.get("status") == "healthy"
    
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "timestamp": asyncio.get_event_loop().time(),
        "database": db_health,
        "application": app_health,
    }


@app.get("/health/live")
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "alive"}


@app.get("/health/ready")
async def readiness():
    """Kubernetes readiness probe"""
    db_health = await check_database_health()
    
    if db_health.get("status") != "healthy":
        return JSONResponse(
            status_code=503,
            content={"status": "not ready", "database": db_health}
        )
    
    return {"status": "ready"}


@app.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint.
    Returns metrics in Prometheus text format.
    """
    return Response(
        content=get_metrics(),
        media_type=get_metrics_content_type()
    )


# ===================
# WebSocket Endpoint
# ===================

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


# ===================
# Startup / Shutdown Events
# ===================

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info(
        "Application starting",
        environment=settings.ENVIRONMENT,
        version=settings.APP_VERSION,
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("Application shutting down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=settings.SERVER_RELOAD
    )
