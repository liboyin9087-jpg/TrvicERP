/**
 * 細粒度權限控制矩陣服務
 * Fine-Grained Permission Matrix Service
 */

import type { UserRole } from '../store/useAppStore';

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
 * 權限規則
 */
interface PermissionRule {
  id: string;
  role: UserRole;
  resource: ResourceType;
  action: PermissionAction;
  level: PermissionLevel;
  conditions?: {
    department?: string[];
    seniority?: 'junior' | 'senior' | 'lead' | 'manager';
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
interface PermissionCheckResult {
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
interface PermissionViolation {
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
 * 預設權限矩陣
 */
const DEFAULT_PERMISSION_MATRIX: PermissionRule[] = [
  // 管理員權限
  {
    id: 'admin_all_access',
    role: 'staff',
    resource: 'system_config' as ResourceType,
    action: 'manage_system' as PermissionAction,
    level: 'all',
    conditions: { seniority: 'manager' },
    isActive: true,
    priority: 1,
    description: '系統管理員擁有所有權限'
  },
  {
    id: 'admin_user_management',
    role: 'staff',
    resource: 'user_management' as ResourceType,
    action: 'manage_users' as PermissionAction,
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
    resource: 'customer' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'all',
    isActive: true,
    priority: 2,
    description: '員工可以查看所有客戶資料'
  },
  {
    id: 'staff_customer_create',
    role: 'staff',
    resource: 'customer' as ResourceType,
    action: 'create' as PermissionAction,
    level: 'all',
    isActive: true,
    priority: 2,
    description: '員工可以創建客戶資料'
  },
  {
    id: 'staff_customer_update_own',
    role: 'staff',
    resource: 'customer' as ResourceType,
    action: 'update' as PermissionAction,
    level: 'own',
    isActive: true,
    priority: 2,
    description: '員工只能更新自己創建的客戶資料'
  },
  {
    id: 'senior_staff_customer_update_all',
    role: 'staff',
    resource: 'customer' as ResourceType,
    action: 'update' as PermissionAction,
    level: 'all',
    conditions: { seniority: 'senior' },
    isActive: true,
    priority: 2,
    description: '資深員工可以更新所有客戶資料'
  },
  {
    id: 'manager_customer_delete',
    role: 'staff',
    resource: 'customer' as ResourceType,
    action: 'delete' as PermissionAction,
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
    resource: 'order' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'team',
    isActive: true,
    priority: 3,
    description: '員工可以查看團隊的訂單'
  },
  {
    id: 'staff_order_create',
    role: 'staff',
    resource: 'order' as ResourceType,
    action: 'create' as PermissionAction,
    level: 'all',
    isActive: true,
    priority: 3,
    description: '員工可以創建訂單'
  },
  {
    id: 'staff_order_update_own',
    role: 'staff',
    resource: 'order' as ResourceType,
    action: 'update' as PermissionAction,
    level: 'own',
    isActive: true,
    priority: 3,
    description: '員工只能更新自己的訂單'
  },
  {
    id: 'lead_staff_order_approve',
    role: 'staff',
    resource: 'order' as ResourceType,
    action: 'approve' as PermissionAction,
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
    resource: 'quotation' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'all',
    isActive: true,
    priority: 4,
    description: '員工可以查看所有報價'
  },
  {
    id: 'staff_quotation_create',
    role: 'staff',
    resource: 'quotation' as ResourceType,
    action: 'create' as PermissionAction,
    level: 'all',
    isActive: true,
    priority: 4,
    description: '員工可以創建報價'
  },
  {
    id: 'staff_quotation_update_own',
    role: 'staff',
    resource: 'quotation' as ResourceType,
    action: 'update' as PermissionAction,
    level: 'own',
    isActive: true,
    priority: 4,
    description: '員工只能更新自己的報價'
  },
  {
    id: 'senior_staff_quotation_approve',
    role: 'staff',
    resource: 'quotation' as ResourceType,
    action: 'approve' as PermissionAction,
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
    resource: 'session' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'all',
    isActive: true,
    priority: 5,
    description: '員工可以查看所有團次'
  },
  {
    id: 'lead_staff_session_create',
    role: 'staff',
    resource: 'session' as ResourceType,
    action: 'create' as PermissionAction,
    level: 'all',
    conditions: { seniority: 'lead' },
    isActive: true,
    priority: 5,
    description: '主管可以創建團次'
  },
  {
    id: 'staff_session_update_own',
    role: 'staff',
    resource: 'session' as ResourceType,
    action: 'update' as PermissionAction,
    level: 'own',
    isActive: true,
    priority: 5,
    description: '員工只能更新自己的團次'
  },
  
  // 行程管理權限
  {
    id: 'staff_itinerary_read_team',
    role: 'staff',
    resource: 'itinerary' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'team',
    isActive: true,
    priority: 6,
    description: '員工可以查看團隊行程'
  },
  {
    id: 'staff_itinerary_create',
    role: 'staff',
    resource: 'itinerary' as ResourceType,
    action: 'create' as PermissionAction,
    level: 'all',
    isActive: true,
    priority: 6,
    description: '員工可以創建行程'
  },
  {
    id: 'staff_itinerary_update_own',
    role: 'staff',
    resource: 'itinerary' as ResourceType,
    action: 'update' as PermissionAction,
    level: 'own',
    isActive: true,
    priority: 6,
    description: '員工只能更新自己的行程'
  },
  {
    id: 'lead_staff_itinerary_approve',
    role: 'staff',
    resource: 'itinerary' as ResourceType,
    action: 'approve' as PermissionAction,
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
    resource: 'financial_data' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'own',
    isActive: true,
    priority: 7,
    description: '員工只能查看自己的財務數據'
  },
  {
    id: 'senior_staff_financial_read_team',
    role: 'staff',
    resource: 'financial_data' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'team',
    conditions: { seniority: 'senior' },
    isActive: true,
    priority: 7,
    description: '資深員工可以查看團隊財務數據'
  },
  {
    id: 'manager_financial_manage',
    role: 'staff',
    resource: 'financial_data' as ResourceType,
    action: 'update' as PermissionAction,
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
    resource: 'sensitive_data' as ResourceType,
    action: 'view_sensitive' as PermissionAction,
    level: 'department',
    conditions: { seniority: 'manager' },
    isActive: true,
    priority: 8,
    description: '管理員可以查看敏感數據'
  },
  {
    id: 'admin_sensitive_modify',
    role: 'staff',
    resource: 'sensitive_data' as ResourceType,
    action: 'modify_sensitive' as PermissionAction,
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
    resource: 'customer' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'all',
    isActive: true,
    priority: 9,
    description: '福利部門可以查看所有客戶資料'
  },
  {
    id: 'welfare_session_read_all',
    role: 'welfare',
    resource: 'session' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'all',
    isActive: true,
    priority: 9,
    description: '福利部門可以查看所有團次'
  },
  {
    id: 'welfare_itinerary_read_all',
    role: 'welfare',
    resource: 'itinerary' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'all',
    isActive: true,
    priority: 9,
    description: '福利部門可以查看所有行程'
  },
  
  // 旅客權限
  {
    id: 'traveler_own_data_read',
    role: 'traveler',
    resource: 'customer' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'own',
    isActive: true,
    priority: 10,
    description: '旅客可以查看自己的資料'
  },
  {
    id: 'traveler_own_data_update',
    role: 'traveler',
    resource: 'customer' as ResourceType,
    action: 'update' as PermissionAction,
    level: 'own',
    isActive: true,
    priority: 10,
    description: '旅客可以更新自己的資料'
  },
  {
    id: 'traveler_own_order_read',
    role: 'traveler',
    resource: 'order' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'own',
    isActive: true,
    priority: 10,
    description: '旅客可以查看自己的訂單'
  },
  {
    id: 'traveler_own_itinerary_read',
    role: 'traveler',
    resource: 'itinerary' as ResourceType,
    action: 'read' as PermissionAction,
    level: 'own',
    isActive: true,
    priority: 10,
    description: '旅客可以查看自己的行程'
  }
];

/**
 * 權限矩陣服務類別
 */
export class PermissionMatrixService {
  private permissionRules: Map<string, PermissionRule> = new Map();
  private permissionViolations: PermissionViolation[] = [];
  private userSessions: Map<string, { userId: string; role: UserRole; seniority: string; department: string }> = new Map();

  constructor() {
    // 初始化權限規則
    DEFAULT_PERMISSION_MATRIX.forEach(rule => {
      this.permissionRules.set(rule.id, rule);
    });
  }

  /**
   * 檢查權限
   */
  checkPermission(
    userId: string,
    userRole: UserRole,
    resource: ResourceType,
    action: PermissionAction,
    resourceId?: string,
    context?: {
      resourceOwnerId?: string;
      userDepartment?: string;
      userSeniority?: string;
      ipAddress?: string;
      requestTime?: Date;
    }
  ): PermissionCheckResult {
    const userSession = this.userSessions.get(userId);
    const seniority = context?.userSeniority || userSession?.seniority || 'junior';
    const department = context?.userDepartment || userSession?.department || 'general';

    // 查找適用的權限規則
    const applicableRules = this.findApplicableRules(userRole, resource, action, seniority);
    
    if (applicableRules.length === 0) {
      return {
        granted: false,
        reason: `沒有找到適用於 ${userRole} 角色的權限規則`
      };
    }

    // 按優先級排序，使用最高優先級的規則
    const rule = applicableRules.sort((a, b) => a.priority - b.priority)[0];

    // 檢查權限等級
    const levelCheck = this.checkPermissionLevel(rule, resourceId, context);
    if (!levelCheck.granted) {
      return levelCheck;
    }

    // 檢查條件限制
    const conditionCheck = this.checkPermissionConditions(rule, context);
    if (!conditionCheck.granted) {
      return conditionCheck;
    }

    // 檢查時間限制
    const timeCheck = this.checkTimeRestrictions(rule, context?.requestTime);
    if (!timeCheck.granted) {
      return timeCheck;
    }

    // 檢查 IP 白名單
    const ipCheck = this.checkIPWhitelist(rule, context?.ipAddress);
    if (!ipCheck.granted) {
      return ipCheck;
    }

    const result: PermissionCheckResult = {
      granted: true,
      conditions: this.getAppliedConditions(rule)
    };

    // 檢查是否需要審批
    if (rule.conditions?.requireApproval) {
      result.requiresApproval = true;
      result.approvers = this.getApprovers(rule, department);
    }

    return result;
  }

  /**
   * 批量檢查權限
   */
  checkMultiplePermissions(
    userId: string,
    userRole: UserRole,
    permissions: Array<{
      resource: ResourceType;
      action: PermissionAction;
      resourceId?: string;
    }>,
    context?: any
  ): Record<string, PermissionCheckResult> {
    const results: Record<string, PermissionCheckResult> = {};

    permissions.forEach((permission, index) => {
      const key = `${permission.resource}_${permission.action}_${index}`;
      results[key] = this.checkPermission(
        userId,
        userRole,
        permission.resource,
        permission.action,
        permission.resourceId,
        context
      );
    });

    return results;
  }

  /**
   * 註冊用戶會話
   */
  registerUserSession(
    userId: string,
    role: UserRole,
    seniority: string = 'junior',
    department: string = 'general'
  ): void {
    this.userSessions.set(userId, {
      userId,
      role,
      seniority,
      department
    });
  }

  /**
   * 記錄權限違規
   */
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

  /**
   * 取得用戶權限摘要
   */
  getUserPermissionSummary(userId: string): {
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
    const userSession = this.userSessions.get(userId);
    if (!userSession) {
      throw new Error('用戶會話不存在');
    }

    const userRules = Array.from(this.permissionRules.values())
      .filter(rule => rule.role === userSession.role && rule.isActive);

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
      const actions = rules.map(rule => rule.action);
      const level = rules[0].level; // 使用第一個規則的等級
      const conditions = rules.flatMap(rule => this.getAppliedConditions(rule));

      permissions.push({
        resource,
        actions,
        level,
        conditions
      });
    });

    const restrictions = this.getUserRestrictions(userSession.role, userSession.seniority);

    return {
      role: userSession.role,
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
    this.permissionRules.set(rule.id, rule);
  }

  /**
   * 刪除權限規則
   */
  removePermissionRule(ruleId: string): void {
    this.permissionRules.delete(ruleId);
  }

  /**
   * 取得權限違規報告
   */
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

  /**
   * 解決權限違規
   */
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
    }
  }

  // 私有方法

  private findApplicableRules(
    role: UserRole,
    resource: ResourceType,
    action: PermissionAction,
    seniority: string
  ): PermissionRule[] {
    return Array.from(this.permissionRules.values())
      .filter(rule => 
        rule.role === role &&
        rule.resource === resource &&
        rule.action === action &&
        rule.isActive &&
        (!rule.conditions?.seniority || rule.conditions.seniority === seniority)
      );
  }

  private checkPermissionLevel(
    rule: PermissionRule,
    resourceId?: string,
    context?: { resourceOwnerId?: string }
  ): PermissionCheckResult {
    // 這裡需要實際的資源所有權檢查邏輯
    // 簡化版本，假設所有資源都符合權限等級要求
    
    switch (rule.level) {
      case 'none':
        return {
          granted: false,
          reason: '權限等級為無權限'
        };
      case 'all':
        return { granted: true };
      case 'own':
        if (context?.resourceOwnerId) {
          return { granted: true };
        }
        return {
          granted: false,
          reason: '只能操作自己的資源'
        };
      case 'team':
      case 'department':
        // 需要實際的團隊/部門檢查邏輯
        return { granted: true };
      default:
        return {
          granted: false,
          reason: '未知的權限等級'
        };
    }
  }

  private checkPermissionConditions(
    rule: PermissionRule,
    context?: any
  ): PermissionCheckResult {
    if (!rule.conditions) {
      return { granted: true };
    }

    // 檢查資深程度條件
    if (rule.conditions.seniority) {
      const userSession = Array.from(this.userSessions.values())[0]; // 簡化版本
      if (userSession && userSession.seniority !== rule.conditions.seniority) {
        return {
          granted: false,
          reason: `需要 ${rule.conditions.seniority} 級別權限`
        };
      }
    }

    // 檢查部門條件
    if (rule.conditions.department && rule.conditions.department.length > 0) {
      const userSession = Array.from(this.userSessions.values())[0]; // 簡化版本
      if (userSession && !rule.conditions.department.includes(userSession.department)) {
        return {
          granted: false,
          reason: `需要特定部門權限: ${rule.conditions.department.join(', ')}`
        };
      }
    }

    return { granted: true };
  }

  private checkTimeRestrictions(
    rule: PermissionRule,
    requestTime?: Date
  ): PermissionCheckResult {
    if (!rule.conditions?.timeRestriction) {
      return { granted: true };
    }

    const time = requestTime || new Date();
    const hour = time.getHours();
    const isWeekday = time.getDay() >= 1 && time.getDay() <= 5;

    const { startHour, endHour, weekdaysOnly } = rule.conditions.timeRestriction;

    if (weekdaysOnly && !isWeekday) {
      return {
        granted: false,
        reason: '此操作僅限工作日執行'
      };
    }

    if (hour < startHour || hour > endHour) {
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
        reason: '無法驗證IP地址'
      };
    }

    if (!rule.conditions.ipWhitelist.includes(ipAddress)) {
      return {
        granted: false,
        reason: 'IP地址不在白名單中'
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

    if (rule.conditions?.requireApproval) {
      conditions.push('需要審批');
    }

    return conditions;
  }

  private getApprovers(rule: PermissionRule, department: string): string[] {
    // 簡化版本，返回預設審批者
    // 在實際應用中，這裡會查詢組織架構獲取真實的審批者
    return [
      `${department}_manager`,
      'system_admin'
    ];
  }

  private generateViolationId(): string {
    return `VIOL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    // 在實際應用中，這裡會發送通知給安全團隊
    console.error('嚴重權限違規:', violation);
  }

  private getUserRestrictions(role: UserRole, seniority: string): string[] {
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
        if (seniority === 'junior') {
          restrictions.push('只能操作自己創建的資源');
          restrictions.push('需要審批才能執行某些操作');
        }
        break;
    }

    return restrictions;
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

// 建立全域實例
export const permissionMatrixService = new PermissionMatrixService();

export default PermissionMatrixService;
