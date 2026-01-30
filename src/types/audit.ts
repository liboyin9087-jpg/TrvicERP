// ============================================
// Audit Log System Types
// ============================================

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_role: "admin" | "staff" | "traveler" | "system";
  action: AuditAction;
  resource_type: ResourceType;
  resource_id: string;
  resource_name?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  metadata?: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
  tags?: string[];
}

export type AuditAction =
  // CRUD Operations
  | "create"
  | "read"
  | "update"
  | "delete"
  // Authentication & Authorization
  | "login"
  | "logout"
  | "login_failed"
  | "password_changed"
  | "role_changed"
  // Business Operations
  | "booking_created"
  | "booking_updated"
  | "booking_cancelled"
  | "payment_processed"
  | "payment_failed"
  | "refund_issued"
  | "tour_session_created"
  | "tour_session_updated"
  | "tour_session_closed"
  | "passport_submitted"
  | "passport_returned"
  | "passport_lost"
  | "document_exported"
  | "report_generated"
  // System Operations
  | "system_backup"
  | "system_restore"
  | "config_changed"
  | "data_import"
  | "data_export"
  | "bulk_update"
  // Security Events
  | "permission_denied"
  | "suspicious_activity"
  | "data_breach_detected";

export type ResourceType =
  | "user"
  | "booking"
  | "tour_session"
  | "passport"
  | "payment"
  | "tour_cost"
  | "supplier"
  | "document"
  | "system_config"
  | "audit_log"
  | "session"
  | "permission";

export interface AuditLogQuery {
  user_id?: string;
  action?: AuditAction | AuditAction[];
  resource_type?: ResourceType | ResourceType[];
  resource_id?: string;
  date_from?: string;
  date_to?: string;
  severity?: AuditLog["severity"] | AuditLog["severity"][];
  tags?: string[];
  /** 搜尋 metadata 中的 key 或 value（模糊比對） */
  metadata_search?: string;
  limit?: number;
  offset?: number;
  order_by?: "timestamp" | "action" | "severity";
  order_direction?: "asc" | "desc";
}

export interface AuditLogStats {
  total_logs: number;
  logs_by_action: Record<AuditAction, number>;
  logs_by_severity: Record<AuditLog["severity"], number>;
  logs_by_user: Array<{ user_id: string; user_name: string; count: number }>;
  logs_by_resource: Record<ResourceType, number>;
  recent_activity: AuditLog[];
  security_alerts: AuditLog[];
}

// ============================================
// Configuration
// ============================================

export interface AuditConfig {
  enabled: boolean;
  retention_days: number;
  log_levels: AuditLog["severity"][];
  excluded_actions?: AuditAction[];
  excluded_resources?: ResourceType[];
  auto_archive: boolean;
  real_time_alerts: {
    enabled: boolean;
    webhook_url?: string;
    alert_on_severity: AuditLog["severity"][];
    alert_on_actions: AuditAction[];
  };
  compliance_mode: boolean; // GDPR/SOX compliance requirements
}
