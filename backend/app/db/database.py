"""
Database configuration and session management
P0 Enhanced: PostgreSQL support with connection pooling
"""
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Determine database type from URL
is_sqlite = "sqlite" in settings.DATABASE_URL
is_postgres = "postgresql" in settings.DATABASE_URL

# Configure engine based on database type
if is_sqlite:
    # SQLite configuration (for development/testing)
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
elif is_postgres:
    # PostgreSQL configuration (for production)
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_pre_ping=True,  # Verify connections before use
        echo=settings.is_development,  # Log SQL in development
    )
else:
    # Default configuration for other databases
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


# Database connection event handlers for observability
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign keys for SQLite"""
    if is_sqlite:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    """Log when a connection is checked out from the pool"""
    if settings.is_development:
        logger.debug("Database connection checked out from pool")


# Dependency to get DB session
def get_db():
    """
    Database session dependency for FastAPI endpoints.
    Ensures proper connection management and cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Health check function
async def check_database_health() -> dict:
    """Check database connectivity and return health status"""
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return {
            "status": "healthy",
            "database_type": "postgresql" if is_postgres else "sqlite",
            "pool_size": settings.DB_POOL_SIZE if is_postgres else 1,
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
        }
