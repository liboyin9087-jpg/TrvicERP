"""
Observability and Monitoring Service
P0 Critical: Logging, metrics, and error tracking for production
"""
import logging
import sys
import time
from typing import Optional, Callable, Any
from functools import wraps
from contextlib import contextmanager

import structlog
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

from app.core.config import settings

# ===================
# Sentry Integration
# ===================
sentry_initialized = False

if settings.SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.SENTRY_ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
            ],
            send_default_pii=False,  # Don't send personal data
        )
        sentry_initialized = True
        logging.info("Sentry initialized successfully")
    except Exception as e:
        logging.warning(f"Failed to initialize Sentry: {e}")


# ===================
# Prometheus Metrics
# ===================
# Request metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"]
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

# Business metrics
ORDERS_CREATED = Counter(
    "orders_created_total",
    "Total orders created",
    ["status"]
)

PAYMENTS_PROCESSED = Counter(
    "payments_processed_total",
    "Total payments processed",
    ["status", "method"]
)

AI_REQUESTS = Counter(
    "ai_requests_total",
    "Total AI API requests",
    ["mode", "status"]
)

LINE_MESSAGES_SENT = Counter(
    "line_messages_sent_total",
    "Total LINE messages sent",
    ["status"]
)

EMAILS_SENT = Counter(
    "emails_sent_total",
    "Total emails sent",
    ["template", "status"]
)

# System metrics
ACTIVE_WEBSOCKET_CONNECTIONS = Gauge(
    "websocket_connections_active",
    "Number of active WebSocket connections"
)

DATABASE_POOL_SIZE = Gauge(
    "database_pool_size",
    "Database connection pool size"
)

DATABASE_POOL_CHECKED_OUT = Gauge(
    "database_pool_checked_out",
    "Database connections currently in use"
)


# ===================
# Structured Logging
# ===================
def configure_logging():
    """Configure structured logging with structlog"""
    
    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if settings.is_development else logging.INFO,
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            # Use JSON in production, console in development
            structlog.processors.JSONRenderer() if settings.is_production
            else structlog.dev.ConsoleRenderer(colors=True),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.DEBUG if settings.is_development else logging.INFO
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = __name__) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance"""
    return structlog.get_logger(name)


# ===================
# Request Tracking
# ===================
@contextmanager
def track_request(method: str, endpoint: str):
    """Context manager to track request metrics"""
    start_time = time.time()
    status_code = "500"
    
    try:
        yield
        status_code = "200"
    except Exception as e:
        status_code = "500"
        raise
    finally:
        duration = time.time() - start_time
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
        REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)


def track_request_decorator(endpoint: str):
    """Decorator to track request metrics"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            status_code = "200"
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status_code = "500"
                raise
            finally:
                duration = time.time() - start_time
                method = "POST"  # Default, could be extracted from request
                REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
                REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            status_code = "200"
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                status_code = "500"
                raise
            finally:
                duration = time.time() - start_time
                method = "POST"
                REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
                REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
        
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# ===================
# Business Event Tracking
# ===================
def track_order_created(status: str = "pending"):
    """Track order creation"""
    ORDERS_CREATED.labels(status=status).inc()


def track_payment_processed(status: str, method: str = "stripe"):
    """Track payment processing"""
    PAYMENTS_PROCESSED.labels(status=status, method=method).inc()


def track_ai_request(mode: str, status: str):
    """Track AI API request"""
    AI_REQUESTS.labels(mode=mode, status=status).inc()


def track_line_message(status: str):
    """Track LINE message sent"""
    LINE_MESSAGES_SENT.labels(status=status).inc()


def track_email_sent(template: str, status: str):
    """Track email sent"""
    EMAILS_SENT.labels(template=template, status=status).inc()


def set_websocket_connections(count: int):
    """Set active WebSocket connection count"""
    ACTIVE_WEBSOCKET_CONNECTIONS.set(count)


# ===================
# Error Tracking
# ===================
def capture_exception(exc: Exception, context: Optional[dict] = None):
    """Capture exception and send to Sentry"""
    logger = get_logger("error_tracking")
    
    # Log locally
    logger.error(
        "Exception captured",
        exception=str(exc),
        exception_type=type(exc).__name__,
        context=context,
    )
    
    # Send to Sentry if initialized
    if sentry_initialized:
        import sentry_sdk
        with sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            sentry_sdk.capture_exception(exc)


def capture_message(message: str, level: str = "info", context: Optional[dict] = None):
    """Capture message and send to Sentry"""
    logger = get_logger("message_tracking")
    
    # Log locally
    log_method = getattr(logger, level, logger.info)
    log_method(message, context=context)
    
    # Send to Sentry if initialized
    if sentry_initialized:
        import sentry_sdk
        sentry_sdk.capture_message(message, level=level)


# Health Check
# ===================
def get_health_status() -> dict:
    """Get comprehensive health status"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "sentry_enabled": sentry_initialized,
        "version": settings.APP_VERSION,
    }


def get_metrics() -> bytes:
    """Get Prometheus metrics in text format"""
    return generate_latest()


def get_metrics_content_type() -> str:
    """Get content type for Prometheus metrics"""
    return CONTENT_TYPE_LATEST


# Initialize logging on module load
configure_logging()
