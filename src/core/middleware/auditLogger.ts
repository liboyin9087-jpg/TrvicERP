/**
 * 審計日誌中間件
 * Audit Log Middleware
 */

import { AuthService } from '../services/authService';

/**
 * 操作類型
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'APPROVE'
  | 'REJECT'
  | 'CANCEL';

/**
 * 審計日誌項目
 */
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: string; // 資源類型，如 'order', 'quotation'
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * 審計日誌服務
 */
class AuditLoggerService {
  private logs: AuditLog[] = [];
  private maxLogs = 1000; // 本地保留的最大日誌數

  /**
   * 記錄操作
   */
  log(
    action: AuditAction,
    resource: string,
    options: {
      resourceId?: string;
      details?: Record<string, any>;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): void {
    const user = AuthService.getCurrentUser();
    if (!user) {
      console.warn('Audit log: No user found');
      return;
    }

    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userName: user.name,
      action,
      resource,
      resourceId: options.resourceId,
      details: options.details,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      success: options.success !== false,
      errorMessage: options.errorMessage,
    };

    // 保存到本地存儲
    this.saveLog(log);

    // 在開發環境中輸出到控制台
    if (import.meta.env.DEV) {
      console.log('[Audit Log]', log);
    }
  }

  /**
   * 保存日誌到本地存儲
   */
  private saveLog(log: AuditLog): void {
    try {
      const stored = localStorage.getItem('audit_logs');
      const logs: AuditLog[] = stored ? JSON.parse(stored) : [];
      logs.push(log);

      // 限制日誌數量
      if (logs.length > this.maxLogs) {
        logs.splice(0, logs.length - this.maxLogs);
      }

      localStorage.setItem('audit_logs', JSON.stringify(logs));
      this.logs = logs;
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }

  /**
   * 取得日誌列表
   */
  getLogs(filters?: {
    userId?: string;
    resource?: string;
    action?: AuditAction;
    startDate?: string;
    endDate?: string;
  }): AuditLog[] {
    let logs = [...this.logs];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter((log) => log.userId === filters.userId);
      }
      if (filters.resource) {
        logs = logs.filter((log) => log.resource === filters.resource);
      }
      if (filters.action) {
        logs = logs.filter((log) => log.action === filters.action);
      }
      if (filters.startDate) {
        logs = logs.filter((log) => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter((log) => log.timestamp <= filters.endDate!);
      }
    }

    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * 清除日誌
   */
  clearLogs(): void {
    localStorage.removeItem('audit_logs');
    this.logs = [];
  }

  /**
   * 取得客戶端 IP（前端無法直接取得，返回空）
   */
  private getClientIP(): string | undefined {
    // 前端無法直接取得 IP，需要通過後端 API
    return undefined;
  }

  /**
   * 初始化（從本地存儲載入日誌）
   */
  init(): void {
    try {
      const stored = localStorage.getItem('audit_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  }
}

// 單例實例
export const auditLogger = new AuditLoggerService();

// 初始化
auditLogger.init();

/**
 * 審計日誌裝飾器（用於服務方法）
 */
export function AuditLog(
  action: AuditAction,
  resource: string
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        const result = await originalMethod.apply(this, args);
        
        // 記錄成功操作
        auditLogger.log(action, resource, {
          resourceId: args[0]?.id || args[0],
          details: { method: propertyKey, args: args.slice(1) },
          success: true,
        });

        return result;
      } catch (error) {
        // 記錄失敗操作
        auditLogger.log(action, resource, {
          resourceId: args[0]?.id || args[0],
          details: { method: propertyKey, args: args.slice(1) },
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    };

    return descriptor;
  };
}
