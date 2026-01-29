/**
 * 認證與權限核心類型定義
 * Authentication & Authorization Core Types
 */

/**
 * 使用者角色
 */
export type UserRole =
  | 'admin'        // 系統管理員：擁有系統的最高權限
  | 'manager'      // 經理：負責管理業務、審批等工作
  | 'sales'        // 業務：負責銷售、報價和客戶關係維護
  | 'operator'     // OP 人員：負責訂單操作、行程安排等後勤工作
  | 'finance'      // 財務：負責財務相關的審核、報表和支付處理
  | 'welfare'      // 福委：可能涉及員工福利相關的訂單或行程查看
  | 'traveler';    // 旅客：系統中的最終用戶，通常只擁有查看個人資訊的權限

/**
 * 權限類型
 * 定義了系統中所有可分配的具體操作權限。
 */
export type Permission =
  // 訂單權限 (Order Permissions)
  | 'order:create'    // 允許建立新訂單
  | 'order:read'      // 允許讀取訂單資訊，包括訂單詳情、狀態等
  | 'order:update'    // 允許更新訂單資訊，如修改行程、客戶資料等
  | 'order:delete'    // 允許刪除訂單，通常需要高權限
  | 'order:cancel'    // 允許取消已成立的訂單
  | 'order:refund'    // 允許處理訂單的退款操作

  // 報價權限 (Quotation Permissions)
  | 'quotation:create' // 允許建立新的報價單
  | 'quotation:read'   // 允許讀取報價單資訊
  | 'quotation:update' // 允許更新報價單內容
  | 'quotation:delete' // 允許刪除報價單
  | 'quotation:convert'// 允許將報價單轉換為正式訂單

  // 行程權限 (Itinerary Permissions)
  | 'itinerary:create' // 允許建立新的行程規劃
  | 'itinerary:read'   // 允許讀取行程的詳細資訊
  | 'itinerary:update' // 允許更新行程的內容或狀態
  | 'itinerary:delete' // 允許刪除行程規劃

  // 客戶權限 (Customer Permissions)
  | 'customer:create'  // 允許建立新的客戶資料
  | 'customer:read'    // 允許讀取客戶的詳細資料
  | 'customer:update'  // 允許更新客戶資料
  | 'customer:delete'  // 允許刪除客戶資料

  // 財務權限 (Financial Permissions)
  | 'financial:view'   // 允許查看財務相關的報表、交易記錄和數據
  | 'financial:export' // 允許匯出財務數據，如營收報表、支出明細等
  | 'financial:approve'// 允許核准財務操作，例如大額退款、支付審批等

  // 管理權限 (Administration Permissions)
  | 'admin:manage'     // 允許執行系統的一般管理操作，如審核流程等
  | 'admin:settings'   // 允許修改系統層級的設定
  | 'admin:users';     // 允許管理使用者帳戶，如建立、修改、禁用、刪除使用者

/**
 * 注意：ROLE_PERMISSIONS 常數已基於可維護性考量，
 * 拆分到 /src/core/configs/rolePermissionsConfig.ts 檔案中。
 * 若需修改角色與權限對應，請至該檔案進行調整。
 */

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'order:create', 'order:read', 'order:update', 'order:delete', 'order:cancel', 'order:refund',
    'quotation:create', 'quotation:read', 'quotation:update', 'quotation:delete', 'quotation:convert',
    'itinerary:create', 'itinerary:read', 'itinerary:update', 'itinerary:delete',
    'customer:create', 'customer:read', 'customer:update', 'customer:delete',
    'financial:view', 'financial:export', 'financial:approve',
    'admin:manage', 'admin:settings', 'admin:users',
  ],
  manager: [
    'order:read', 'order:update', 'order:cancel',
    'quotation:create', 'quotation:read', 'quotation:update', 'quotation:convert',
    'itinerary:read', 'itinerary:update',
    'customer:read', 'customer:update',
    'financial:view', 'financial:export', 'financial:approve',
    'admin:manage',
  ],
  sales: [
    'order:create', 'order:read', 'order:update',
    'quotation:create', 'quotation:read', 'quotation:update', 'quotation:convert',
    'customer:create', 'customer:read', 'customer:update',
    'financial:view',
  ],
  operator: [
    'order:read', 'order:update',
    'itinerary:create', 'itinerary:read', 'itinerary:update',
    'customer:read',
  ],
  finance: [
    'order:read', 'order:refund',
    'quotation:read',
    'financial:view', 'financial:export', 'financial:approve',
  ],
  welfare: [
    'order:read',
    'customer:read',
  ],
  traveler: [
    'order:read',
    'customer:read',
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
  permissions: Permission[]; // 該使用者當前被賦予的具體權限列表
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
  exp: number; // Token 過期時間 (Unix timestamp)
  iat: number; // Token 簽發時間 (Unix timestamp)
}

/**
 * 檢查使用者是否有特定權限
 * @param user 使用者物件或 null
 * @param permission 欲檢查的單一權限
 * @returns 如果使用者擁有該權限或為管理員，則返回 true；否則返回 false。
 */
export function hasPermission(
  user: User | null,
  permission: Permission
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true; // 管理員預設擁有所有權限
  return user.permissions.includes(permission);
}

/**
 * 檢查使用者是否有任一權限
 * @param user 使用者物件或 null
 * @param permissions 欲檢查的權限列表，只要擁有其中任一權限即返回 true
 * @returns 如果使用者擁有權限列表中的任一權限或為管理員，則返回 true；否則返回 false。
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
 * @param user 使用者物件或 null
 * @param permissions 欲檢查的權限列表，必須擁有列表中的所有權限才返回 true
 * @returns 如果使用者擁有權限列表中的所有權限或為管理員，則返回 true；否則返回 false。
 */
export function hasAllPermissions(
  user: User | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return permissions.every(permission => user.permissions.includes(permission));
}