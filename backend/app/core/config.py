"""
Configuration settings for the backend API
支援開發環境 (SQLite) 與生產環境 (PostgreSQL/Supabase)
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"  # development, staging, production
    DEBUG: bool = True
    
    # Database - 支援 SQLite (開發) 和 PostgreSQL (生產)
    DATABASE_URL: str = "sqlite:///./trvicerp.db"
    # Supabase PostgreSQL 連接 (生產環境)
    SUPABASE_DB_URL: Optional[str] = None
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Database Pool Settings (PostgreSQL)
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    
    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS - 生產環境需設定正確的前端網域
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://*.vercel.app"
    
    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 4000
    SERVER_RELOAD: bool = True
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    
    # LINE Messaging API
    LINE_CHANNEL_ACCESS_TOKEN: str = ""
    LINE_CHANNEL_SECRET: str = ""
    LINE_NOTIFY_TOKEN: Optional[str] = None
    
    # Payment Gateway - 綠界 ECPay
    ECPAY_MERCHANT_ID: Optional[str] = None
    ECPAY_HASH_KEY: Optional[str] = None
    ECPAY_HASH_IV: Optional[str] = None
    ECPAY_SANDBOX: bool = True  # True for testing
    
    # Invoice - 電子發票
    EINVOICE_APP_ID: Optional[str] = None
    EINVOICE_API_KEY: Optional[str] = None
    
    # External APIs
    OPENWEATHER_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    # Sentry Error Monitoring
    SENTRY_DSN: Optional[str] = None
    
    @property
    def cors_origins_list(self) -> List[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        # 展開 wildcard patterns for Vercel
        expanded = []
        for origin in origins:
            if "*" not in origin:
                expanded.append(origin)
        # 在生產環境中，需要明確列出允許的域名
        return expanded if expanded else ["*"]
    
    @property
    def effective_database_url(self) -> str:
        """根據環境返回正確的資料庫連接字串"""
        if self.ENVIRONMENT == "production" and self.SUPABASE_DB_URL:
            return self.SUPABASE_DB_URL
        return self.DATABASE_URL
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.effective_database_url.lower()
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
