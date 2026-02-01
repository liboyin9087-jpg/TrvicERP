"""
Configuration settings for the backend API
P0 Enhanced: PostgreSQL, Stripe, Email, Observability, Security
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # ===================
    # Database Configuration
    # ===================
    DATABASE_URL: str = "sqlite:///./trvicerp.db"
    # For PostgreSQL production: postgresql://user:password@localhost:5432/trvicerp
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    
    # ===================
    # JWT Authentication
    # ===================
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # ===================
    # CORS Settings
    # ===================
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    # ===================
    # Server Configuration
    # ===================
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 4000
    SERVER_RELOAD: bool = True
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # ===================
    # WebSocket
    # ===================
    WS_HEARTBEAT_INTERVAL: int = 30
    
    # ===================
    # LINE Messaging API
    # ===================
    LINE_CHANNEL_ACCESS_TOKEN: str = ""
    LINE_CHANNEL_SECRET: str = ""
    
    # ===================
    # P0: Stripe Payment Integration
    # ===================
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_CURRENCY: str = "twd"
    
    # ===================
    # P0: Email Service (SMTP)
    # ===================
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "TrvicERP"
    SMTP_USE_TLS: bool = True
    
    # ===================
    # P0: Sentry Observability
    # ===================
    SENTRY_DSN: str = ""
    SENTRY_ENVIRONMENT: str = "development"
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1
    
    # ===================
    # P0: Rate Limiting
    # ===================
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds
    
    # ===================
    # P0: Redis (for caching and background tasks)
    # ===================
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # ===================
    # P0: Security
    # ===================
    ALLOWED_HOSTS: str = "*"
    SECRET_KEY: str = "your-app-secret-key-change-in-production"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
