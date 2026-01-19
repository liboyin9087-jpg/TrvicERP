import { z } from 'zod';
import { api, API_ENDPOINTS } from '@/lib/api';
import type {
  User,
  LoginCredentials,
  LoginResponse,
  UserRole,
  Permission,
} from '../types/auth';
import { ROLE_PERMISSIONS, hasPermission } from '../types/auth';

const loginSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(8, '密碼至少需要8個字元')
});

export type { LoginCredentials, LoginResponse, User, UserRole, Permission };

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export class AuthService {
  static async login(
    credentials: LoginCredentials
  ): Promise<LoginResponse> {
    try {
      loginSchema.parse(credentials);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.errors[0].message
        };
      }
      return {
        success: false,
        error: '登入驗證失敗'
      };
    }

    if (USE_MOCK) {
      return this.mockLogin(credentials);
    }
    return this.apiLogin(credentials);
  }

  private static async mockLogin(
    credentials: LoginCredentials
  ): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { email, password } = credentials;
    const mockEmail = import.meta.env.VITE_MOCK_EMAIL || '';
    const mockPassword = import.meta.env.VITE_MOCK_PASSWORD || '';

    if (email !== mockEmail) {
      return {
        success: false,
        error: '帳號或密碼錯誤'
      };
    }

    if (password !== mockPassword) {
      return {
        success: false,
        error: '帳號或密碼錯誤'
      };
    }

    const user: User = {
      id: 'user_mock',
      email: mockEmail,
      name: '測試使用者',
      role: 'admin',
      status: 'active',
      permissions: ROLE_PERMISSIONS.admin,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockToken = `mock_token_${Date.now()}`;
    const mockRefreshToken = `mock_refresh_token_${Date.now()}`;

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
        error: '登入失敗，請檢查您的帳號和密碼'
      };
    }

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

  static async logout(): Promise<void> {
    if (!USE_MOCK) {
      await api.post(API_ENDPOINTS.auth.logout, {}).catch(() => {});
    }
    this.clearAuth();
  }

  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private static setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  private static setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private static clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  static async refreshToken(): Promise<boolean> {
    if (USE_MOCK) return true;

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    const result = await api.post<{ token: string; refreshToken: string }>(
      API_ENDPOINTS.auth.refresh,
      { refreshToken }
    );

    if (result.error || !result.data) return false;

    this.setToken(result.data.token);
    this.setRefreshToken(result.data.refreshToken);
    return true;
  }

  static hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUser();
    return hasPermission(user, permission);
  }

  static hasAnyPermission(permissions: Permission[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.some((p) => user.permissions.includes(p));
  }

  static hasAllPermissions(permissions: Permission[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.every((p) => user.permissions.includes(p));
  }

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
        error: '重設密碼失敗'
      };
    }

    return { success: true };
  }
}

export default AuthService;