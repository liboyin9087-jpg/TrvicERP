/**
 * API Configuration
 * 後端 API 配置檔案
 */

// API 基礎 URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// API 端點
export const API_ENDPOINTS = {
  // 認證
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    refresh: `${API_BASE_URL}/api/auth/refresh`,
    me: `${API_BASE_URL}/api/auth/me`,
  },
  // 訂單管理
  orders: {
    list: `${API_BASE_URL}/api/orders`,
    create: `${API_BASE_URL}/api/orders`,
    detail: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
  },
  // 行程管理
  tours: {
    list: `${API_BASE_URL}/api/tours`,
    create: `${API_BASE_URL}/api/tours`,
    detail: (id: string) => `${API_BASE_URL}/api/tours/${id}`,
    sessions: (tourId: string) => `${API_BASE_URL}/api/tours/${tourId}/sessions`,
  },
  // 客戶管理
  customers: {
    list: `${API_BASE_URL}/api/customers`,
    detail: (id: string) => `${API_BASE_URL}/api/customers/${id}`,
  },
  // 預算管理 (福委端)
  budgets: {
    list: `${API_BASE_URL}/api/budgets`,
    detail: (id: string) => `${API_BASE_URL}/api/budgets/${id}`,
  },
  // 投票
  polls: {
    list: `${API_BASE_URL}/api/polls`,
    vote: (pollId: string) => `${API_BASE_URL}/api/polls/${pollId}/vote`,
  },
} as const;

// 預設請求 headers
export const getHeaders = (token?: string): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

// API 請求封裝
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...getHeaders(token || undefined),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorData.message || `請求失敗: ${response.status}`,
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : '網路連線錯誤',
    };
  }
}

// API 方法
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export default api;
