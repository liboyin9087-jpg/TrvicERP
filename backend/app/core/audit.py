"""
Audit logging utility for TrvicERP
Provides easy-to-use functions for logging actions across the API
"""
from sqlalchemy.orm import Session
from app.models.models import AuditLog
from uuid import uuid4
from typing import Optional, Dict, Any
from datetime import datetime


class AuditLogger:
    """
    Utility class for creating audit log entries
    """
    
    @staticmethod
    def log_action(
        db: Session,
        user_id: Optional[str],
        action: str,
        resource_type: str,
        resource_id: str,
        changes: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """
        Log an action to the audit trail
        
        Args:
            db: Database session
            user_id: ID of the user performing the action (None for system actions)
            action: Action type (e.g., CREATE_ORDER, UPDATE_CUSTOMER, DELETE_SESSION)
            resource_type: Type of resource (e.g., order, customer, session)
            resource_id: ID of the affected resource
            changes: Dictionary containing the changes made (old/new values or full state)
        
        Returns:
            The created AuditLog entry
        """
        audit_log = AuditLog(
            id=f"audit_{uuid4().hex[:16]}",
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            changes=changes,
            timestamp=datetime.utcnow()
        )
        
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        
        return audit_log
    
    @staticmethod
    def log_create(
        db: Session,
        user_id: Optional[str],
        resource_type: str,
        resource_id: str,
        new_data: Dict[str, Any]
    ) -> AuditLog:
        """
        Log a CREATE action
        """
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=f"CREATE_{resource_type.upper()}",
            resource_type=resource_type,
            resource_id=resource_id,
            changes={"new": new_data}
        )
    
    @staticmethod
    def log_update(
        db: Session,
        user_id: Optional[str],
        resource_type: str,
        resource_id: str,
        old_data: Dict[str, Any],
        new_data: Dict[str, Any]
    ) -> AuditLog:
        """
        Log an UPDATE action with before/after values
        """
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=f"UPDATE_{resource_type.upper()}",
            resource_type=resource_type,
            resource_id=resource_id,
            changes={"old": old_data, "new": new_data}
        )
    
    @staticmethod
    def log_delete(
        db: Session,
        user_id: Optional[str],
        resource_type: str,
        resource_id: str,
        old_data: Dict[str, Any]
    ) -> AuditLog:
        """
        Log a DELETE action
        """
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=f"DELETE_{resource_type.upper()}",
            resource_type=resource_type,
            resource_id=resource_id,
            changes={"old": old_data}
        )


def get_current_user_id() -> Optional[str]:
    """
    Helper function to get current user ID from request context
    In a real implementation, this would extract the user from JWT token
    For now, returns None (system action)
    """
    # TODO: Implement proper user context extraction from JWT
    return None
