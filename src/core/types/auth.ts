/**
 * 認證與權限核心類型定義
 * Authentication & Authorization Core Types
 */

/**
 * 使用者角色
 */
export type UserRole =
  | 'admin'        // 系統管理員
  | 'manager'      // 經理
  | 'sales'        // 業務
  | 'operator'     // OP 人員
  | 'finance'     // 財務
  | 'welfare'      // 福委
  | 'traveler';    // 旅客

/**
 * 權限類型
 */
export type Permission =
  // 訂單權限
  | 'order:create'
  | 'order:read'
  | 'order:update'
  | 'order:delete'
  | 'order:cancel'
  | 'order:refund'
  // 報價權限
  | 'quotation:create'
  | 'quotation:read'
  | 'quotation:update'
  | 'quotation:delete'
  | 'quotation:convert'
  // 行程權限
  | 'itinerary:create'
  | 'itinerary:read'
  | 'itinerary:update'
  | 'itinerary:delete'
  // 客戶權限
  | 'customer:create'
  | 'customer:read'
  | 'customer:update'
  | 'customer:delete'
  // 財務權限
  | 'financial:view'
  | 'financial:export'
  | 'financial:approve'
  // 管理權限
  | 'admin:manage'
  | 'admin:settings'
  | 'admin:users';

/**
 * 角色權限對應表
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // 所有權限
    'order:create', 'order:read', 'order:update', 'order:delete', 'order:cancel', 'order:refund',
    'quotation:create', 'quotation:read', 'quotation:update', 'quotation:delete', 'quotation:convert',
    'itinerary:create', 'itinerary:read', 'itinerary:update', 'itinerary:delete',
    'customer:create', 'customer:read', 'customer:update', 'customer:delete',
    'financial:view', 'financial:export', 'financial:approve',
    'admin:manage', 'admin:settings', 'admin:users',
  ],
  manager: [
    'order:create', 'order:read', 'order:update', 'order:cancel',
    'quotation:create', 'quotation:read', 'quotation:update', 'quotation:convert',
    'itinerary:create', 'itinerary:read', 'itinerary:update',
    'customer:create', 'customer:read', 'customer:update',
    'financial:view', 'financial:export',
  ],
  sales: [
    'order:create', 'order:read', 'order:update',
    'quotation:create', 'quotation:read', 'quotation:update', 'quotation:convert',
    'itinerary:read',
    'customer:create', 'customer:read', 'customer:update',
  ],
  operator: [
    'order:read', 'order:update',
    'quotation:read',
    'itinerary:create', 'itinerary:read', 'itinerary:update',
    'customer:read',
  ],
  finance: [
    'order:read',
    'quotation:read',
    'customer:read',
    'financial:view', 'financial:export',
  ],
  welfare: [
    'order:read',
    'itinerary:read',
  ],
  traveler: [
    'order:read',
    'itinerary:read',
  ],
};

/**
 * 使用者狀態
 */
export type UserStatus = 'active' | 'inactive' | 'suspended';

/**
 * 使用者資訊
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 登入憑證
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * 登入回應
 */
export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * JWT Token Payload
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  exp: number;
  iat: number;
}

/**
 * 檢查使用者是否有特定權限
 */
export function hasPermission(
  user: User | null,
  permission: Permission
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true; // 管理員擁有所有權限
  return user.permissions.includes(permission);
}

/**
 * 檢查使用者是否有任一權限
 */
export function hasAnyPermission(
  user: User | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return permissions.some(permission => user.permissions.includes(permission));
}

/**
 * 檢查使用者是否有所有權限
 */
export function hasAllPermissions(
  user: User | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return permissions.every(permission => user.permissions.includes(permission));
}
