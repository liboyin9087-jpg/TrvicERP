/**
 * Authentication Service
 * 認證服務 - 支援 Mock 和真實 API
 */

import { api, API_ENDPOINTS } from '../lib/api';
import type { UserRole } from '../store/useAppStore';

// 認證相關類型
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  token?: string;
  error?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// 是否使用 Mock 模式（可透過環境變數控制）
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// Mock 用戶資料
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  'admin@travelmaster.com': {
    password: 'admin123',
    user: {
      id: 'user_admin',
      email: 'admin@travelmaster.com',
      name: '系統管理員',
      role: 'staff',
    },
  },
  'hr@company.com': {
    password: 'hr123',
    user: {
      id: 'user_hr',
      email: 'hr@company.com',
      name: '福委會管理員',
      role: 'welfare',
    },
  },
  'employee@company.com': {
    password: 'emp123',
    user: {
      id: 'user_emp',
      email: 'employee@company.com',
      name: '員工',
      role: 'traveler',
    },
  },
};

// Token 存儲 key
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * 登入服務
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  if (USE_MOCK) {
    return mockLogin(credentials);
  }
  return apiLogin(credentials);
}

/**
 * Mock 登入
 */
async function mockLogin(credentials: LoginCredentials): Promise<LoginResponse> {
  // 模擬網路延遲
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

  // 生成 mock token
  const mockToken = `mock_token_${Date.now()}`;

  // 存儲到 localStorage
  localStorage.setItem(TOKEN_KEY, mockToken);
  localStorage.setItem(USER_KEY, JSON.stringify(mockUser.user));

  return {
    success: true,
    user: mockUser.user,
    token: mockToken,
  };
}

/**
 * 真實 API 登入
 */
async function apiLogin(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data, error } = await api.post<{
    user: AuthUser;
    token: string;
  }>(API_ENDPOINTS.auth.login, credentials);

  if (error || !data) {
    return {
      success: false,
      error: error || '登入失敗',
    };
  }

  // 存儲到 localStorage
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));

  return {
    success: true,
    user: data.user,
    token: data.token,
  };
}

/**
 * 登出服務
 */
export async function logout(): Promise<void> {
  if (!USE_MOCK) {
    // 呼叫後端登出 API
    await api.post(API_ENDPOINTS.auth.logout, {}).catch(() => {
      // 忽略錯誤，確保本地清除
    });
  }

  // 清除本地存儲
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * 取得當前登入用戶
 */
export function getCurrentUser(): AuthUser | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * 取得 Token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 檢查是否已登入
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * 刷新 Token
 */
export async function refreshToken(): Promise<boolean> {
  if (USE_MOCK) {
    return true; // Mock 模式不需要刷新
  }

  const { data, error } = await api.post<{ token: string }>(
    API_ENDPOINTS.auth.refresh,
    {}
  );

  if (error || !data) {
    return false;
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  return true;
}

export default {
  login,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
  refreshToken,
};
