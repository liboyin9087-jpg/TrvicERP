/**
 * Audit Service - 審計日誌系統
 *
 * 功能特點：
 * - 自動記錄所有關鍵操作
 * - 支援合規性要求（GDPR/SOX）
 * - 即時安全警報
 * - 資料變更追蹤
 */

import type {
  AuditLog,
  AuditAction,
  ResourceType,
  AuditLogQuery,
  AuditLogStats,
  AuditConfig,
} from "@/types/audit";

// ============================================
// Service Implementation
// ============================================

class AuditService {
  private config: AuditConfig;
  private buffer: AuditLog[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: AuditConfig) {
    this.config = config;
    this.startPeriodicFlush();
  }

  /**
   * 記錄審計日誌
   */
  async log(params: {
    action: AuditAction;
    resource_type: ResourceType;
    resource_id: string;
    resource_name?: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    user_id?: string;
    user_name?: string;
    user_role?: AuditLog["user_role"];
    metadata?: Record<string, any>;
    severity?: AuditLog["severity"];
    tags?: string[];
  }): Promise<AuditLog> {
    if (!this.config.enabled) {
      return Promise.resolve({} as AuditLog);
    }

    // Check if action should be logged
    if (this.config.excluded_actions?.includes(params.action)) {
      return Promise.resolve({} as AuditLog);
    }

    const auditLog: AuditLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      user_id: params.user_id || "system",
      user_name: params.user_name || "System",
      user_role: params.user_role || "system",
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      resource_name: params.resource_name,
      old_values: params.old_values,
      new_values: params.new_values,
      ip_address: this.getClientIP(),
      user_agent: this.getUserAgent(),
      session_id: this.getSessionId(),
      metadata: params.metadata,
      severity: params.severity || this.calculateSeverity(params.action),
      tags: params.tags || [],
    };

    // Add to buffer for batch processing
    this.buffer.push(auditLog);

    // Check for immediate alerts
    this.checkSecurityAlerts(auditLog);

    // Flush if buffer is full or high severity
    if (this.buffer.length >= 10 || auditLog.severity === "critical") {
      await this.flush();
    }

    return auditLog;
  }

  /**
   * 批次記錄多個審計日誌
   */
  async logBatch(
    logs: Parameters<AuditService["log"]>[0][],
  ): Promise<AuditLog[]> {
    const auditLogs = await Promise.all(
      logs.map((logData) => this.log(logData)),
    );
    return auditLogs;
  }

  /**
   * 查詢審計日誌
   */
  async query(params: AuditLogQuery): Promise<{
    logs: AuditLog[];
    total: number;
    has_more: boolean;
  }> {
    // In real implementation, this would query the database
    // Here we simulate with localStorage for demo
    const storedLogs = this.getStoredLogs();

    let filteredLogs = storedLogs;

    // Apply filters
    if (params.user_id) {
      filteredLogs = filteredLogs.filter(
        (log) => log.user_id === params.user_id,
      );
    }

    if (params.action) {
      const actions = Array.isArray(params.action)
        ? params.action
        : [params.action];
      filteredLogs = filteredLogs.filter((log) => actions.includes(log.action));
    }

    if (params.resource_type) {
      const types = Array.isArray(params.resource_type)
        ? params.resource_type
        : [params.resource_type];
      filteredLogs = filteredLogs.filter((log) =>
        types.includes(log.resource_type),
      );
    }

    if (params.date_from) {
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp >= params.date_from!,
      );
    }

    if (params.date_to) {
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp <= params.date_to!,
      );
    }

    if (params.severity) {
      const severities = Array.isArray(params.severity)
        ? params.severity
        : [params.severity];
      filteredLogs = filteredLogs.filter((log) =>
        severities.includes(log.severity),
      );
    }

    // Sort
    const orderBy = params.order_by || "timestamp";
    const direction = params.order_direction || "desc";

    filteredLogs.sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];

      if (direction === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Pagination
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total: filteredLogs.length,
      has_more: offset + limit < filteredLogs.length,
    };
  }

  /**
   * 獲取審計統計
   */
  async getStats(dateRange?: {
    from: string;
    to: string;
  }): Promise<AuditLogStats> {
    const storedLogs = this.getStoredLogs();

    let filteredLogs = storedLogs;
    if (dateRange) {
      filteredLogs = storedLogs.filter(
        (log) =>
          log.timestamp >= dateRange.from && log.timestamp <= dateRange.to,
      );
    }

    // Calculate statistics
    const logs_by_action = {} as Record<AuditAction, number>;
    const logs_by_severity = {} as Record<AuditLog["severity"], number>;
    const logs_by_resource = {} as Record<ResourceType, number>;
    const user_counts = {} as Record<
      string,
      { user_name: string; count: number }
    >;

    filteredLogs.forEach((log) => {
      // By action
      logs_by_action[log.action] = (logs_by_action[log.action] || 0) + 1;

      // By severity
      logs_by_severity[log.severity] =
        (logs_by_severity[log.severity] || 0) + 1;

      // By resource
      logs_by_resource[log.resource_type] =
        (logs_by_resource[log.resource_type] || 0) + 1;

      // By user
      if (!user_counts[log.user_id]) {
        user_counts[log.user_id] = { user_name: log.user_name, count: 0 };
      }
      user_counts[log.user_id].count++;
    });

    const logs_by_user = Object.entries(user_counts)
      .map(([user_id, data]) => ({ user_id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most active users

    const recent_activity = filteredLogs
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 20);

    const security_alerts = filteredLogs
      .filter(
        (log) =>
          log.severity === "critical" ||
          log.action.includes("failed") ||
          log.action === "suspicious_activity",
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 10);

    return {
      total_logs: filteredLogs.length,
      logs_by_action,
      logs_by_severity,
      logs_by_user,
      logs_by_resource,
      recent_activity,
      security_alerts,
    };
  }

  /**
   * 追蹤資料變更
   */
  async trackChange<T extends Record<string, any>>(
    resource_type: ResourceType,
    resource_id: string,
    oldData: T,
    newData: T,
    user_context: {
      user_id: string;
      user_name: string;
      user_role: AuditLog["user_role"];
    },
  ): Promise<AuditLog> {
    // Calculate what changed
    const changes = this.calculateChanges(oldData, newData);

    if (Object.keys(changes.old_values).length === 0) {
      // No changes detected
      return {} as AuditLog;
    }

    return this.log({
      action: "update",
      resource_type,
      resource_id,
      old_values: changes.old_values,
      new_values: changes.new_values,
      metadata: {
        change_count: Object.keys(changes.old_values).length,
        changed_fields: Object.keys(changes.old_values),
      },
      ...user_context,
    });
  }

  /**
   * 清理過期日誌
   */
  async cleanup(): Promise<{ deleted_count: number }> {
    if (!this.config.auto_archive) {
      return { deleted_count: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retention_days);
    const cutoffIso = cutoffDate.toISOString();

    const storedLogs = this.getStoredLogs();
    const logsToKeep = storedLogs.filter((log) => log.timestamp >= cutoffIso);
    const deletedCount = storedLogs.length - logsToKeep.length;

    this.saveStoredLogs(logsToKeep);

    return { deleted_count: deletedCount };
  }

  // ============================================
  // Private Methods
  // ============================================

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(): string {
    // In browser environment, this would be handled by the backend
    return "127.0.0.1";
  }

  private getUserAgent(): string {
    return typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
  }

  private getSessionId(): string {
    // Get from session storage or generate
    if (typeof window !== "undefined") {
      let sessionId = sessionStorage.getItem("audit_session_id");
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem("audit_session_id", sessionId);
      }
      return sessionId;
    }
    return "unknown_session";
  }

  private calculateSeverity(action: AuditAction): AuditLog["severity"] {
    // Security and authentication events
    if (
      action.includes("failed") ||
      action === "permission_denied" ||
      action === "suspicious_activity"
    ) {
      return "high";
    }

    if (action === "data_breach_detected") {
      return "critical";
    }

    // System operations
    if (
      action === "system_backup" ||
      action === "system_restore" ||
      action === "config_changed"
    ) {
      return "medium";
    }

    // Financial operations
    if (action.includes("payment") || action === "refund_issued") {
      return "medium";
    }

    // Regular CRUD operations
    if (["create", "read", "update", "delete"].includes(action)) {
      return "low";
    }

    return "low";
  }

  private checkSecurityAlerts(auditLog: AuditLog): void {
    if (!this.config.real_time_alerts.enabled) {
      return;
    }

    const shouldAlert =
      this.config.real_time_alerts.alert_on_severity.includes(
        auditLog.severity,
      ) ||
      this.config.real_time_alerts.alert_on_actions.includes(auditLog.action);

    if (shouldAlert) {
      this.sendSecurityAlert(auditLog);
    }
  }

  private async sendSecurityAlert(auditLog: AuditLog): Promise<void> {
    // In production, this would send to webhook or notification service
    console.warn("🚨 Security Alert:", {
      action: auditLog.action,
      severity: auditLog.severity,
      user: auditLog.user_name,
      resource: `${auditLog.resource_type}:${auditLog.resource_id}`,
      timestamp: auditLog.timestamp,
    });

    // Could also show browser notification
    if (typeof window !== "undefined" && "Notification" in window) {
      new Notification("TrvicERP Security Alert", {
        body: `${auditLog.action} by ${auditLog.user_name}`,
        icon: "/favicon.ico",
      });
    }
  }

  private calculateChanges<T extends Record<string, any>>(
    oldData: T,
    newData: T,
  ): { old_values: Partial<T>; new_values: Partial<T> } {
    const old_values: Partial<T> = {};
    const new_values: Partial<T> = {};

    // Check all keys from both objects
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      const oldValue = oldData[key];
      const newValue = newData[key];

      // Skip if values are the same
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        old_values[key as keyof T] = oldValue;
        new_values[key as keyof T] = newValue;
      }
    }

    return { old_values, new_values };
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const logsToFlush = [...this.buffer];
    this.buffer = [];

    // In production, this would send to backend API
    // For demo, we use localStorage
    const existingLogs = this.getStoredLogs();
    const updatedLogs = [...existingLogs, ...logsToFlush];
    this.saveStoredLogs(updatedLogs);
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }

  private getStoredLogs(): AuditLog[] {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const stored = localStorage.getItem("trvic_audit_logs");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveStoredLogs(logs: AuditLog[]): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem("trvic_audit_logs", JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to save audit logs:", error);
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

const DEFAULT_CONFIG: AuditConfig = {
  enabled: true,
  retention_days: 90,
  log_levels: ["low", "medium", "high", "critical"],
  auto_archive: true,
  real_time_alerts: {
    enabled: true,
    alert_on_severity: ["high", "critical"],
    alert_on_actions: [
      "login_failed",
      "permission_denied",
      "suspicious_activity",
      "data_breach_detected",
    ],
  },
  compliance_mode: true,
};

export const auditService = new AuditService(DEFAULT_CONFIG);

// ============================================
// Convenience Functions
// ============================================

/**
 * 快速記錄用戶操作
 */
export const logUserAction = (
  action: AuditAction,
  resource_type: ResourceType,
  resource_id: string,
  metadata?: Record<string, any>,
) => {
  // In real app, get user from auth context
  return auditService.log({
    action,
    resource_type,
    resource_id,
    user_id: "current_user_id",
    user_name: "Current User",
    user_role: "staff",
    metadata,
  });
};

/**
 * 記錄 TourSession 狀態變更
 */
export const logTourSessionChange = (
  sessionId: string,
  oldStatus: string,
  newStatus: string,
  userId: string,
  userName: string,
) => {
  return auditService.log({
    action: "tour_session_updated",
    resource_type: "tour_session",
    resource_id: sessionId,
    old_values: { status: oldStatus },
    new_values: { status: newStatus },
    user_id: userId,
    user_name: userName,
    user_role: "staff",
    metadata: {
      status_transition: `${oldStatus} → ${newStatus}`,
    },
    severity: "medium",
    tags: ["status_change", "tour_management"],
  });
};

export default auditService;
