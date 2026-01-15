/**
 * 認證服務（改進版）
 * Enhanced Authentication Service
 */

import { api, API_ENDPOINTS } from '@/lib/api';
import type {
  User,
  LoginCredentials,
  LoginResponse,
  UserRole,
  Permission,
} from '../types/auth';
import { ROLE_PERMISSIONS, hasPermission } from '../types/auth';

// Re-export types for convenience
export type { LoginCredentials, LoginResponse, User, UserRole, Permission };

/**
 * Token 存儲 key
 */
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

/**
 * 是否使用 Mock 模式
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/**
 * Mock 用戶資料
 */
const MOCK_USERS: Record<
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

/**
 * 認證服務
 */
export class AuthService {
  /**
   * 登入
   */
  static async login(
    credentials: LoginCredentials
  ): Promise<LoginResponse> {
    if (USE_MOCK) {
      return this.mockLogin(credentials);
    }
    return this.apiLogin(credentials);
  }

  /**
   * Mock 登入
   */
  private static async mockLogin(
    credentials: LoginCredentials
  ): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { email, password } = credentials;
    const mockUser = MOCK_USERS[email.toLowerCase()];

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

    // 存儲到 localStorage
    this.setToken(mockToken);
    this.setRefreshToken(mockRefreshToken);
    this.setUser(user);

    return {
      success: true,
      user,
      token: mockToken,
      refreshToken: mockRefreshToken,
    };
  }

  /**
   * 真實 API 登入
   */
  private static async apiLogin(
    credentials: LoginCredentials
  ): Promise<LoginResponse> {
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

    // 存儲到 localStorage
    this.setToken(result.data.token);
    this.setRefreshToken(result.data.refreshToken);
    this.setUser(result.data.user);

    return {
      success: true,
      user: result.data.user,
      token: result.data.token,
      refreshToken: result.data.refreshToken,
    };
  }

  /**
   * 登出
   */
  static async logout(): Promise<void> {
    if (!USE_MOCK) {
      await api.post(API_ENDPOINTS.auth.logout, {}).catch(() => {
        // 忽略錯誤，確保本地清除
      });
    }

    this.clearAuth();
  }

  /**
   * 取得當前使用者
   */
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  /**
   * 取得 Token
   */
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * 取得 Refresh Token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * 設定 Token
   */
  private static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * 設定 Refresh Token
   */
  private static setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  /**
   * 設定使用者
   */
  private static setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * 清除認證資訊
   */
  private static clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * 檢查是否已登入
   */
  static isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * 刷新 Token
   */
  static async refreshToken(): Promise<boolean> {
    if (USE_MOCK) {
      return true; // Mock 模式不需要刷新
    }

    const refreshToken = this.getRefreshToken();
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

    this.setToken(result.data.token);
    this.setRefreshToken(result.data.refreshToken);
    return true;
  }

  /**
   * 檢查權限
   */
  static hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUser();
    return hasPermission(user, permission);
  }

  /**
   * 檢查是否有任一權限
   */
  static hasAnyPermission(permissions: Permission[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.some((p) => user.permissions.includes(p));
  }

  /**
   * 檢查是否有所有權限
   */
  static hasAllPermissions(permissions: Permission[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.every((p) => user.permissions.includes(p));
  }

  /**
   * 重設密碼
   */
  static async resetPassword(email: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true };
    }

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

export default AuthService;
