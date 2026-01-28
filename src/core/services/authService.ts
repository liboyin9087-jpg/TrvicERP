import { api, API_ENDPOINTS } from '@/lib/api';
import type {
  User,
  LoginCredentials,
  LoginResponse,
  UserRole,
  Permission,
} from '../types/auth';
import { ROLE_PERMISSIONS, hasPermission } from '../types/auth';

// 重新匯出類型以便於使用
export type { LoginCredentials, LoginResponse, User, UserRole, Permission };

/**
 * 認證資訊儲存的介面定義。
 * 負責處理 Token、Refresh Token 和使用者資訊的持久化。
 */
export interface IAuthStorage {
  /**
   * 儲存認證 Token。
   * @param token 認證 Token 字串。
   */
  setToken(token: string): void;

  /**
   * 取得認證 Token。
   * @returns 認證 Token 字串或 null。
   */
  getToken(): string | null;

  /**
   * 儲存刷新 Token。
   * @param token 刷新 Token 字串。
   */
  setRefreshToken(token: string): void;

  /**
   * 取得刷新 Token。
   * @returns 刷新 Token 字串或 null。
   */
  getRefreshToken(): string | null;

  /**
   * 儲存使用者物件。
   * @param user 使用者物件。
   */
  setUser(user: User): void;

  /**
   * 取得使用者物件。
   * @returns 使用者物件或 null。
   */
  getUser(): User | null;

  /**
   * 清除所有認證相關的儲存資訊。
   */
  clear(): void;
}

/**
 * 本地儲存實現的認證資訊儲存服務。
 * 負責將認證 Token 和使用者資訊存儲在瀏覽器的 localStorage 中。
 */
export class LocalStorageAuthStorage implements IAuthStorage {
  private readonly TOKEN_KEY: string;
  private readonly REFRESH_TOKEN_KEY: string;
  private readonly USER_KEY: string;

  constructor(config?: { tokenKey?: string; refreshTokenKey?: string; userKey?: string }) {
    this.TOKEN_KEY = config?.tokenKey || 'auth_token';
    this.REFRESH_TOKEN_KEY = config?.refreshTokenKey || 'auth_refresh_token';
    this.USER_KEY = config?.userKey || 'auth_user';
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

/**
 * 認證操作的介面定義。
 * 抽象化登入、登出、刷新 Token 等操作，以便於替換不同的實作（例如：真實 API 或 Mock）。
 */
export interface IAuthRepository {
  /**
   * 執行使用者登入。
   * @param credentials 使用者登入憑證。
   * @returns 登入回應，包含成功狀態、使用者資訊和 Token。
   */
  login(credentials: LoginCredentials): Promise<LoginResponse>;

  /**
   * 執行使用者登出。
   */
  logout(): Promise<void>;

  /**
   * 執行 Token 刷新。
   * @returns 刷新是否成功。
   */
  refreshToken(): Promise<boolean>;

  /**
   * 執行密碼重設。
   * @param email 使用者的電子郵件地址。
   * @returns 密碼重設回應，包含成功狀態和可能的錯誤訊息。
   */
  resetPassword(email: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * 基於真實 API 的認證儲存庫實作。
 * 負責與後端 API 進行實際的認證交互。
 */
export class ApiAuthRepository implements IAuthRepository {
  private authStorage: IAuthStorage;

  constructor(authStorage: IAuthStorage) {
    this.authStorage = authStorage;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const result = await api.post<{
      user: User;
      token: string;
      refreshToken: string;
    }>(API_ENDPOINTS.auth.login, credentials);

    if (result.error || !result.data) {
      return {
        success: false,
        error: result.error?.message || '登入失敗',
      };
    }

    this.authStorage.setToken(result.data.token);
    this.authStorage.setRefreshToken(result.data.refreshToken);
    this.authStorage.setUser(result.data.user);

    return {
      success: true,
      user: result.data.user,
      token: result.data.token,
      refreshToken: result.data.refreshToken,
    };
  }

  async logout(): Promise<void> {
    await api.post(API_ENDPOINTS.auth.logout, {}).catch(() => {
      // 忽略錯誤，確保本地清除
    });
    this.authStorage.clear();
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = this.authStorage.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const result = await api.post<{ token: string; refreshToken: string }>(
      API_ENDPOINTS.auth.refresh,
      { refreshToken }
    );

    if (result.error || !result.data) {
      return false;
    }

    this.authStorage.setToken(result.data.token);
    this.authStorage.setRefreshToken(result.data.refreshToken);
    return true;
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const result = await api.post(API_ENDPOINTS.auth.resetPassword, {
      email,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return { success: true };
  }
}

/**
 * Mock 認證儲存庫實作。
 * 提供虛擬的認證邏輯，用於開發和測試環境。
 * 注意：實際應用中不應將硬編碼密碼等敏感資訊儲存在前端程式碼中。
 */
export class MockAuthRepository implements IAuthRepository {
  private authStorage: IAuthStorage;

  // Mock 用戶資料，僅用於開發和測試。實際應用中應從安全的後端獲取。
  // 注意：密碼在此處以明文形式存在，這是 mock 目的，不應在生產環境中出現。
  private readonly MOCK_USERS: Record<
    string,
    { password: string; user: Omit<User, 'permissions'> & { role: UserRole } }
  > = {
    'admin@travelmaster.com': {
      password: 'admin123',
      user: {
        id: 'user_admin',
        email: 'admin@travelmaster.com',
        name: '系統管理員',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    'manager@travelmaster.com': {
      password: 'manager123',
      user: {
        id: 'user_manager',
        email: 'manager@travelmaster.com',
        name: '經理',
        role: 'manager',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    'sales@travelmaster.com': {
      password: 'sales123',
      user: {
        id: 'user_sales',
        email: 'sales@travelmaster.com',
        name: '業務人員',
        role: 'sales',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    'hr@company.com': {
      password: 'hr123',
      user: {
        id: 'user_hr',
        email: 'hr@company.com',
        name: '福委會管理員',
        role: 'welfare',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    'employee@company.com': {
      password: 'emp123',
      user: {
        id: 'user_emp',
        email: 'employee@company.com',
        name: '員工',
        role: 'traveler',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  };

  constructor(authStorage: IAuthStorage) {
    this.authStorage = authStorage;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 模擬網路延遲

    const { email, password } = credentials;
    const mockUser = this.MOCK_USERS[email.toLowerCase()];

    if (!mockUser) {
      return {
        success: false,
        error: '帳號不存在',
      };
    }

    if (mockUser.password !== password) {
      return {
        success: false,
        error: '密碼錯誤',
      };
    }

    // 建立完整的使用者物件（包含權限）
    const user: User = {
      ...mockUser.user,
      permissions: ROLE_PERMISSIONS[mockUser.user.role],
      lastLogin: new Date().toISOString(),
    };

    // 生成 mock token
    const mockToken = `mock_token_${Date.now()}`;
    const mockRefreshToken = `mock_refresh_token_${Date.now()}`;

    // 存儲到 storage
    this.authStorage.setToken(mockToken);
    this.authStorage.setRefreshToken(mockRefreshToken);
    this.authStorage.setUser(user);

    return {
      success: true,
      user,
      token: mockToken,
      refreshToken: mockRefreshToken,
    };
  }

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // 模擬登出延遲
    this.authStorage.clear();
  }

  async refreshToken(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // 模擬延遲
    // Mock 模式通常不需要實際刷新 Token，直接假設成功
    return true;
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 模擬網路延遲
    // 在 Mock 模式下，假設重設總是成功
    return { success: true };
  }
}

/**
 * 主要認證服務。
 * 作為應用程式與認證邏輯的介面，它透過依賴注入來使用不同的認證儲存庫和儲存機制。
 * 負責協調認證操作和使用者狀態管理。
 */
export class AuthService {
  private authRepository: IAuthRepository;
  private authStorage: IAuthStorage; // 服務層仍然需要直接存取儲存來獲取使用者和 Token

  /**
   * 建構函數。
   * @param authRepository 認證儲存庫的實例（例如：ApiAuthRepository 或 MockAuthRepository）。
   * @param authStorage 認證儲存的實例（例如：LocalStorageAuthStorage）。
   */
  constructor(authRepository: IAuthRepository, authStorage: IAuthStorage) {
    this.authRepository = authRepository;
    this.authStorage = authStorage;
  }

  /**
   * 執行使用者登入。
   * @param credentials 登入憑證。
   * @returns 登入回應。
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.authRepository.login(credentials);
  }

  /**
   * 執行使用者登出。
   */
  async logout(): Promise<void> {
    await this.authRepository.logout();
  }

  /**
   * 取得當前已登入的使用者資訊。
   * @returns 使用者物件或 null。
   */
  getCurrentUser(): User | null {
    return this.authStorage.getUser();
  }

  /**
   * 取得認證 Token。
   * @returns Token 字串或 null。
   */
  getToken(): string | null {
    return this.authStorage.getToken();
  }

  /**
   * 取得刷新 Token。
   * @returns 刷新 Token 字串或 null。
   */
  getRefreshToken(): string | null {
    return this.authStorage.getRefreshToken();
  }

  /**
   * 檢查使用者是否已登入。
   * @returns 如果已登入則為 true，否則為 false。
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * 刷新認證 Token。
   * @returns 如果刷新成功則為 true，否則為 false。
   */
  async refreshToken(): Promise<boolean> {
    return this.authRepository.refreshToken();
  }

  /**
   * 檢查使用者是否具有特定權限。
   * @param permission 要檢查的權限。
   * @returns 如果具有權限則為 true，否則為 false。
   */
  hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUser();
    return hasPermission(user, permission);
  }

  /**
   * 檢查使用者是否具有任一所列權限。
   * @param permissions 要檢查的權限列表。
   * @returns 如果具有任一權限則為 true，否則為 false。
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    // 管理員角色通常擁有所有權限
    if (user.role === 'admin') return true;
    return permissions.some((p) => user.permissions.includes(p));
  }

  /**
   * 檢查使用者是否具有所有所列權限。
   * @param permissions 要檢查的權限列表。
   * @returns 如果具有所有權限則為 true，否則為 false。
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    // 管理員角色通常擁有所有權限
    if (user.role === 'admin') return true;
    return permissions.every((p) => user.permissions.includes(p));
  }

  /**
   * 執行密碼重設。
   * @param email 使用者的電子郵件地址。
   * @returns 密碼重設回應。
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    return this.authRepository.resetPassword(email);
  }
}

// ===============================================
// 初始化與導出 (應用程式的入口點會使用此部分)
// ===============================================

// 環境變數判斷應在應用程式啟動時進行，並用於組裝服務
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const authStorage = new LocalStorageAuthStorage();
const authRepository: IAuthRepository = USE_MOCK
  ? new MockAuthRepository(authStorage)
  : new ApiAuthRepository(authStorage);

// 導出一個預設的 AuthSercice 實例，供應用程式直接使用。
// 在大型應用程式中，這部分可能會被更複雜的依賴注入容器取代。
const defaultAuthService = new AuthService(authRepository, authStorage);

export default defaultAuthService;