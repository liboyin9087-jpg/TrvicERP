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
          error: error.issues[0]?.message || '登入驗證失敗',
          user: null,
          token: null,
          refreshToken: null,
        };
      }
      return {
        success: false,
        error: '登入驗證失敗',
        user: null,
        token: null,
        refreshToken: null,
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
    
    // Demo 帳號配置
    const demoAccounts: Record<string, { password: string; user: User }> = {
      'demo@trvic.com': {
        password: 'demo12345',
        user: {
          id: 'staff_demo',
          email: 'demo@trvic.com',
          name: '旅行社管理員',
          role: 'admin' as UserRole,
          status: 'active' as const,
          permissions: ROLE_PERMISSIONS.admin,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any
      },
      'welfare@trvic.com': {
        password: 'welfare12345',
        user: {
          id: 'welfare_demo',
          email: 'welfare@trvic.com',
          name: '福委會管理員',
          role: 'welfare' as UserRole,
          status: 'active' as const,
          permissions: ROLE_PERMISSIONS.welfare,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any
      },
      'traveler@trvic.com': {
        password: 'traveler12345',
        user: {
          id: 'traveler_demo',
          email: 'traveler@trvic.com',
          name: '員工',
          role: 'traveler' as UserRole,
          status: 'active' as const,
          permissions: ROLE_PERMISSIONS.traveler,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any
      }
    };

    const account = demoAccounts[email as keyof typeof demoAccounts];
    
    if (!account) {
      return {
        success: false,
        error: '帳號或密碼錯誤',
        user: null,
        token: null,
        refreshToken: null,
      };
    }

    if (password !== account.password) {
      return {
        success: false,
        error: '帳號或密碼錯誤',
        user: null,
        token: null,
        refreshToken: null,
      };
    }

    const mockToken = `mock_token_${Date.now()}`;
    const mockRefreshToken = `mock_refresh_token_${Date.now()}`;

    this.setToken(mockToken);
    this.setRefreshToken(mockRefreshToken);
    this.setUser(account.user);

    return {
      success: true,
      user: account.user,
      token: mockToken as any,
      refreshToken: mockRefreshToken as any,
      error: null,
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
        error: '登入失敗，請檢查您的帳號和密碼',
        user: null,
        token: null,
        refreshToken: null,
      };
    }

    this.setToken(result.data.token);
    this.setRefreshToken(result.data.refreshToken);
    this.setUser(result.data.user);

    return {
      success: true,
      user: result.data.user,
      token: result.data.token as any,
      refreshToken: result.data.refreshToken as any,
      error: null,
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