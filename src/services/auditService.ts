import type {
  AuditLog,
  AuditAction,
  ResourceType,
  AuditLogQuery,
  AuditLogStats,
} from "@/types/audit";

// ============================================
// 1. Configuration Interfaces and Validation
// ============================================

/**
 * AuditConfig defines the configuration structure for the Audit Service.
 * This interface is also used as a prop for Kintone independence.
 */
export interface AuditConfig {
  enabled: boolean;
  retention_days: number;
  log_levels: Array<AuditLog["severity"]>;
  auto_archive: boolean;
  real_time_alerts: {
    enabled: boolean;
    alert_on_severity: Array<AuditLog["severity"]>;
    alert_on_actions: AuditAction[];
    // Add alert channels configuration if necessary, e.g., webhook URL, email recipient
  };
  compliance_mode: boolean;
  // Buffer specific settings
  buffer_flush_interval_ms?: number; // How often to flush the buffer
  buffer_max_size?: number; // Max logs in buffer before immediate flush
  excluded_actions?: AuditAction[]; // Actions to explicitly exclude from logging
}

/**
 * Defines a validator for AuditConfig.
 */
interface IAuditConfigValidator {
  validate(config: AuditConfig): void;
}

/**
 * Concrete implementation for AuditConfig validation.
 */
class AuditConfigValidator implements IAuditConfigValidator {
  validate(config: AuditConfig): void {
    if (typeof config.enabled !== "boolean") {
      throw new Error("AuditConfig: 'enabled' must be a boolean.");
    }
    if (typeof config.retention_days !== "number" || config.retention_days <= 0) {
      throw new Error("AuditConfig: 'retention_days' must be a positive number.");
    }
    if (!Array.isArray(config.log_levels) || config.log_levels.length === 0) {
      throw new Error("AuditConfig: 'log_levels' must be a non-empty array.");
    }
    if (typeof config.auto_archive !== "boolean") {
      throw new Error("AuditConfig: 'auto_archive' must be a boolean.");
    }
    if (typeof config.real_time_alerts !== "object" || config.real_time_alerts === null) {
      throw new Error("AuditConfig: 'real_time_alerts' must be an object.");
    }
    if (typeof config.real_time_alerts.enabled !== "boolean") {
      throw new Error("AuditConfig: 'real_time_alerts.enabled' must be a boolean.");
    }
    if (!Array.isArray(config.real_time_alerts.alert_on_severity)) {
      throw new Error("AuditConfig: 'real_time_alerts.alert_on_severity' must be an array.");
    }
    if (!Array.isArray(config.real_time_alerts.alert_on_actions)) {
      throw new Error("AuditConfig: 'real_time_alerts.alert_on_actions' must be an array.");
    }
    if (typeof config.compliance_mode !== "boolean") {
      throw new Error("AuditConfig: 'compliance_mode' must be a boolean.");
    }
    if (config.buffer_flush_interval_ms !== undefined && (typeof config.buffer_flush_interval_ms !== "number" || config.buffer_flush_interval_ms <= 0)) {
      throw new Error("AuditConfig: 'buffer_flush_interval_ms' must be a positive number.");
    }
    if (config.buffer_max_size !== undefined && (typeof config.buffer_max_size !== "number" || config.buffer_max_size <= 0)) {
      throw new Error("AuditConfig: 'buffer_max_size' must be a positive number.");
    }
    if (config.excluded_actions !== undefined && !Array.isArray(config.excluded_actions)) {
      throw new Error("AuditConfig: 'excluded_actions' must be an array if provided.");
    }
  }
}

// ============================================
// 2. Storage Layer
// ============================================

/**
 * Interface for Audit Log storage operations.
 * This separates the data persistence logic from the core audit service.
 * In a real application, this would likely be an abstraction over a database or an API client.
 */
interface IAuditLogStorage {
  saveLogs(logs: AuditLog[]): Promise<void>;
  getLogs(): Promise<AuditLog[]>;
  queryLogs(params: AuditLogQuery): Promise<{ logs: AuditLog[]; total: number; has_more: boolean }>;
  getLogStats(dateRange?: { from: string; to: string }): Promise<AuditLogStats>;
  deleteLogs(ids: string[]): Promise<{ deleted_count: number }>;
}

/**
 * A mock implementation of IAuditLogStorage using localStorage.
 * This is for demonstration/development purposes. In production, this would
 * connect to a backend API or database.
 */
class LocalStorageAuditLogStorage implements IAuditLogStorage {
  private readonly STORAGE_KEY = "trvic_audit_logs";

  private getStoredLogs(): AuditLog[] {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("LocalStorageAuditLogStorage: Failed to parse stored logs. Returning empty array.", error);
      return [];
    }
  }

  private saveStoredLogs(logs: AuditLog[]): void {
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error("LocalStorageAuditLogStorage: Failed to save audit logs:", error);
      // For localStorage, just logging might be sufficient as it's typically for dev.
    }
  }

  async saveLogs(logs: AuditLog[]): Promise<void> {
    const existingLogs = this.getStoredLogs();
    const updatedLogs = [...existingLogs, ...logs];
    this.saveStoredLogs(updatedLogs);
    console.debug(`LocalStorageAuditLogStorage: Saved ${logs.length} logs.`);
  }

  async getLogs(): Promise<AuditLog[]> {
    return this.getStoredLogs();
  }

  async queryLogs(params: AuditLogQuery): Promise<{
    logs: AuditLog[];
    total: number;
    has_more: boolean;
  }> {
    // This is a simulation. A real implementation would query a database.
    let filteredLogs = this.getStoredLogs();

    if (params.user_id) {
      filteredLogs = filteredLogs.filter((log) => log.user_id === params.user_id);
    }
    if (params.action) {
      const actions = Array.isArray(params.action) ? params.action : [params.action];
      filteredLogs = filteredLogs.filter((log) => actions.includes(log.action));
    }
    if (params.resource_type) {
      const types = Array.isArray(params.resource_type) ? params.resource_type : [params.resource_type];
      filteredLogs = filteredLogs.filter((log) => types.includes(log.resource_type));
    }
    if (params.date_from) {
      filteredLogs = filteredLogs.filter((log) => log.timestamp >= params.date_from!);
    }
    if (params.date_to) {
      filteredLogs = filteredLogs.filter((log) => log.timestamp <= params.date_to!);
    }
    if (params.severity) {
      const severities = Array.isArray(params.severity) ? params.severity : [params.severity];
      filteredLogs = filteredLogs.filter((log) => severities.includes(log.severity));
    }
    // TODO: Add support for metadata and tags search if needed for a more complete mock

    const orderBy = params.order_by || "timestamp";
    const direction = params.order_direction || "desc";

    filteredLogs.sort((a, b) => {
      const aVal = (a as any)[orderBy];
      const bVal = (b as any)[orderBy];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        // Fallback for non-string comparable types or numerical comparison
        return direction === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      }
    });

    const offset = params.offset || 0;
    const limit = params.limit || 50;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total: filteredLogs.length,
      has_more: offset + limit < filteredLogs.length,
    };
  }

  async getLogStats(dateRange?: { from: string; to: string }): Promise<AuditLogStats> {
    // This is a simulation. A real implementation would query a database for aggregated stats.
    let filteredLogs = this.getStoredLogs();
    if (dateRange) {
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.timestamp >= dateRange.from && log.timestamp <= dateRange.to,
      );
    }

    const logs_by_action = {} as Record<AuditAction, number>;
    const logs_by_severity = {} as Record<AuditLog["severity"], number>;
    const logs_by_resource = {} as Record<ResourceType, number>;
    const user_counts = {} as Record<
      string,
      { user_name: string; count: number }
    >;

    filteredLogs.forEach((log) => {
      logs_by_action[log.action] = (logs_by_action[log.action] || 0) + 1;
      logs_by_severity[log.severity] = (logs_by_severity[log.severity] || 0) + 1;
      logs_by_resource[log.resource_type] = (logs_by_resource[log.resource_type] || 0) + 1;

      if (!user_counts[log.user_id]) {
        user_counts[log.user_id] = { user_name: log.user_name, count: 0 };
      }
      user_counts[log.user_id].count++;
    });

    const logs_by_user = Object.entries(user_counts)
      .map(([user_id, data]) => ({ user_id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

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

  async deleteLogs(ids: string[]): Promise<{ deleted_count: number }> {
    const existingLogs = this.getStoredLogs();
    const initialLength = existingLogs.length;
    const logsToKeep = existingLogs.filter((log) => !ids.includes(log.id));
    this.saveStoredLogs(logsToKeep);
    const deleted_count = initialLength - logsToKeep.length;
    console.debug(`LocalStorageAuditLogStorage: Deleted ${deleted_count} logs.`);
    return { deleted_count };
  }
}

// ============================================
// 3. Buffer Management Layer
// ============================================

/**
 * Interface for Audit Log Buffer management.
 * This decouples buffer logic from the core service.
 */
interface IAuditLogBuffer {
  add(log: AuditLog): void;
  flush(): Promise<void>;
  startPeriodicFlush(): void;
  stopPeriodicFlush(): void;
  getBufferSize(): number;
}

/**
 * Default implementation for IAuditLogBuffer.
 */
class DefaultAuditLogBuffer implements IAuditLogBuffer {
  private buffer: AuditLog[] = [];
  private flushTimer?: NodeJS.Timeout;
  private isFlushing: boolean = false; // To prevent concurrent flushes
  private readonly flushIntervalMs: number;
  private readonly maxBufferSize: number;
  private readonly storage: IAuditLogStorage; // Buffer needs to interact with storage

  constructor(storage: IAuditLogStorage, flushIntervalMs: number, maxBufferSize: number) {
    this.storage = storage;
    this.flushIntervalMs = flushIntervalMs;
    this.maxBufferSize = maxBufferSize;
  }

  add(log: AuditLog): void {
    this.buffer.push(log);
    // Immediate flush if buffer is full or for critical severity (as per original logic)
    if (this.buffer.length >= this.maxBufferSize || log.severity === "critical") {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0 || this.isFlushing) {
      return;
    }

    this.isFlushing = true;
    const logsToFlush = [...this.buffer]; // Copy logs for atomic clear
    this.buffer = []; // Clear buffer immediately

    try {
      await this.storage.saveLogs(logsToFlush);
      console.debug(`DefaultAuditLogBuffer: Flushed ${logsToFlush.length} logs to storage.`);
    } catch (error) {
      console.error("DefaultAuditLogBuffer: Failed to flush logs. Attempting to re-add to buffer for next flush.", error);
      // Re-add logs to buffer if saving fails to prevent data loss.
      // This is a simple retry. A more robust solution might involve a dead-letter queue or back-off strategy.
      this.buffer.unshift(...logsToFlush);
    } finally {
      this.isFlushing = false;
    }
  }

  startPeriodicFlush(): void {
    if (this.flushTimer) {
      this.stopPeriodicFlush(); // Ensure no duplicate timers
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
    console.debug(`DefaultAuditLogBuffer: Started periodic flush every ${this.flushIntervalMs}ms.`);
  }

  stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
      console.debug("DefaultAuditLogBuffer: Stopped periodic flush.");
    }
  }

  getBufferSize(): number {
    return this.buffer.length;
  }
}

// ============================================
// 4. Security Alert Layer
// ============================================

/**
 * Interface for Security Alert Service.
 * This separates alert notification logic from the core audit service.
 */
interface ISecurityAlertService {
  checkAndSendAlert(config: AuditConfig["real_time_alerts"], auditLog: AuditLog): Promise<void>;
}

/**
 * A mock implementation for ISecurityAlertService for development.
 * In production, this would integrate with a dedicated alert system (e.g., PagerDuty, Slack, email).
 */
class ConsoleSecurityAlertService implements ISecurityAlertService {
  async checkAndSendAlert(config: AuditConfig["real_time_alerts"], auditLog: AuditLog): Promise<void> {
    if (!config.enabled) {
      return;
    }

    const shouldAlert =
      config.alert_on_severity.includes(auditLog.severity) ||
      config.alert_on_actions.includes(auditLog.action);

    if (shouldAlert) {
      console.warn("🚨 Security Alert Triggered:", {
        action: auditLog.action,
        severity: auditLog.severity,
        user: auditLog.user_name,
        resource: `${auditLog.resource_type}:${auditLog.resource_id}`,
        timestamp: auditLog.timestamp,
        metadata: auditLog.metadata,
      });

      // Browser notification for client-side demo
      // Note: This does not use Dashtail UI components and is a standard browser API.
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          try {
            new Notification("TrvicERP Security Alert", {
              body: `Action: ${auditLog.action} by ${auditLog.user_name} on ${auditLog.resource_type}:${auditLog.resource_id}`,
              icon: "/favicon.ico",
              tag: `audit-alert-${auditLog.id}`,
            });
          } catch (notificationError) {
            console.error("Failed to show browser notification:", notificationError);
          }
        } else if (Notification.permission === "default") {
          // Optionally request permission if not already granted
          Notification.requestPermission();
        }
      }
    }
  }
}

// ============================================
// 5. Core Audit Service
// ============================================

// Params for the log method to avoid redundancy and allow client context
type AuditLogParams = {
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
  // New: add optional context about client for robust IP/UA retrieval from the caller (e.g., from request headers)
  client_ip?: string;
  user_agent_header?: string;
  session_id?: string;
};

/**
 * Interface for the Audit Service's public API.
 * This allows for easier testing and mocking of the AuditService itself.
 */
interface IAuditService {
  log(params: AuditLogParams): Promise<AuditLog | null>;
  logBatch(logs: AuditLogParams[]): Promise<(AuditLog | null)[]>;
  query(params: AuditLogQuery): Promise<{ logs: AuditLog[]; total: number; has_more: boolean }>;
  getStats(dateRange?: { from: string; to: string }): Promise<AuditLogStats>;
  trackChange<T extends Record<string, any>>(
    resource_type: ResourceType,
    resource_id: string,
    oldData: T,
    newData: T,
    user_context: {
      user_id: string;
      user_name: string;
      user_role: AuditLog["user_role"];
    },
  ): Promise<AuditLog | null>;
  cleanup(): Promise<{ deleted_count: number }>;
  stop(): void; // Added for graceful shutdown of periodic buffer flush
}

/**
 * Audit Service - 審計日誌系統
 *
 * 功能特點：
 * - 自動記錄所有關鍵操作
 * - 支援合規性要求（GDPR/SOX）
 * - 即時安全警報
 * - 資料變更追蹤
 *
 * 重寫說明：
 * - 儲存層分離：透過 IAuditLogStorage 介面與資料儲存解耦。
 * - 緩衝區分離：透過 IAuditLogBuffer 介面管理日誌緩衝與批次寫入。
 * - 安全警報分離：透過 ISecurityAlertService 介面處理即時警報。
 * - 相依性注入：所有外部服務（儲存、緩衝、警報、配置驗證）均透過建構子注入。
 * - 配置驗證：建構時對 AuditConfig 進行明確驗證。
 * - 錯誤處理：增強了異步操作的錯誤處理機制，並統一了錯誤處理策略。
 */
class AuditService implements IAuditService {
  private config: AuditConfig;
  private readonly storage: IAuditLogStorage;
  private readonly buffer: IAuditLogBuffer;
  private readonly alertService: ISecurityAlertService;

  constructor(
    config: AuditConfig,
    storage: IAuditLogStorage,
    buffer: IAuditLogBuffer,
    alertService: ISecurityAlertService,
    configValidator: IAuditConfigValidator, // Dependency injection for validator
  ) {
    // Validate config at instantiation time. If invalid, constructor will throw.
    configValidator.validate(config);

    this.config = config;
    this.storage = storage;
    this.buffer = buffer;
    this.alertService = alertService;

    if (this.config.enabled) {
      this.buffer.startPeriodicFlush();
    }
  }

  /**
   * 記錄審計日誌
   */
  async log(params: AuditLogParams): Promise<AuditLog | null> {
    if (!this.config.enabled) {
      return null;
    }

    // Check if action should be logged based on config's excluded actions
    if (this.config.excluded_actions?.includes(params.action)) {
      console.debug(`AuditService: Action '${params.action}' is explicitly excluded from logging.`);
      return null;
    }

    try {
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
        ip_address: params.client_ip || this.getClientIP(), // Allow caller to provide IP for accuracy
        user_agent: params.user_agent_header || this.getUserAgent(), // Allow caller to provide User-Agent
        session_id: params.session_id || this.getSessionId(), // Allow caller to provide Session ID
        metadata: params.metadata,
        severity: params.severity || this.calculateSeverity(params.action),
        tags: params.tags || [],
      };

      // Check log_levels filtering
      if (!this.config.log_levels.includes(auditLog.severity)) {
        console.debug(`AuditService: Log with severity '${auditLog.severity}' is not enabled by config.`);
        return null;
      }

      this.buffer.add(auditLog); // Add to buffer, which will handle flushing based on its rules

      // Delegate security alert checking to the alert service
      await this.alertService.checkAndSendAlert(this.config.real_time_alerts, auditLog);

      return auditLog;
    } catch (error) {
      console.error("AuditService: Failed to log audit event due to an internal error.", error);
      // Depending on the application's needs, could re-throw a custom error or return a specific error object.
      return null;
    }
  }

  /**
   * 批次記錄多個審計日誌
   */
  async logBatch(logs: AuditLogParams[]): Promise<(AuditLog | null)[]> {
    if (!this.config.enabled) {
      return logs.map(() => null);
    }
    // Each log call will internally go through buffering and alerting
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
    try {
      // Ensure any buffered logs are saved before querying to include most recent data
      await this.buffer.flush();
      return await this.storage.queryLogs(params);
    } catch (error) {
      console.error("AuditService: Failed to query audit logs:", error);
      throw new Error("Failed to retrieve audit logs."); // Propagate error for the caller to handle
    }
  }

  /**
   * 獲取審計統計
   */
  async getStats(dateRange?: {
    from: string;
    to: string;
  }): Promise<AuditLogStats> {
    try {
      // Ensure any buffered logs are saved before getting stats
      await this.buffer.flush();
      return await this.storage.getLogStats(dateRange);
    } catch (error) {
      console.error("AuditService: Failed to get audit stats:", error);
      throw new Error("Failed to retrieve audit statistics."); // Propagate error
    }
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
  ): Promise<AuditLog | null> {
    const changes = this.calculateChanges(oldData, newData);

    if (Object.keys(changes.old_values).length === 0) {
      console.debug("AuditService: No changes detected for tracking.");
      return null; // No actual changes, no log needed
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
      severity: "medium", // Default severity for data updates
      tags: ["data_change"],
    });
  }

  /**
   * 清理過期日誌
   */
  async cleanup(): Promise<{ deleted_count: number }> {
    if (!this.config.auto_archive) {
      console.debug("AuditService: Auto-archiving is disabled. Skipping cleanup.");
      return { deleted_count: 0 };
    }

    try {
      // Ensure any buffered logs are saved before cleanup
      await this.buffer.flush();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retention_days);
      const cutoffIso = cutoffDate.toISOString();

      const allLogs = await this.storage.getLogs(); // Get all logs from storage
      const logsToDelete = allLogs.filter((log) => log.timestamp < cutoffIso);
      const logIdsToDelete = logsToDelete.map(log => log.id);

      if (logIdsToDelete.length === 0) {
        console.debug("AuditService: No logs found for cleanup.");
        return { deleted_count: 0 };
      }

      const result = await this.storage.deleteLogs(logIdsToDelete);
      console.info(`AuditService: Cleaned up ${result.deleted_count} logs older than ${cutoffIso}.`);
      return result;
    } catch (error) {
      console.error("AuditService: Failed to perform cleanup:", error);
      throw new Error("Failed to clean up audit logs."); // Propagate error
    }
  }

  /**
   * Gracefully stop the audit service, flushing any remaining logs.
   * Should be called on application shutdown.
   */
  stop(): void {
    this.buffer.stopPeriodicFlush();
    this.buffer.flush(); // Perform a final flush asynchronously
    console.info("AuditService: Shut down initiated. Remaining logs will be flushed.");
  }

  // ============================================
  // Private Utility Methods (internal to AuditService)
  // ============================================

  private generateId(): string {
    // Generate a unique ID for each log entry
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getClientIP(): string {
    // In a browser environment, this IP is often the client's public IP as seen by the browser,
    // or localhost if running locally. For robust logging, client_ip should ideally be
    // passed from a backend API or a proxy that can reliably extract the real IP from request headers.
    return "127.0.0.1"; // Placeholder for client-side context
  }

  private getUserAgent(): string {
    return typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
  }

  private getSessionId(): string {
    if (typeof window !== "undefined" && window.sessionStorage) {
      let sessionId = sessionStorage.getItem("audit_session_id");
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        sessionStorage.setItem("audit_session_id", sessionId);
      }
      return sessionId;
    }
    return "unknown_session"; // For non-browser environments
  }

  private calculateSeverity(action: AuditAction): AuditLog["severity"] {
    // Determine severity based on common action patterns
    if (action.includes("failed") || action === "permission_denied" || action === "suspicious_activity" || action === "unauthorized_access") {
      return "high";
    }
    if (action === "data_breach_detected" || action === "system_compromised" || action === "emergency_shutdown") {
      return "critical";
    }
    if (action === "system_backup" || action === "system_restore" || action === "config_changed" || action === "user_role_changed" || action.includes("payment") || action.includes("refund")) {
      return "medium";
    }
    if (["create", "update", "delete", "login", "logout"].includes(action)) {
      return "low";
    }
    // Default severity for general informational actions
    return "info";
  }

  private calculateChanges<T extends Record<string, any>>(
    oldData: T,
    newData: T,
  ): { old_values: Partial<T>; new_values: Partial<T> } {
    const old_values: Partial<T> = {};
    const new_values: Partial<T> = {};

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      const oldValue = oldData[key];
      const newValue = newData[key];

      // Perform a deep comparison for objects/arrays to accurately detect changes.
      // JSON.stringify is a simple but effective way for serializable values.
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        old_values[key as keyof T] = oldValue;
        new_values[key as keyof T] = newValue;
      }
    }
    return { old_values, new_values };
  }
}

// ============================================
// Singleton Instance Initialization
// ============================================

// Default configuration for the audit service.
const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  enabled: true,
  retention_days: 90, // Keep logs for 90 days
  log_levels: ["info", "low", "medium", "high", "critical"], // All log levels enabled by default
  auto_archive: true,
  real_time_alerts: {
    enabled: true,
    alert_on_severity: ["high", "critical"],
    alert_on_actions: [
      "login_failed",
      "permission_denied",
      "suspicious_activity",
      "data_breach_detected",
      "unauthorized_access",
      "system_compromised",
      "emergency_shutdown",
    ],
  },
  compliance_mode: true, // Enable features for compliance (e.g., more detailed logs)
  buffer_flush_interval_ms: 5000, // Flush buffer every 5 seconds
  buffer_max_size: 10, // Flush if buffer reaches 10 logs
  excluded_actions: ["heartbeat", "health_check"], // Example of excluded actions
};

// Instantiate all dependencies for the AuditService
const auditStorage = new LocalStorageAuditLogStorage(); // Uses localStorage for demo
const auditBuffer = new DefaultAuditLogBuffer(
  auditStorage,
  DEFAULT_AUDIT_CONFIG.buffer_flush_interval_ms || 5000,
  DEFAULT_AUDIT_CONFIG.buffer_max_size || 10
);
const securityAlertService = new ConsoleSecurityAlertService(); // Logs alerts to console/browser notification
const configValidator = new AuditConfigValidator(); // For validating the config object

// Create the singleton instance of AuditService
export const auditService = new AuditService(
  DEFAULT_AUDIT_CONFIG,
  auditStorage,
  auditBuffer,
  securityAlertService,
  configValidator
);

// ============================================
// Convenience Functions for common logging patterns
// ============================================

/**
 * 快速記錄用戶操作。
 * 在實際應用中，user_id, user_name, user_role 應從當前認證上下文獲取。
 * 這裡將這些參數設為必填，以鼓勵顯式傳遞。
 */
export const logUserAction = (
  action: AuditAction,
  resource_type: ResourceType,
  resource_id: string,
  user_id: string,
  user_name: string,
  user_role: AuditLog["user_role"],
  metadata?: Record<string, any>,
  severity?: AuditLog["severity"],
  tags?: string[],
) => {
  return auditService.log({
    action,
    resource_type,
    resource_id,
    user_id,
    user_name,
    user_role,
    metadata,
    severity,
    tags,
    // client_ip, user_agent_header, session_id could also be passed if available in context
  });
};

/**
 * 記錄 TourSession 狀態變更。
 * 這是針對特定業務流程的便捷日誌記錄器。
 */
export const logTourSessionChange = (
  sessionId: string,
  oldStatus: string,
  newStatus: string,
  userId: string,
  userName: string,
  // user_role can be defaulted or passed if dynamic
) => {
  return auditService.log({
    action: "tour_session_updated",
    resource_type: "tour_session",
    resource_id: sessionId,
    old_values: { status: oldStatus },
    new_values: { status: newStatus },
    user_id: userId,
    user_name: userName,
    user_role: "staff", // Assuming 'staff' is the common role for this action
    metadata: {
      status_transition: `${oldStatus} → ${newStatus}`,
    },
    severity: "medium",
    tags: ["status_change", "tour_management"],
  });
};

// Export the singleton instance as the default export
export default auditService;