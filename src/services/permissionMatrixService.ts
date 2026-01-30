/**
 * 細粒度權限控制矩陣服務
 * Fine-Grained Permission Matrix Service
 */

/**
 * 用戶角色類型
 * 從全域 Store 獨立出來，確保服務的 Kintone 獨立性。
 */
export type UserRole = 'staff' | 'welfare' | 'traveler';

/**
 * 權限動作類型
 */
export type PermissionAction =
  | 'create' | 'read' | 'update' | 'delete' | 'approve' | 'reject' | 'export' | 'import'
  | 'assign' | 'unassign' | 'publish' | 'unpublish' | 'archive' | 'restore'
  | 'view_sensitive' | 'modify_sensitive' | 'delete_sensitive'
  | 'manage_users' | 'manage_permissions' | 'view_audit' | 'manage_system';

/**
 * 資源類型
 */
export type ResourceType =
  | 'customer' | 'order' | 'quotation' | 'session' | 'itinerary' | 'payment'
  | 'staff' | 'guide' | 'driver' | 'vehicle' | 'hotel' | 'restaurant'
  | 'report' | 'audit_log' | 'system_config' | 'user_management'
  | 'financial_data' | 'sensitive_data' | 'api_keys' | 'backup';

/**
 * 權限等級
 */
export type PermissionLevel = 'none' | 'own' | 'team' | 'department' | 'all';

/**
 * 用戶資深程度
 */
export type UserSeniority = 'junior' | 'senior' | 'lead' | 'manager';

/**
 * 權限規則
 */
export interface PermissionRule {
  id: string;
  role: UserRole;
  resource: ResourceType;
  action: PermissionAction;
  level: PermissionLevel;
  conditions?: {
    department?: string[];
    seniority?: UserSeniority;
    timeRestriction?: {
      startHour: number;
      endHour: number;
      weekdaysOnly?: boolean;
    };
    ipWhitelist?: string[];
    requireApproval?: boolean;
    approvalThreshold?: number;
  };
  isActive: boolean;
  priority: number;
  description: string;
}

/**
 * 權限檢查結果
 */
export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
  requiresApproval?: boolean;
  approvers?: string[];
  conditions?: string[];
  expiresAt?: string;
}

/**
 * 權限違規記錄
 */
export interface PermissionViolation {
  id: string;
  userId: string;
  userRole: UserRole;
  resource: ResourceType;
  action: PermissionAction;
  attemptedAt: string;
  ipAddress: string;
  userAgent: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

/**
 * 用戶上下文，用於權限檢查時提供用戶相關資訊。
 * 此介面取代了服務內部對全域 Store 和 userSessions 的依賴。
 * 所有執行權限檢查所需的用戶資訊都應由此傳入。
 */
export interface UserContext {
  userId: string;
  userRole: UserRole;
  userDepartment: string;
  userSeniority: UserSeniority | 'unknown'; // 'unknown' for flexibility if not always present
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 權限審計服務介面
 * 定義了權限審計功能，用於解耦 PermissionMatrixService
 */
export interface IPermissionAuditService {
  logPermissionViolation(
    userId: string,
    userRole: UserRole,
    resource: ResourceType,
    action: PermissionAction,
    reason: string,
    context?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): void;
  getViolationReport(filters?: {
    userId?: string;
    role?: UserRole;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    startDate?: string;
    endDate?: string;
    resolved?: boolean;
  }): {
    violations: PermissionViolation[];
    summary: {
      total: number;
      bySeverity: Record<string, number>;
      byRole: Record<string, number>;
      byResource: Record<string, number>;
    };
    trends: Array<{
      date: string;
      count: number;
    }>;
  };
  resolveViolation(violationId: string, resolvedBy: string, resolutionNote?: string): void;
}

/**
 * 權限審計服務實作
 * 負責記錄、報告和管理權限違規
 */
export class PermissionAuditService implements IPermissionAuditService {
  private permissionViolations: PermissionViolation[] = [];

  logPermissionViolation(
    userId: string,
    userRole: UserRole,
    resource: ResourceType,
    action: PermissionAction,
    reason: string,
    context?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): void {
    const violation: PermissionViolation = {
      id: this.generateViolationId(),
      userId,
      userRole,
      resource,
      action,
      attemptedAt: new Date().toISOString(),
      ipAddress: context?.ipAddress || 'unknown',
      userAgent: context?.userAgent || 'unknown',
      reason,
      severity: this.calculateViolationSeverity(resource, action),
      resolved: false
    };

    this.permissionViolations.push(violation);

    // 如果是嚴重違規，立即通知管理員
    if (violation.severity === 'critical') {
      this.notifySecurityTeam(violation);
    }
  }

  getViolationReport(filters?: {
    userId?: string;
    role?: UserRole;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    startDate?: string;
    endDate?: string;
    resolved?: boolean;
  }): {
    violations: PermissionViolation[];
    summary: {
      total: number;
      bySeverity: Record<string, number>;
      byRole: Record<string, number>;
      byResource: Record<string, number>;
    };
    trends: Array<{
      date: string;
      count: number;
    }>;
  } {
    let violations = [...this.permissionViolations];

    // 應用過濾器
    if (filters) {
      if (filters.userId) {
        violations = violations.filter(v => v.userId === filters.userId);
      }
      if (filters.role) {
        violations = violations.filter(v => v.userRole === filters.role);
      }
      if (filters.severity) {
        violations = violations.filter(v => v.severity === filters.severity);
      }
      if (filters.startDate) {
        violations = violations.filter(v => v.attemptedAt >= filters.startDate!);
      }
      if (filters.endDate) {
        violations = violations.filter(v => v.attemptedAt <= filters.endDate!);
      }
      if (filters.resolved !== undefined) {
        violations = violations.filter(v => v.resolved === filters.resolved);
      }
    }

    // 生成摘要
    const summary = {
      total: violations.length,
      bySeverity: this.groupBy(violations, 'severity'),
      byRole: this.groupBy(violations, 'userRole'),
      byResource: this.groupBy(violations, 'resource')
    };

    // 生成趨勢
    const trends = this.generateViolationTrends(violations);

    return {
      violations,
      summary,
      trends
    };
  }

  resolveViolation(
    violationId: string,
    resolvedBy: string,
    resolutionNote?: string
  ): void {
    const violation = this.permissionViolations.find(v => v.id === violationId);
    if (violation) {
      violation.resolved = true;
      violation.resolvedBy = resolvedBy;
      violation.resolvedAt = new Date().toISOString();
      // Optionally add resolutionNote to violation if the interface supported it.
    }
  }

  // 私有方法
  private generateViolationId(): string {
    return `VIOL_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private calculateViolationSeverity(
    resource: ResourceType,
    action: PermissionAction
  ): 'low' | 'medium' | 'high' | 'critical' {
    // 敏感資源操作
    if (['sensitive_data', 'system_config', 'user_management', 'api_keys'].includes(resource)) {
      return 'critical';
    }

    // 危險操作
    if (['delete', 'delete_sensitive', 'manage_system'].includes(action)) {
      return 'high';
    }

    // 財務相關
    if (['financial_data', 'payment'].includes(resource)) {
      return 'high';
    }

    // 一般操作
    if (['read', 'create', 'update'].includes(action)) {
      return 'medium';
    }

    return 'low';
  }

  private notifySecurityTeam(violation: PermissionViolation): void {
    // 在實際應用中，這裡會發送通知給安全團隊 (e.g., Slack, email, pager)
    console.error('嚴重權限違規:', violation);
  }

  private groupBy<T>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce((groups, item) => {
      const groupKey = String(item[key]);
      groups[groupKey] = (groups[groupKey] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  private generateViolationTrends(violations: PermissionViolation[]): Array<{ date: string; count: number }> {
    const trends: Record<string, number> = {};

    violations.forEach(violation => {
      const date = violation.attemptedAt.split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });

    return Object.entries(trends)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

/**
 * 預設權限矩陣
 * 保持與原始文件一致，確保類型正確
 */
const DEFAULT_PERMISSION_MATRIX: PermissionRule[] = [
  // 管理員權限
  {
    id: 'admin_all_access',
    role: 'staff', // Assumes 'staff' with 'manager' seniority acts as admin
    resource: 'system_config',
    action: 'manage_system',
    level: 'all',
    conditions: { seniority: 'manager' },
    isActive: true,
    priority: 1,
    description: '系統管理員擁有所有權限'
  },
  {
    id: 'admin_user_management',
    role: 'staff',
    resource: 'user_management',
    action: 'manage_users',
    level: 'all',
    conditions: { seniority: 'manager' },
    isActive: true,
    priority: 1,
    description: '管理員可以管理所有用戶'
  },

  // 客戶管理權限
  {
    id: 'staff_customer_read',
    role: 'staff',
    resource: 'customer',
    action: 'read',
    level: 'all',
    isActive: true,
    priority: 2,
    description: '員工可以查看所有客戶資料'
  },
  {
    id: 'staff_customer_create',
    role: 'staff',
    resource: 'customer',
    action: 'create',
    level: 'all',
    isActive: true,
    priority: 2,
    description: '員工可以創建客戶資料'
  },
  {
    id: 'staff_customer_update_own',
    role: 'staff',
    resource: 'customer',
    action: 'update',
    level: 'own',
    isActive: true,
    priority: 2,
    description: '員工只能更新自己創建的客戶資料'
  },
  {
    id: 'senior_staff_customer_update_all',
    role: 'staff',
    resource: 'customer',
    action: 'update',
    level: 'all',
    conditions: { seniority: 'senior' },
    isActive: true,
    priority: 2,
    description: '資深員工可以更新所有客戶資料'
  },
  {
    id: 'manager_customer_delete',
    role: 'staff',
    resource: 'customer',
    action: 'delete',
    level: 'all',
    conditions: { seniority: 'manager', requireApproval: true },
    isActive: true,
    priority: 2,
    description: '管理員可以刪除客戶資料，但需要審批'
  },

  // 訂單管理權限
  {
    id: 'staff_order_read_team',
    role: 'staff',
    resource: 'order',
    action: 'read',
    level: 'team',
    isActive: true,
    priority: 3,
    description: '員工可以查看團隊的訂單'
  },
  {
    id: 'staff_order_create',
    role: 'staff',
    resource: 'order',
    action: 'create',
    level: 'all',
    isActive: true,
    priority: 3,
    description: '員工可以創建訂單'
  },
  {
    id: 'staff_order_update_own',
    role: 'staff',
    resource: 'order',
    action: 'update',
    level: 'own',
    isActive: true,
    priority: 3,
    description: '員工只能更新自己的訂單'
  },
  {
    id: 'lead_staff_order_approve',
    role: 'staff',
    resource: 'order',
    action: 'approve',
    level: 'team',
    conditions: { seniority: 'lead' },
    isActive: true,
    priority: 3,
    description: '主管可以批准團隊訂單'
  },

  // 報價管理權限
  {
    id: 'staff_quotation_read_all',
    role: 'staff',
    resource: 'quotation',
    action: 'read',
    level: 'all',
    isActive: true,
    priority: 4,
    description: '員工可以查看所有報價'
  },
  {
    id: 'staff_quotation_create',
    role: 'staff',
    resource: 'quotation',
    action: 'create',
    level: 'all',
    isActive: true,
    priority: 4,
    description: '員工可以創建報價'
  },
  {
    id: 'staff_quotation_update_own',
    role: 'staff',
    resource: 'quotation',
    action: 'update',
    level: 'own',
    isActive: true,
    priority: 4,
    description: '員工只能更新自己的報價'
  },
  {
    id: 'senior_staff_quotation_approve',
    role: 'staff',
    resource: 'quotation',
    action: 'approve',
    level: 'department',
    conditions: { seniority: 'senior' },
    isActive: true,
    priority: 4,
    description: '資深員工可以批准部門報價'
  },

  // 團次管理權限
  {
    id: 'staff_session_read_all',
    role: 'staff',
    resource: 'session',
    action: 'read',
    level: 'all',
    isActive: true,
    priority: 5,
    description: '員工可以查看所有團次'
  },
  {
    id: 'lead_staff_session_create',
    role: 'staff',
    resource: 'session',
    action: 'create',
    level: 'all',
    conditions: { seniority: 'lead' },
    isActive: true,
    priority: 5,
    description: '主管可以創建團次'
  },
  {
    id: 'staff_session_update_own',
    role: 'staff',
    resource: 'session',
    action: 'update',
    level: 'own',
    isActive: true,
    priority: 5,
    description: '員工只能更新自己的團次'
  },

  // 行程管理權限
  {
    id: 'staff_itinerary_read_team',
    role: 'staff',
    resource: 'itinerary',
    action: 'read',
    level: 'team',
    isActive: true,
    priority: 6,
    description: '員工可以查看團隊行程'
  },
  {
    id: 'staff_itinerary_create',
    role: 'staff',
    resource: 'itinerary',
    action: 'create',
    level: 'all',
    isActive: true,
    priority: 6,
    description: '員工可以創建行程'
  },
  {
    id: 'staff_itinerary_update_own',
    role: 'staff',
    resource: 'itinerary',
    action: 'update',
    level: 'own',
    isActive: true,
    priority: 6,
    description: '員工只能更新自己的行程'
  },
  {
    id: 'lead_staff_itinerary_approve',
    role: 'staff',
    resource: 'itinerary',
    action: 'approve',
    level: 'team',
    conditions: { seniority: 'lead' },
    isActive: true,
    priority: 6,
    description: '主管可以批准團隊行程'
  },

  // 財務數據權限
  {
    id: 'staff_financial_read_own',
    role: 'staff',
    resource: 'financial_data',
    action: 'read',
    level: 'own',
    isActive: true,
    priority: 7,
    description: '員工只能查看自己的財務數據'
  },
  {
    id: 'senior_staff_financial_read_team',
    role: 'staff',
    resource: 'financial_data',
    action: 'read',
    level: 'team',
    conditions: { seniority: 'senior' },
    isActive: true,
    priority: 7,
    description: '資深員工可以查看團隊財務數據'
  },
  {
    id: 'manager_financial_manage',
    role: 'staff',
    resource: 'financial_data',
    action: 'update',
    level: 'department',
    conditions: { seniority: 'manager' },
    isActive: true,
    priority: 7,
    description: '管理員可以管理部門財務數據'
  },

  // 敏感數據權限
  {
    id: 'manager_sensitive_view',
    role: 'staff',
    resource: 'sensitive_data',
    action: 'view_sensitive',
    level: 'department',
    conditions: { seniority: 'manager' },
    isActive: true,
    priority: 8,
    description: '管理員可以查看敏感數據'
  },
  {
    id: 'admin_sensitive_modify',
    role: 'staff',
    resource: 'sensitive_data',
    action: 'modify_sensitive',
    level: 'all',
    conditions: { seniority: 'manager', requireApproval: true },
    isActive: true,
    priority: 8,
    description: '管理員可以修改敏感數據，但需要審批'
  },

  // 福利部門權限
  {
    id: 'welfare_customer_read_all',
    role: 'welfare',
    resource: 'customer',
    action: 'read',
    level: 'all',
    isActive: true,
    priority: 9,
    description: '福利部門可以查看所有客戶資料'
  },
  {
    id: 'welfare_session_read_all',
    role: 'welfare',
    resource: 'session',
    action: 'read',
    level: 'all',
    isActive: true,
    priority: 9,
    description: '福利部門可以查看所有團次'
  },
  {
    id: 'welfare_itinerary_read_all',
    role: 'welfare',
    resource: 'itinerary',
    action: 'read',
    level: 'all',
    isActive: true,
    priority: 9,
    description: '福利部門可以查看所有行程'
  },

  // 旅客權限
  {
    id: 'traveler_own_data_read',
    role: 'traveler',
    resource: 'customer',
    action: 'read',
    level: 'own',
    isActive: true,
    priority: 10,
    description: '旅客可以查看自己的資料'
  },
  {
    id: 'traveler_own_data_update',
    role: 'traveler',
    resource: 'customer',
    action: 'update',
    level: 'own',
    isActive: true,
    priority: 10,
    description: '旅客可以更新自己的資料'
  },
  {
    id: 'traveler_own_order_read',
    role: 'traveler',
    resource: 'order',
    action: 'read',
    level: 'own',
    isActive: true,
    priority: 10,
    description: '旅客可以查看自己的訂單'
  },
  {
    id: 'traveler_own_itinerary_read',
    role: 'traveler',
    resource: 'itinerary',
    action: 'read',
    level: 'own',
    isActive: true,
    priority: 10,
    description: '旅客可以查看自己的行程'
  }
];

/**
 * 組織架構檢查器介面
 * 提供團隊和部門層級的歸屬檢查，用於權限等級驗證。
 * 實作時應根據實際組織架構（例如 HR 系統或 LDAP）提供查詢邏輯。
 */
export interface IOrganizationChecker {
  /** 檢查使用者是否與資源擁有者屬於同一團隊 */
  isInSameTeam(userId: string, resourceOwnerId: string): boolean;
  /** 檢查使用者是否與資源擁有者屬於同一部門 */
  isInSameDepartment(userId: string, userDepartment: string, resourceOwnerId: string): boolean;
}

/**
 * 預設組織架構檢查器
 * 基於部門名稱的簡易比對邏輯。在實際應用中應替換為查詢 HR 系統或組織資料庫。
 */
export class DefaultOrganizationChecker implements IOrganizationChecker {
  /**
   * 團隊對照表：團隊名稱 -> 成員 ID 集合
   * 可在建構時注入，或從外部系統載入。
   */
  private teamMembers: Map<string, Set<string>>;
  /**
   * 成員所屬部門對照表：成員 ID -> 部門名稱
   */
  private memberDepartments: Map<string, string>;

  constructor(
    teamMembers?: Map<string, Set<string>>,
    memberDepartments?: Map<string, string>
  ) {
    this.teamMembers = teamMembers ?? new Map();
    this.memberDepartments = memberDepartments ?? new Map();
  }

  isInSameTeam(userId: string, resourceOwnerId: string): boolean {
    // 遍歷所有團隊，檢查兩者是否在同一團隊
    for (const [, members] of this.teamMembers) {
      if (members.has(userId) && members.has(resourceOwnerId)) {
        return true;
      }
    }
    return false;
  }

  isInSameDepartment(userId: string, userDepartment: string, resourceOwnerId: string): boolean {
    const ownerDepartment = this.memberDepartments.get(resourceOwnerId);
    if (!ownerDepartment) {
      // 若無法查到資源擁有者的部門資訊，回退至同一部門假設不成立
      return false;
    }
    return userDepartment === ownerDepartment;
  }
}

/**
 * 權限矩陣服務配置介面
 * 允許在實例化服務時注入初始規則或其他依賴項，提高可測試性和 Kintone 獨立性。
 */
export interface PermissionMatrixServiceConfig {
  initialRules?: PermissionRule[];
  auditService?: IPermissionAuditService;
  organizationChecker?: IOrganizationChecker;
}

/**
 * 權限矩陣服務類別
 * 專注於權限規則的管理和檢查。
 */
export class PermissionMatrixService {
  private permissionRules: Map<string, PermissionRule> = new Map();
  private auditService: IPermissionAuditService;
  private organizationChecker: IOrganizationChecker;

  constructor(config?: PermissionMatrixServiceConfig) {
    // 初始化權限規則
    DEFAULT_PERMISSION_MATRIX.forEach(rule => {
      this.permissionRules.set(rule.id, rule);
    });

    if (config?.initialRules) {
      config.initialRules.forEach(rule => {
        this.permissionRules.set(rule.id, rule); // 允許覆蓋預設規則或新增規則
      });
    }

    // 注入審計服務，如果未提供則使用預設實例
    this.auditService = config?.auditService || new PermissionAuditService();
    // 注入組織架構檢查器，如果未提供則使用預設實例
    this.organizationChecker = config?.organizationChecker || new DefaultOrganizationChecker();
  }

  /**
   * 檢查權限
   * 所有用戶相關上下文資訊都通過 UserContext 傳入，避免依賴全域 Store。
   * @param userContext 包含用戶ID、角色、部門、資深程度等信息的對象。
   * @param resource 要訪問的資源類型。
   * @param action 要執行的操作類型。
   * @param resourceId 特定資源的ID，用於 'own', 'team', 'department' 等級的檢查。
   * @param resourceOwnerId 如果資源有所有者，提供所有者的ID，用於 'own' 等級檢查。
   * @param requestTime 請求發生時間，用於時間限制檢查。
   */
  checkPermission(
    userContext: UserContext,
    resource: ResourceType,
    action: PermissionAction,
    resourceId?: string,
    resourceOwnerId?: string,
    requestTime?: Date
  ): PermissionCheckResult {
    const { userId, userRole, userSeniority, userDepartment, ipAddress, userAgent } = userContext;

    // 查找適用的權限規則
    const applicableRules = this.findApplicableRules(userRole, resource, action, userSeniority);

    if (applicableRules.length === 0) {
      const reason = `沒有找到適用於 ${userRole} 角色的權限規則`;
      this.auditService.logPermissionViolation(userId, userRole, resource, action, reason, { ipAddress, userAgent });
      return { granted: false, reason };
    }

    // 按優先級排序，使用最高優先級的規則（數字越小優先級越高）
    const rule = applicableRules.sort((a, b) => a.priority - b.priority)[0];

    // 檢查權限等級（傳入 userDepartment 以支援部門層級檢查）
    const levelCheck = this.checkPermissionLevel(rule, userId, resourceOwnerId, userDepartment);
    if (!levelCheck.granted) {
      this.auditService.logPermissionViolation(userId, userRole, resource, action, levelCheck.reason!, { ipAddress, userAgent });
      return levelCheck;
    }

    // 檢查條件限制 (資深程度, 部門)
    const conditionCheck = this.checkPermissionConditions(rule, userSeniority, userDepartment);
    if (!conditionCheck.granted) {
      this.auditService.logPermissionViolation(userId, userRole, resource, action, conditionCheck.reason!, { ipAddress, userAgent });
      return conditionCheck;
    }

    // 檢查時間限制
    const timeCheck = this.checkTimeRestrictions(rule, requestTime || new Date());
    if (!timeCheck.granted) {
      this.auditService.logPermissionViolation(userId, userRole, resource, action, timeCheck.reason!, { ipAddress, userAgent });
      return timeCheck;
    }

    // 檢查 IP 白名單
    const ipCheck = this.checkIPWhitelist(rule, ipAddress);
    if (!ipCheck.granted) {
      this.auditService.logPermissionViolation(userId, userRole, resource, action, ipCheck.reason!, { ipAddress, userAgent });
      return ipCheck;
    }

    const result: PermissionCheckResult = {
      granted: true,
      conditions: this.getAppliedConditions(rule)
    };

    // 檢查是否需要審批
    if (rule.conditions?.requireApproval) {
      result.requiresApproval = true;
      result.approvers = this.getApprovers(rule, userDepartment);
    }

    return result;
  }

  /**
   * 批量檢查權限
   * @param userContext 包含用戶ID、角色、部門、資深程度等信息的對象。
   * @param permissions 待檢查的權限列表，每個元素包含資源、動作和可選的資源ID和所有者ID。
   * @param requestTime 請求發生時間。
   */
  checkMultiplePermissions(
    userContext: UserContext,
    permissions: Array<{
      resource: ResourceType;
      action: PermissionAction;
      resourceId?: string;
      resourceOwnerId?: string;
    }>,
    requestTime?: Date
  ): Record<string, PermissionCheckResult> {
    const results: Record<string, PermissionCheckResult> = {};

    permissions.forEach((permission, index) => {
      const key = `${permission.resource}_${permission.action}_${index}`;
      results[key] = this.checkPermission(
        userContext,
        permission.resource,
        permission.action,
        permission.resourceId,
        permission.resourceOwnerId,
        requestTime
      );
    });

    return results;
  }

  /**
   * 取得用戶權限摘要
   * 直接從 UserContext 獲取所需資訊，不再依賴內部 userSessions。
   * @param userContext 包含用戶ID、角色、部門、資深程度等信息的對象。
   */
  getUserPermissionSummary(userContext: UserContext): {
    role: UserRole;
    permissions: Array<{
      resource: ResourceType;
      actions: PermissionAction[];
      level: PermissionLevel;
      conditions: string[];
    }>;
    restrictions: string[];
    lastUpdated: string;
  } {
    const { userRole, userSeniority } = userContext;

    const userRules = Array.from(this.permissionRules.values())
      .filter(rule => rule.role === userRole && rule.isActive &&
        (!rule.conditions?.seniority || rule.conditions.seniority === userSeniority)
      );

    const permissions: Array<{
      resource: ResourceType;
      actions: PermissionAction[];
      level: PermissionLevel;
      conditions: string[];
    }> = [];

    // 按資源分組權限
    const resourceGroups = new Map<ResourceType, PermissionRule[]>();
    userRules.forEach(rule => {
      if (!resourceGroups.has(rule.resource)) {
        resourceGroups.set(rule.resource, []);
      }
      resourceGroups.get(rule.resource)!.push(rule);
    });

    resourceGroups.forEach((rules, resource) => {
      const actions = [...new Set(rules.map(rule => rule.action))]; // Deduplicate actions
      // For level, use the highest (most permissive) granted if multiple rules apply,
      // or simply the first one as in original logic for consistency.
      const level = rules.sort((a,b) => {
        const levelOrder = { 'none': 0, 'own': 1, 'team': 2, 'department': 3, 'all': 4 };
        return levelOrder[b.level] - levelOrder[a.level]; // Sort by highest permission level
      })[0]?.level || 'none';
      const conditions = [...new Set(rules.flatMap(rule => this.getAppliedConditions(rule)))]; // Deduplicate conditions

      permissions.push({
        resource,
        actions,
        level,
        conditions
      });
    });

    const restrictions = this.getUserRestrictions(userRole, userSeniority);

    return {
      role: userRole,
      permissions,
      restrictions,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 更新權限規則
   */
  updatePermissionRule(rule: PermissionRule): void {
    this.permissionRules.set(rule.id, rule);
  }

  /**
   * 新增權限規則
   */
  addPermissionRule(rule: PermissionRule): void {
    // 確保ID唯一性，或提供機制處理重複
    if (this.permissionRules.has(rule.id)) {
      console.warn(`Permission rule with ID "${rule.id}" already exists. It will be overwritten.`);
    }
    this.permissionRules.set(rule.id, rule);
  }

  /**
   * 刪除權限規則
   */
  removePermissionRule(ruleId: string): void {
    this.permissionRules.delete(ruleId);
  }

  /**
   * 取得所有權限規則
   */
  getAllPermissionRules(): PermissionRule[] {
    return Array.from(this.permissionRules.values());
  }

  // 私有方法
  private findApplicableRules(
    role: UserRole,
    resource: ResourceType,
    action: PermissionAction,
    seniority: UserSeniority | 'unknown'
  ): PermissionRule[] {
    return Array.from(this.permissionRules.values())
      .filter(rule =>
        rule.role === role &&
        rule.resource === resource &&
        rule.action === action &&
        rule.isActive &&
        // If rule has a seniority condition, it must match the user's seniority.
        // If userSeniority is 'unknown' and rule requires specific seniority, it won't match.
        (!rule.conditions?.seniority || rule.conditions.seniority === seniority)
      );
  }

  private checkPermissionLevel(
    rule: PermissionRule,
    userId: string,
    resourceOwnerId?: string,
    userDepartment?: string
  ): PermissionCheckResult {
    switch (rule.level) {
      case 'none':
        return {
          granted: false,
          reason: '權限等級為無權限'
        };
      case 'all':
        return { granted: true };
      case 'own':
        if (resourceOwnerId && userId === resourceOwnerId) {
          return { granted: true };
        }
        return {
          granted: false,
          reason: '只能操作自己的資源，但未提供資源所有者信息或不匹配'
        };
      case 'team':
        // 若未提供資源擁有者 ID，無法進行團隊歸屬檢查
        if (!resourceOwnerId) {
          return { granted: true, conditions: ['需提供資源擁有者 ID 以完整驗證團隊權限'] };
        }
        // 自己的資源一定通過
        if (userId === resourceOwnerId) {
          return { granted: true };
        }
        if (this.organizationChecker.isInSameTeam(userId, resourceOwnerId)) {
          return { granted: true };
        }
        return {
          granted: false,
          reason: `用戶 ${userId} 與資源擁有者 ${resourceOwnerId} 不在同一團隊`
        };
      case 'department':
        // 若未提供資源擁有者 ID，無法進行部門歸屬檢查
        if (!resourceOwnerId) {
          return { granted: true, conditions: ['需提供資源擁有者 ID 以完整驗證部門權限'] };
        }
        // 自己的資源一定通過
        if (userId === resourceOwnerId) {
          return { granted: true };
        }
        if (this.organizationChecker.isInSameDepartment(userId, userDepartment || '', resourceOwnerId)) {
          return { granted: true };
        }
        return {
          granted: false,
          reason: `用戶 ${userId} 與資源擁有者 ${resourceOwnerId} 不在同一部門`
        };
      default:
        return {
          granted: false,
          reason: '未知的權限等級'
        };
    }
  }

  private checkPermissionConditions(
    rule: PermissionRule,
    userSeniority: UserSeniority | 'unknown',
    userDepartment: string
  ): PermissionCheckResult {
    if (!rule.conditions) {
      return { granted: true };
    }

    // 檢查資深程度條件
    if (rule.conditions.seniority) {
      if (userSeniority === 'unknown' || userSeniority !== rule.conditions.seniority) {
        return {
          granted: false,
          reason: `需要 ${rule.conditions.seniority} 級別權限，當前為 ${userSeniority}`
        };
      }
    }

    // 檢查部門條件
    if (rule.conditions.department && rule.conditions.department.length > 0) {
      if (!rule.conditions.department.includes(userDepartment)) {
        return {
          granted: false,
          reason: `需要特定部門權限: ${rule.conditions.department.join(', ')}，當前部門為 ${userDepartment}`
        };
      }
    }

    return { granted: true };
  }

  private checkTimeRestrictions(
    rule: PermissionRule,
    requestTime: Date
  ): PermissionCheckResult {
    if (!rule.conditions?.timeRestriction) {
      return { granted: true };
    }

    const time = requestTime;
    const hour = time.getHours();
    const isWeekday = time.getDay() >= 1 && time.getDay() <= 5; // Monday to Friday (0 is Sunday, 6 is Saturday)

    const { startHour, endHour, weekdaysOnly } = rule.conditions.timeRestriction;

    if (weekdaysOnly && !isWeekday) {
      return {
        granted: false,
        reason: '此操作僅限工作日執行'
      };
    }

    // `endHour` typically means "up to the start of this hour". E.g., 9-17 means 9:00-16:59.
    // If endHour means inclusive until the end of that hour (e.g., 17 means until 17:59:59), then use <=.
    // Based on original code, I'll assume standard time range convention (start inclusive, end exclusive of the hour).
    if (hour < startHour || hour >= endHour) {
      return {
        granted: false,
        reason: `此操作僅限 ${startHour}:00-${endHour}:00 時間段執行`
      };
    }

    return { granted: true };
  }

  private checkIPWhitelist(
    rule: PermissionRule,
    ipAddress?: string
  ): PermissionCheckResult {
    if (!rule.conditions?.ipWhitelist || rule.conditions.ipWhitelist.length === 0) {
      return { granted: true };
    }

    if (!ipAddress) {
      return {
        granted: false,
        reason: '無法驗證IP地址，但規則要求IP白名單'
      };
    }

    if (!rule.conditions.ipWhitelist.includes(ipAddress)) {
      return {
        granted: false,
        reason: `IP地址 ${ipAddress} 不在白名單中`
      };
    }

    return { granted: true };
  }

  private getAppliedConditions(rule: PermissionRule): string[] {
    const conditions: string[] = [];

    if (rule.conditions?.seniority) {
      conditions.push(`需要 ${rule.conditions.seniority} 級別`);
    }

    if (rule.conditions?.department && rule.conditions.department.length > 0) {
      conditions.push(`限部門: ${rule.conditions.department.join(', ')}`);
    }

    if (rule.conditions?.timeRestriction) {
      const { startHour, endHour, weekdaysOnly } = rule.conditions.timeRestriction;
      let timeCondition = `時間: ${startHour}:00-${endHour}:00`;
      if (weekdaysOnly) {
        timeCondition += ' (僅工作日)';
      }
      conditions.push(timeCondition);
    }

    if (rule.conditions?.ipWhitelist && rule.conditions.ipWhitelist.length > 0) {
      conditions.push(`限IP白名單: ${rule.conditions.ipWhitelist.join(', ')}`);
    }

    if (rule.conditions?.requireApproval) {
      conditions.push('需要審批');
    }

    return conditions;
  }

  private getApprovers(rule: PermissionRule, department: string): string[] {
    // 簡化版本，返回預設審批者
    // 在實際應用中，這裡會查詢組織架構獲取真實的審批者
    // 可以基於部門、資深程度、特定資源類型來動態決定審批者
    return [
      `${department}_manager`,
      'system_admin'
    ];
  }

  private getUserRestrictions(role: UserRole, seniority: UserSeniority | 'unknown'): string[] {
    const restrictions: string[] = [];

    switch (role) {
      case 'traveler':
        restrictions.push('只能查看和修改自己的資料');
        restrictions.push('無法訪問其他用戶信息');
        break;
      case 'welfare':
        restrictions.push('只能查看相關資料，無法修改');
        restrictions.push('無法訪問財務數據');
        break;
      case 'staff':
        if (seniority === 'junior' || seniority === 'unknown') {
          restrictions.push('只能操作自己創建的資源');
          restrictions.push('需要審批才能執行某些操作');
        }
        break;
    }

    return restrictions;
  }
}

// 建立全域實例，可以透過配置初始化
// 建議在實際應用中，如果服務需要複雜配置或多個實例，
// 應避免直接導出單例，而是讓應用程式在啟動時管理服務實例的生命週期和依賴注入。
// 但為了符合原始程式碼的單例模式，這裡仍導出一個預設實例。
export const permissionMatrixService = new PermissionMatrixService();

export default PermissionMatrixService;