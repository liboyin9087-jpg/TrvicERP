"""
Main FastAPI application for TrvicERP Backend API
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine
from app.api import (
    auth, users, orders, quotations, customers, tours,
    sessions, corporate_accounts, budgets, polls, reports, line,
    suppliers, flights, payments, passports, operations,
    excel, analytics, import_api, weather_push,
    insurance, visa, invoices
)
import json
from typing import Dict, Set
import asyncio

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="TrvicERP API",
    description="Travel Management ERP System API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
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
app.include_router(line.router)
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
# P2 Financial & Compliance Modules
app.include_router(invoices.router)
app.include_router(insurance.router)
app.include_router(visa.router)


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str = "global"):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        self.active_connections[session_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, session_id: str = "global"):
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
    
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


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "TrvicERP API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"
    }


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=settings.SERVER_RELOAD
    )
