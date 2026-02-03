"""
Database configuration and session management
支援 SQLite (開發) 與 PostgreSQL (生產/Supabase)
"""
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def get_engine():
    """
    根據環境建立適當的資料庫引擎
    - 開發環境：SQLite with StaticPool
    - 生產環境：PostgreSQL with QueuePool
    """
    db_url = settings.effective_database_url
    
    if settings.is_sqlite:
        # SQLite 配置（開發環境）
        logger.info("Using SQLite database for development")
        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=settings.DEBUG,
        )
    else:
        # PostgreSQL 配置（生產環境）
        logger.info(f"Using PostgreSQL database: {db_url[:50]}...")
        engine = create_engine(
            db_url,
            poolclass=QueuePool,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=settings.DB_POOL_TIMEOUT,
            pool_pre_ping=True,  # 自動檢測斷線並重連
            echo=settings.DEBUG,
        )
        
        # PostgreSQL 連接健康檢查
        @event.listens_for(engine, "connect")
        def connect(dbapi_connection, connection_record):
            connection_record.info["pid"] = id(dbapi_connection)
            logger.debug(f"Database connection established: {connection_record.info['pid']}")
        
        @event.listens_for(engine, "checkout")
        def checkout(dbapi_connection, connection_record, connection_proxy):
            logger.debug(f"Database connection checkout: {connection_record.info.get('pid')}")
    
    return engine


# Create database engine
engine = get_engine()

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


def get_db():
    """
    Dependency to get DB session
    確保每個請求使用獨立的資料庫連線，請求結束後正確關閉
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """
    初始化資料庫表格
    用於首次部署或開發環境設置
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise


def check_db_connection() -> bool:
    """
    檢查資料庫連線是否正常
    用於健康檢查端點
    """
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False
