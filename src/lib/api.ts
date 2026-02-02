// 從集中管理的文件中匯入環境變數
import { API_BASE_URL, API_VERSION, USE_MOCK_API, MOCK_LATENCY_MS } from '../config/env';
import { getAccessToken } from './supabase';

/**
 * API Configuration
 * 後端 API 配置檔案
 */

// URL 建構邏輯抽象化，減少重複和硬編碼
const buildApiUrl = (path: string): string => {
  return `${API_BASE_URL}/api/${API_VERSION}/${path}`;
};

// API 端點（統一使用 RESTful 風格）
// 大型配置物件現在透過 buildApiUrl 變得更簡潔，提升維護性
export const API_ENDPOINTS = {
  // 認證
  auth: {
    login: buildApiUrl('auth/login'),
    logout: buildApiUrl('auth/logout'),
    refresh: buildApiUrl('auth/refresh'),
    me: buildApiUrl('auth/me'),
    resetPassword: buildApiUrl('auth/reset-password'),
  },
  // 訂單管理（RESTful）
  orders: {
    list: buildApiUrl('orders'),
    create: buildApiUrl('orders'),
    detail: (id: string) => buildApiUrl(`orders/${id}`),
    update: (id: string) => buildApiUrl(`orders/${id}`),
    delete: (id: string) => buildApiUrl(`orders/${id}`),
    cancel: (id: string) => buildApiUrl(`orders/${id}/cancel`),
    refund: (id: string) => buildApiUrl(`orders/${id}/refund`),
  },
  // 報價管理（RESTful）
  quotations: {
    list: buildApiUrl('quotations'),
    create: buildApiUrl('quotations'),
    detail: (id: string) => buildApiUrl(`quotations/${id}`),
    update: (id: string) => buildApiUrl(`quotations/${id}`),
    delete: (id: string) => buildApiUrl(`quotations/${id}`),
    convert: (id: string) => buildApiUrl(`quotations/${id}/convert`),
    versions: (id: string) => buildApiUrl(`quotations/${id}/versions`),
  },
  // 行程管理（RESTful）
  tours: {
    list: buildApiUrl('tours'),
    create: buildApiUrl('tours'),
    detail: (id: string) => buildApiUrl(`tours/${id}`),
    update: (id: string) => buildApiUrl(`tours/${id}`),
    delete: (id: string) => buildApiUrl(`tours/${id}`),
    sessions: (tourId: string) => buildApiUrl(`tours/${tourId}/sessions`),
  },
  // 團次管理（RESTful）
  sessions: {
    list: buildApiUrl('sessions'),
    create: buildApiUrl('sessions'),
    detail: (id: string) => buildApiUrl(`sessions/${id}`),
    update: (id: string) => buildApiUrl(`sessions/${id}`),
    delete: (id: string) => buildApiUrl(`sessions/${id}`),
  },
  // 客戶管理（RESTful）
  customers: {
    list: buildApiUrl('customers'),
    create: buildApiUrl('customers'),
    detail: (id: string) => buildApiUrl(`customers/${id}`),
    update: (id: string) => buildApiUrl(`customers/${id}`),
    delete: (id: string) => buildApiUrl(`customers/${id}`),
  },
  corporateAccounts: {
    list: buildApiUrl('corporate-accounts'),
    create: buildApiUrl('corporate-accounts'),
    detail: (id: string) => buildApiUrl(`corporate-accounts/${id}`),
    update: (id: string) => buildApiUrl(`corporate-accounts/${id}`),
    delete: (id: string) => buildApiUrl(`corporate-accounts/${id}`),
    contacts: (id: string) => buildApiUrl(`corporate-accounts/${id}/contacts`),
    contactDetail: (id: string, contactId: string) =>
      buildApiUrl(`corporate-accounts/${id}/contacts/${contactId}`),
    engagements: (id: string) => buildApiUrl(`corporate-accounts/${id}/engagements`),
  },
  // 使用者管理（RESTful）
  users: {
    list: buildApiUrl('users'),
    create: buildApiUrl('users'),
    detail: (id: string) => buildApiUrl(`users/${id}`),
    update: (id: string) => buildApiUrl(`users/${id}`),
    delete: (id: string) => buildApiUrl(`users/${id}`),
    activate: (id: string) => buildApiUrl(`users/${id}/activate`),
    deactivate: (id: string) => buildApiUrl(`users/${id}/deactivate`),
  },
  // 預算管理 (福委端)
  budgets: {
    list: buildApiUrl('budgets'),
    detail: (id: string) => buildApiUrl(`budgets/${id}`),
    update: (id: string) => buildApiUrl(`budgets/${id}`),
  },
  // 投票
  polls: {
    list: buildApiUrl('polls'),
    create: buildApiUrl('polls'),
    detail: (id: string) => buildApiUrl(`polls/${id}`),
    vote: (pollId: string) => buildApiUrl(`polls/${pollId}/vote`),
  },
  // 報表
  reports: {
    revenue: buildApiUrl('reports/revenue'),
    customers: buildApiUrl('reports/customers'),
    teams: buildApiUrl('reports/teams'),
    export: (type: string) => buildApiUrl(`reports/${type}/export`),
  },
  // 匯入管理 (Chrome Extension / JSON)
  import: {
    list: buildApiUrl('import'),
    batch: buildApiUrl('import'),
    upsert: buildApiUrl('import/upsert'),
    upload: buildApiUrl('import/upload'),
    stats: buildApiUrl('import/stats'),
    detail: (id: string) => buildApiUrl(`import/${id}`),
    update: (id: string) => buildApiUrl(`import/${id}`),
    delete: (id: string) => buildApiUrl(`import/${id}`),
    convert: (id: string) => buildApiUrl(`import/${id}/convert`),
  },
  // 天氣推播
  weather: {
    forecast: buildApiUrl('weather/forecast'),
    alerts: buildApiUrl('weather/alerts'),
    push: buildApiUrl('weather/push'),
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

// MOCK_LIST_ENDPOINTS 規則與原始碼保持一致
const MOCK_LIST_ENDPOINTS: RegExp[] = [
  /\/api\/v1\/orders\/?$/,
  /\/api\/v1\/quotations\/?$/,
  /\/api\/v1\/tours\/?$/,
  /\/api\/v1\/sessions\/?$/,
  /\/api\/v1\/customers\/?$/,
  /\/api\/v1\/corporate-accounts\/?$/,
  /\/api\/v1\/corporate-accounts\/[^/]+\/contacts\/?$/,
  /\/api\/v1\/corporate-accounts\/[^/]+\/engagements\/?$/,
  /\/api\/v1\/users\/?$/,
  /\/api\/v1\/polls\/?$/,
  /\/api\/v1\/budgets\/?$/,
  /\/api\/v1\/reports\/(revenue|customers|teams)\/?$/,
  /\/api\/v1\/import\/?$/,
  /\/api\/v1\/weather\/(forecast|alerts)\/?$/,
];

// MOCK_LATENCY_MS 現在從 env.ts 匯入

function getPathname(endpoint: string): string {
  try {
    // 使用一個虛擬的 baseURL 來正確解析 pathname，與原始行為保持一致
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
  // 預期路徑格式為 /api/v1/resource/id
  if (parts.length >= 4 && parts[0] === 'api' && parts[1] === API_VERSION) {
    return parts[3];
  }
  return null;
}

async function mockApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  const method = (options.method || 'GET').toUpperCase();
  const pathname = getPathname(endpoint);

  // 簡單的 mock 邏輯，可根據實際需求擴展
  if (method === 'GET') {
    if (MOCK_LIST_ENDPOINTS.some((regex) => regex.test(pathname))) {
      // 列表端點返回空數組
      return { data: [] as T, error: null };
    }
    // 詳細資料端點或其他 GET 請求返回帶有 ID 的 mock 對象
    const id = extractResourceId(pathname);
    if (id) {
      return { data: { id, name: `Mock Item ${id}` } as T, error: null };
    }
    return { data: null as T, error: null };
  }

  if (method === 'DELETE') {
    return { data: null as T, error: null };
  }

  // POST/PUT/PATCH 請求，模擬創建或更新資料
  let data: any = parseRequestBody(options.body);
  const idFromPath = extractResourceId(pathname);

  if (data && typeof data === 'object') {
    // 如果路徑中包含 ID 或請求體中已有 ID，則使用，否則生成一個新的
    data = { ...data, id: idFromPath || data.id || createMockId('mock') };
  } else {
    // 如果沒有請求體或不是對象，則只返回一個 ID
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
      message = errorData?.message || '未授權，請重新登入';
      break;
    case 403:
      code = 'FORBIDDEN';
      message = errorData?.message || '沒有權限執行此操作';
      break;
    case 404:
      code = 'NOT_FOUND';
      message = errorData?.message || '資源不存在';
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
      message = errorData?.message || '伺服器內部錯誤';
      break;
    case 503:
      code = 'SERVICE_UNAVAILABLE';
      message = errorData?.message || '服務暫時無法使用';
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
 * API 請求封裝
 * 處理請求、回應、錯誤、Token 管理及 Mock 模式切換
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (USE_MOCK_API) { // 使用集中管理的 USE_MOCK_API 變數
    return mockApiRequest<T>(endpoint, options);
  }

  try {
    // 優先從 Supabase session 取得 token，fallback 到 localStorage
    let token: string | null = await getAccessToken();
    if (!token) {
      token = localStorage.getItem('auth_token');
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...getHeaders(token || undefined),
        ...options.headers,
      },
    });

    // 處理 204 No Content 狀態碼，表示成功但無回應內容
    if (response.status === 204) {
      return { data: null as T, error: null };
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    // 如果回應狀態碼不是 2xx (response.ok 為 false)，則處理錯誤
    if (!response.ok) {
      const errorData = isJson
        ? await response.json().catch(() => ({})) // 嘗試解析 JSON 錯誤訊息，失敗則返回空物件
        : {}; // 如果不是 JSON，則無錯誤數據體
      return {
        data: null,
        error: handleApiError(response, errorData),
      };
    }

    // 如果回應是成功的，但不是 JSON 格式，或內容長度為 0 (可能是空回應)
    // 則返回 null 作為數據
    if (!isJson || response.headers.get('content-length') === '0') {
      return { data: null as T, error: null };
    }

    // 解析 JSON 回應
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    // 捕獲網路錯誤或 fetch API 拋出的其他異常
    return {
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : '網路連線錯誤',
      },
    };
  }
}

// API 方法封裝，提供更簡潔的請求方式
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