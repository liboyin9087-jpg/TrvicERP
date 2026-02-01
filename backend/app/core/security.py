"""
Security Middleware and Utilities
P0 Critical: Rate limiting, RBAC, token management for production security
"""
from datetime import datetime, timedelta
from typing import Optional, List, Set, Dict, Any, Callable
from functools import wraps
import hashlib
import secrets

from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.auth import decode_token
from app.db.database import get_db
from app.models.models import User
import logging

logger = logging.getLogger(__name__)


# ===================
# Rate Limiting
# ===================
limiter = Limiter(key_func=get_remote_address)


def get_rate_limit_key(request: Request) -> str:
    """Get rate limit key from request"""
    # Use IP address as default key
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    return ip


# ===================
# Token Blacklist (In-Memory, use Redis in production)
# ===================
class TokenBlacklist:
    """
    Token blacklist for logout and token revocation.
    In production, use Redis for distributed blacklist.
    """
    
    def __init__(self):
        self._blacklisted_tokens: Set[str] = set()
        self._blacklisted_users: Set[str] = set()
        self._token_expiry: Dict[str, datetime] = {}
    
    def add_token(self, token: str, expiry: Optional[datetime] = None):
        """Add a token to the blacklist"""
        # Hash the token for storage
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        self._blacklisted_tokens.add(token_hash)
        
        if expiry:
            self._token_expiry[token_hash] = expiry
        else:
            # Default expiry: 7 days (refresh token lifetime)
            self._token_expiry[token_hash] = datetime.utcnow() + timedelta(days=7)
        
        logger.info(f"Token blacklisted: {token_hash[:8]}...")
    
    def is_blacklisted(self, token: str) -> bool:
        """Check if a token is blacklisted"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Clean expired entries
        self._cleanup_expired()
        
        return token_hash in self._blacklisted_tokens
    
    def blacklist_user(self, user_id: str):
        """Blacklist all tokens for a user"""
        self._blacklisted_users.add(user_id)
        logger.info(f"User blacklisted: {user_id}")
    
    def is_user_blacklisted(self, user_id: str) -> bool:
        """Check if a user is blacklisted"""
        return user_id in self._blacklisted_users
    
    def remove_user_blacklist(self, user_id: str):
        """Remove user from blacklist"""
        self._blacklisted_users.discard(user_id)
    
    def _cleanup_expired(self):
        """Remove expired tokens from blacklist"""
        now = datetime.utcnow()
        expired = [
            token_hash for token_hash, expiry in self._token_expiry.items()
            if expiry < now
        ]
        for token_hash in expired:
            self._blacklisted_tokens.discard(token_hash)
            del self._token_expiry[token_hash]


# Singleton instance
token_blacklist = TokenBlacklist()


# ===================
# RBAC (Role-Based Access Control)
# ===================
class Role:
    """Role definitions with permissions"""
    ADMIN = "admin"
    MANAGER = "manager"
    SALES = "sales"
    OPERATOR = "operator"
    FINANCE = "finance"
    WELFARE = "welfare"
    TRAVELER = "traveler"


class Permission:
    """Permission definitions"""
    # User management
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    
    # Order management
    ORDER_CREATE = "order:create"
    ORDER_READ = "order:read"
    ORDER_UPDATE = "order:update"
    ORDER_DELETE = "order:delete"
    ORDER_APPROVE = "order:approve"
    
    # Customer management
    CUSTOMER_CREATE = "customer:create"
    CUSTOMER_READ = "customer:read"
    CUSTOMER_UPDATE = "customer:update"
    CUSTOMER_DELETE = "customer:delete"
    
    # Tour management
    TOUR_CREATE = "tour:create"
    TOUR_READ = "tour:read"
    TOUR_UPDATE = "tour:update"
    TOUR_DELETE = "tour:delete"
    
    # Quotation management
    QUOTATION_CREATE = "quotation:create"
    QUOTATION_READ = "quotation:read"
    QUOTATION_UPDATE = "quotation:update"
    QUOTATION_DELETE = "quotation:delete"
    QUOTATION_APPROVE = "quotation:approve"
    
    # Payment management
    PAYMENT_CREATE = "payment:create"
    PAYMENT_READ = "payment:read"
    PAYMENT_PROCESS = "payment:process"
    PAYMENT_REFUND = "payment:refund"
    
    # Report access
    REPORT_VIEW = "report:view"
    REPORT_EXPORT = "report:export"
    
    # Admin operations
    ADMIN_SETTINGS = "admin:settings"
    ADMIN_AUDIT = "admin:audit"


# Role-Permission mapping
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    Role.ADMIN: [
        # Admin has all permissions
        Permission.USER_CREATE, Permission.USER_READ, Permission.USER_UPDATE, Permission.USER_DELETE,
        Permission.ORDER_CREATE, Permission.ORDER_READ, Permission.ORDER_UPDATE, Permission.ORDER_DELETE, Permission.ORDER_APPROVE,
        Permission.CUSTOMER_CREATE, Permission.CUSTOMER_READ, Permission.CUSTOMER_UPDATE, Permission.CUSTOMER_DELETE,
        Permission.TOUR_CREATE, Permission.TOUR_READ, Permission.TOUR_UPDATE, Permission.TOUR_DELETE,
        Permission.QUOTATION_CREATE, Permission.QUOTATION_READ, Permission.QUOTATION_UPDATE, Permission.QUOTATION_DELETE, Permission.QUOTATION_APPROVE,
        Permission.PAYMENT_CREATE, Permission.PAYMENT_READ, Permission.PAYMENT_PROCESS, Permission.PAYMENT_REFUND,
        Permission.REPORT_VIEW, Permission.REPORT_EXPORT,
        Permission.ADMIN_SETTINGS, Permission.ADMIN_AUDIT,
    ],
    Role.MANAGER: [
        Permission.USER_READ, Permission.USER_UPDATE,
        Permission.ORDER_CREATE, Permission.ORDER_READ, Permission.ORDER_UPDATE, Permission.ORDER_APPROVE,
        Permission.CUSTOMER_CREATE, Permission.CUSTOMER_READ, Permission.CUSTOMER_UPDATE,
        Permission.TOUR_CREATE, Permission.TOUR_READ, Permission.TOUR_UPDATE,
        Permission.QUOTATION_CREATE, Permission.QUOTATION_READ, Permission.QUOTATION_UPDATE, Permission.QUOTATION_APPROVE,
        Permission.PAYMENT_CREATE, Permission.PAYMENT_READ, Permission.PAYMENT_PROCESS,
        Permission.REPORT_VIEW, Permission.REPORT_EXPORT,
    ],
    Role.SALES: [
        Permission.ORDER_CREATE, Permission.ORDER_READ, Permission.ORDER_UPDATE,
        Permission.CUSTOMER_CREATE, Permission.CUSTOMER_READ, Permission.CUSTOMER_UPDATE,
        Permission.TOUR_READ,
        Permission.QUOTATION_CREATE, Permission.QUOTATION_READ, Permission.QUOTATION_UPDATE,
        Permission.PAYMENT_READ,
        Permission.REPORT_VIEW,
    ],
    Role.OPERATOR: [
        Permission.ORDER_READ, Permission.ORDER_UPDATE,
        Permission.CUSTOMER_READ,
        Permission.TOUR_READ, Permission.TOUR_UPDATE,
        Permission.QUOTATION_READ,
        Permission.REPORT_VIEW,
    ],
    Role.FINANCE: [
        Permission.ORDER_READ,
        Permission.CUSTOMER_READ,
        Permission.PAYMENT_CREATE, Permission.PAYMENT_READ, Permission.PAYMENT_PROCESS, Permission.PAYMENT_REFUND,
        Permission.REPORT_VIEW, Permission.REPORT_EXPORT,
    ],
    Role.WELFARE: [
        Permission.ORDER_CREATE, Permission.ORDER_READ,
        Permission.CUSTOMER_READ,
        Permission.TOUR_READ,
        Permission.QUOTATION_READ,
        Permission.PAYMENT_READ,
    ],
    Role.TRAVELER: [
        Permission.ORDER_READ,
        Permission.TOUR_READ,
    ],
}


def get_role_permissions(role: str) -> List[str]:
    """Get permissions for a role"""
    return ROLE_PERMISSIONS.get(role, [])


def has_permission(role: str, permission: str) -> bool:
    """Check if a role has a specific permission"""
    permissions = get_role_permissions(role)
    return permission in permissions


# ===================
# Authentication Dependencies
# ===================
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Get current authenticated user from JWT token.
    Returns None if no valid token provided.
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    
    # Check if token is blacklisted
    if token_blacklist.is_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )
    
    # Decode token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    
    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    # Check if user is blacklisted
    if token_blacklist.is_user_blacklisted(user_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User has been suspended",
        )
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )
    
    return user


async def require_auth(
    user: Optional[User] = Depends(get_current_user),
) -> User:
    """Require authentication"""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user


def require_permission(permission: str):
    """Dependency factory for permission checking"""
    async def permission_checker(
        user: User = Depends(require_auth),
    ) -> User:
        if not has_permission(user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}",
            )
        return user
    return permission_checker


def require_roles(*roles: str):
    """Dependency factory for role checking"""
    async def role_checker(
        user: User = Depends(require_auth),
    ) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role required: {', '.join(roles)}",
            )
        return user
    return role_checker


# ===================
# Security Headers Middleware
# ===================
def get_security_headers() -> Dict[str, str]:
    """Get security headers for responses"""
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    }


# ===================
# CSRF Protection
# ===================
def generate_csrf_token() -> str:
    """Generate a CSRF token"""
    return secrets.token_urlsafe(32)


def verify_csrf_token(token: str, expected: str) -> bool:
    """Verify CSRF token"""
    return secrets.compare_digest(token, expected)


# ===================
# Input Sanitization
# ===================
def sanitize_input(value: str, max_length: int = 10000) -> str:
    """Basic input sanitization"""
    if not value:
        return value
    
    # Truncate to max length
    value = value[:max_length]
    
    # Remove null bytes
    value = value.replace("\x00", "")
    
    return value


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    import re
    
    # Remove path separators
    filename = filename.replace("/", "_").replace("\\", "_")
    
    # Remove special characters
    filename = re.sub(r'[<>:"|?*]', "_", filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")
        filename = name[:250] + "." + ext if ext else name[:255]
    
    return filename
