/**
 * API Configuration
 * 後端 API 配置檔案
 */

// API 基礎 URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
export class ApiError extends Error {
  code: string;
  statusCode?: number;
  details?: Record<string, any>;
  endpoint?: string;
  method?: string;
  requestId?: string;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode?: number,
    details?: Record<string, any>,
    endpoint?: string,
    method?: string,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.endpoint = endpoint;
    this.method = method;
    this.requestId = requestId;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * 轉換為用戶友好的錯誤訊息
   */
  toUserMessage(): string {
    // 根據錯誤代碼返回用戶友好的訊息
    const userMessages: Record<string, string> = {
      NETWORK_ERROR: '網路連線錯誤，請檢查您的網路連線',
      OFFLINE: '目前處於離線狀態，請檢查網路連線',
      UNAUTHORIZED: '登入已過期，請重新登入',
      FORBIDDEN: '您沒有權限執行此操作',
      NOT_FOUND: '找不到請求的資源',
      BAD_REQUEST: '請求參數錯誤',
      VALIDATION_ERROR: '資料驗證失敗，請檢查輸入內容',
      CONFLICT: '資料衝突，請重新整理後再試',
      INTERNAL_ERROR: '伺服器發生錯誤，請稍後再試',
      SERVICE_UNAVAILABLE: '服務暫時無法使用，請稍後再試',
      RATE_LIMIT_EXCEEDED: '請求過於頻繁，請稍後再試',
      BAD_GATEWAY: '伺服器連線錯誤',
      GATEWAY_TIMEOUT: '請求逾時，請稍後再試',
      UNKNOWN_ERROR: '發生未知錯誤',
    };

    return userMessages[this.code] || this.message || '發生未知錯誤';
  }
}

/**
 * 錯誤處理選項
 */
export interface ErrorHandlingOptions {
  showToast?: boolean;
  logError?: boolean;
  onError?: (error: ApiError) => void;
}

/**
 * API 回應類型
 */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

/**
 * 處理 API 錯誤（可選顯示 Toast）
 */
export function handleApiResponseError<T>(
  response: ApiResponse<T>,
  options: ErrorHandlingOptions = {}
): boolean {
  const { showToast = false, logError = true, onError } = options;

  if (response.error) {
    if (logError) {
      console.error('API Error:', response.error);
    }

    if (showToast) {
      // 動態導入 toast 以避免循環依賴
      import('../store/useToastStore')
        .then(({ useToastStore }) => {
          const userMessage = response.error.toUserMessage();
          useToastStore.getState().addToast(userMessage, 'error', 5000);
        })
        .catch(() => {
          // 如果 toast 不可用，使用 alert 作為後備
          const userMessage = response.error.toUserMessage();
          alert(userMessage);
        });
    }

    if (onError) {
      onError(response.error);
    }

    return true;
  }

  return false;
}

/**
 * 安全解析 JSON
 */
async function safeJsonParse<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * 建立錯誤物件
 */
function buildError(
  response: Response,
  errorData?: any,
  endpoint?: string,
  method?: string
): ApiError {
  const statusCode = response.status;
  let code = 'UNKNOWN_ERROR';
  let message = `請求失敗: ${statusCode}`;

  // 根據 HTTP 狀態碼設定錯誤代碼
  switch (statusCode) {
    case 400:
      code = 'BAD_REQUEST';
      message = errorData?.message || errorData?.error || '請求參數錯誤';
      break;
    case 401:
      code = 'UNAUTHORIZED';
      message = '未授權，請重新登入';
      // 清除本地認證資訊
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_user');
      } catch {
        // 忽略清除錯誤
      }
      break;
    case 403:
      code = 'FORBIDDEN';
      message = errorData?.message || errorData?.error || '沒有權限執行此操作';
      break;
    case 404:
      code = 'NOT_FOUND';
      message = errorData?.message || errorData?.error || '資源不存在';
      break;
    case 409:
      code = 'CONFLICT';
      message = errorData?.message || errorData?.error || '資料衝突';
      break;
    case 422:
      code = 'VALIDATION_ERROR';
      message = errorData?.message || errorData?.error || '資料驗證失敗';
      break;
    case 429:
      code = 'RATE_LIMIT_EXCEEDED';
      message = errorData?.message || errorData?.error || '請求過於頻繁，請稍後再試';
      break;
    case 500:
      code = 'INTERNAL_ERROR';
      message = errorData?.message || errorData?.error || '伺服器內部錯誤';
      break;
    case 502:
      code = 'BAD_GATEWAY';
      message = '伺服器連線錯誤';
      break;
    case 503:
      code = 'SERVICE_UNAVAILABLE';
      message = errorData?.message || errorData?.error || '服務暫時無法使用';
      break;
    case 504:
      code = 'GATEWAY_TIMEOUT';
      message = '請求逾時，請稍後再試';
      break;
  }

  return new ApiError(
    message,
    code,
    statusCode,
    errorData?.details || errorData,
    endpoint,
    method,
    response.headers.get('x-request-id') || undefined
  );
}

/**
 * API 請求封裝（改進版 - 集成攔截器）
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const method = options.method || 'GET';
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // 動態導入攔截器以避免循環依賴
    const { apiInterceptor } = await import('@/core/middleware/apiInterceptor');
    
    // 執行請求攔截器
    const [finalEndpoint, finalOptions] = await apiInterceptor.executeRequestInterceptors(
      endpoint,
      {
        ...options,
        headers: {
          ...getHeaders(localStorage.getItem('auth_token') || undefined),
          ...options.headers,
          'X-Request-ID': requestId,
        },
      }
    );

    const response = await fetch(finalEndpoint, finalOptions);

    // 處理非 JSON 回應（如 204 No Content）
    if (response.status === 204) {
      return { data: null as T, error: null };
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let apiResponse: ApiResponse<T>;

    if (!response.ok) {
      const errorData = isJson ? await safeJsonParse<any>(response) : {};
      apiResponse = {
        data: null,
        error: buildError(response, errorData, finalEndpoint, method),
      };
    } else if (!isJson) {
      // 處理空回應
      apiResponse = { data: null as T, error: null };
    } else {
      const data = await safeJsonParse<T>(response);
      apiResponse = { data, error: null };
    }

    // 執行回應攔截器
    const finalResponse = await apiInterceptor.executeResponseInterceptors(apiResponse);

    // 如果有錯誤，執行錯誤攔截器
    if (finalResponse.error) {
      await apiInterceptor.executeErrorInterceptors(finalResponse.error);
    }

    return finalResponse;
  } catch (error) {
    // 網路錯誤或其他異常
    const errorMessage = error instanceof Error ? error.message : '網路連線錯誤';

    // 檢查是否為離線狀態
    if (!navigator.onLine) {
      return {
        data: null,
        error: new ApiError(
          '目前處於離線狀態，請檢查網路連線',
          'OFFLINE',
          undefined,
          undefined,
          endpoint,
          method,
          requestId
        ),
      };
    }

    // 檢查是否為無法 fetch/連線
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        data: null,
        error: new ApiError(
          '無法連線至伺服器，請檢查網路設定',
          'NETWORK_ERROR',
          undefined,
          undefined,
          endpoint,
          method,
          requestId
        ),
      };
    }

    return {
      data: null,
      error: new ApiError(
        errorMessage,
        'NETWORK_ERROR',
        undefined,
        undefined,
        endpoint,
        method,
        requestId
      ),
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
