/**
 * API Configuration
 * 後端 API 配置檔案
 */

// API 基礎 URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// API 版本
const API_VERSION = 'v1';

// API 端點（統一使用 RESTful 風格）
export const API_ENDPOINTS = {
  // 認證
  auth: {
    login: `${API_BASE_URL}/api/${API_VERSION}/auth/login`,
    logout: `${API_BASE_URL}/api/${API_VERSION}/auth/logout`,
    refresh: `${API_BASE_URL}/api/${API_VERSION}/auth/refresh`,
    me: `${API_BASE_URL}/api/${API_VERSION}/auth/me`,
    resetPassword: `${API_BASE_URL}/api/${API_VERSION}/auth/reset-password`,
  },
  // 訂單管理（RESTful）
  orders: {
    list: `${API_BASE_URL}/api/${API_VERSION}/orders`,
    create: `${API_BASE_URL}/api/${API_VERSION}/orders`,
    detail: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/orders/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/orders/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/orders/${id}`,
    cancel: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/orders/${id}/cancel`,
    refund: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/orders/${id}/refund`,
  },
  // 報價管理（RESTful）
  quotations: {
    list: `${API_BASE_URL}/api/${API_VERSION}/quotations`,
    create: `${API_BASE_URL}/api/${API_VERSION}/quotations`,
    detail: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/quotations/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/quotations/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/quotations/${id}`,
    convert: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/quotations/${id}/convert`,
    versions: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/quotations/${id}/versions`,
  },
  // 行程管理（RESTful）
  tours: {
    list: `${API_BASE_URL}/api/${API_VERSION}/tours`,
    create: `${API_BASE_URL}/api/${API_VERSION}/tours`,
    detail: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/tours/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/tours/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/tours/${id}`,
    sessions: (tourId: string) => `${API_BASE_URL}/api/${API_VERSION}/tours/${tourId}/sessions`,
  },
  // 團次管理（RESTful）
  sessions: {
    list: `${API_BASE_URL}/api/${API_VERSION}/sessions`,
    create: `${API_BASE_URL}/api/${API_VERSION}/sessions`,
    detail: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/sessions/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/sessions/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/sessions/${id}`,
  },
  // 客戶管理（RESTful）
  customers: {
    list: `${API_BASE_URL}/api/${API_VERSION}/customers`,
    create: `${API_BASE_URL}/api/${API_VERSION}/customers`,
    detail: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/customers/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/customers/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/customers/${id}`,
  },
  // 使用者管理（RESTful）
  users: {
    list: `${API_BASE_URL}/api/${API_VERSION}/users`,
    create: `${API_BASE_URL}/api/${API_VERSION}/users`,
    detail: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/users/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/users/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/users/${id}`,
    activate: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/users/${id}/activate`,
    deactivate: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/users/${id}/deactivate`,
  },
  // 預算管理 (福委端)
  budgets: {
    list: `${API_BASE_URL}/api/${API_VERSION}/budgets`,
    detail: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/budgets/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/budgets/${id}`,
  },
  // 投票
  polls: {
    list: `${API_BASE_URL}/api/${API_VERSION}/polls`,
    create: `${API_BASE_URL}/api/${API_VERSION}/polls`,
    detail: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/polls/${id}`,
    vote: (pollId: string) => `${API_BASE_URL}/api/${API_VERSION}/polls/${pollId}/vote`,
  },
  // 報表
  reports: {
    revenue: `${API_BASE_URL}/api/${API_VERSION}/reports/revenue`,
    customers: `${API_BASE_URL}/api/${API_VERSION}/reports/customers`,
    teams: `${API_BASE_URL}/api/${API_VERSION}/reports/teams`,
    export: (type: string) => `${API_BASE_URL}/api/${API_VERSION}/reports/${type}/export`,
  },
} as const;

// 預設請求 headers
export const getHeaders = (token?: string): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

/**
 * API 錯誤類型
 */
export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, any>;
}

/**
 * API 回應類型
 */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

const MOCK_LIST_ENDPOINTS: RegExp[] = [
  /\/api\/v1\/orders\/?$/,
  /\/api\/v1\/quotations\/?$/,
  /\/api\/v1\/tours\/?$/,
  /\/api\/v1\/sessions\/?$/,
  /\/api\/v1\/customers\/?$/,
  /\/api\/v1\/users\/?$/,
  /\/api\/v1\/polls\/?$/,
  /\/api\/v1\/budgets\/?$/,
  /\/api\/v1\/reports\/(revenue|customers|teams)\/?$/,
];

const MOCK_LATENCY_MS = 120;

function getPathname(endpoint: string): string {
  try {
    return new URL(endpoint, 'http://localhost').pathname;
  } catch {
    return endpoint;
  }
}

function parseRequestBody(body: BodyInit | null | undefined): unknown {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

function createMockId(prefix: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${suffix}`;
}

function extractResourceId(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 4) return null;
  if (parts[0] !== 'api' || parts[1] !== 'v1') return null;
  return parts[3] || null;
}

async function mockApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  const method = (options.method || 'GET').toUpperCase();
  const pathname = getPathname(endpoint);

  if (method === 'GET') {
    if (MOCK_LIST_ENDPOINTS.some((regex) => regex.test(pathname))) {
      return { data: [] as T, error: null };
    }
    return { data: null as T, error: null };
  }

  if (method === 'DELETE') {
    return { data: null as T, error: null };
  }

  const body = parseRequestBody(options.body);
  const idFromPath = extractResourceId(pathname);
  let data: any = body;

  if (data && typeof data === 'object') {
    if (idFromPath && !('id' in data)) {
      data = { ...data, id: idFromPath };
    } else if (!('id' in data)) {
      data = { ...data, id: createMockId('mock') };
    }
  } else if (data == null) {
    data = { id: idFromPath || createMockId('mock') };
  }

  return { data: data as T, error: null };
}

/**
 * 標準化 API 錯誤處理
 */
function handleApiError(
  response: Response,
  errorData?: any
): ApiError {
  const statusCode = response.status;
  let code = 'UNKNOWN_ERROR';
  let message = `請求失敗: ${statusCode}`;

  // 根據 HTTP 狀態碼設定錯誤代碼
  switch (statusCode) {
    case 400:
      code = 'BAD_REQUEST';
      message = errorData?.message || '請求參數錯誤';
      break;
    case 401:
      code = 'UNAUTHORIZED';
      message = '未授權，請重新登入';
      break;
    case 403:
      code = 'FORBIDDEN';
      message = '沒有權限執行此操作';
      break;
    case 404:
      code = 'NOT_FOUND';
      message = '資源不存在';
      break;
    case 409:
      code = 'CONFLICT';
      message = errorData?.message || '資料衝突';
      break;
    case 422:
      code = 'VALIDATION_ERROR';
      message = errorData?.message || '資料驗證失敗';
      break;
    case 500:
      code = 'INTERNAL_ERROR';
      message = '伺服器內部錯誤';
      break;
    case 503:
      code = 'SERVICE_UNAVAILABLE';
      message = '服務暫時無法使用';
      break;
  }

  return {
    code,
    message,
    statusCode,
    details: errorData?.details,
  };
}

/**
 * API 請求封裝（改進版）
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (USE_MOCK) {
    return mockApiRequest<T>(endpoint, options);
  }

  try {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...getHeaders(token || undefined),
        ...options.headers,
      },
    });

    // 處理非 JSON 回應（如 204 No Content）
    if (response.status === 204) {
      return { data: null as T, error: null };
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      const errorData = isJson
        ? await response.json().catch(() => ({}))
        : {};
      return {
        data: null,
        error: handleApiError(response, errorData),
      };
    }

    // 處理空回應
    if (!isJson) {
      return { data: null as T, error: null };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    // 網路錯誤或其他異常
    return {
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : '網路連線錯誤',
      },
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
