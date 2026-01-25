/**
 * API 錯誤處理工具
 * 提供統一的錯誤處理、重試機制、錯誤分類
 */

// 錯誤類型
export enum ApiErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  SERVER = 'SERVER',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

// 自訂 API 錯誤類別
export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly statusCode?: number;
  readonly originalError?: unknown;
  readonly isRetryable: boolean;
  readonly userMessage: string;

  constructor(
    message: string,
    type: ApiErrorType,
    statusCode?: number,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.isRetryable = this.determineRetryable();
    this.userMessage = this.getUserFriendlyMessage();
  }

  private determineRetryable(): boolean {
    // 可重試的錯誤類型
    return [
      ApiErrorType.NETWORK,
      ApiErrorType.TIMEOUT,
      ApiErrorType.RATE_LIMIT,
    ].includes(this.type) || (this.statusCode ? this.statusCode >= 500 : false);
  }

  private getUserFriendlyMessage(): string {
    switch (this.type) {
      case ApiErrorType.NETWORK:
        return '網路連線失敗，請檢查您的網路連線';
      case ApiErrorType.TIMEOUT:
        return '請求逾時，請稍後再試';
      case ApiErrorType.SERVER:
        return '伺服器發生錯誤，請稍後再試';
      case ApiErrorType.VALIDATION:
        return '輸入資料格式不正確，請檢查後重試';
      case ApiErrorType.AUTHENTICATION:
        return '登入已過期，請重新登入';
      case ApiErrorType.AUTHORIZATION:
        return '您沒有權限執行此操作';
      case ApiErrorType.NOT_FOUND:
        return '找不到請求的資源';
      case ApiErrorType.RATE_LIMIT:
        return '請求過於頻繁，請稍後再試';
      default:
        return '發生未知錯誤，請稍後再試';
    }
  }
}

// 從 HTTP 狀態碼推斷錯誤類型
export function getErrorTypeFromStatus(statusCode: number): ApiErrorType {
  if (statusCode === 400) return ApiErrorType.VALIDATION;
  if (statusCode === 401) return ApiErrorType.AUTHENTICATION;
  if (statusCode === 403) return ApiErrorType.AUTHORIZATION;
  if (statusCode === 404) return ApiErrorType.NOT_FOUND;
  if (statusCode === 429) return ApiErrorType.RATE_LIMIT;
  if (statusCode >= 500) return ApiErrorType.SERVER;
  return ApiErrorType.UNKNOWN;
}

// 解析錯誤並轉換為 ApiError
export function parseError(error: unknown): ApiError {
  // 已經是 ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Fetch 錯誤
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new ApiError(
      'Network request failed',
      ApiErrorType.NETWORK,
      undefined,
      error
    );
  }

  // Response 物件
  if (error instanceof Response) {
    return new ApiError(
      `HTTP ${error.status}: ${error.statusText}`,
      getErrorTypeFromStatus(error.status),
      error.status,
      error
    );
  }

  // 一般 Error
  if (error instanceof Error) {
    // 超時錯誤
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new ApiError(
        'Request timeout',
        ApiErrorType.TIMEOUT,
        undefined,
        error
      );
    }

    return new ApiError(
      error.message,
      ApiErrorType.UNKNOWN,
      undefined,
      error
    );
  }

  // 未知錯誤
  return new ApiError(
    String(error),
    ApiErrorType.UNKNOWN,
    undefined,
    error
  );
}

// 重試配置
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // 基礎延遲 (ms)
  maxDelay: number;  // 最大延遲 (ms)
  backoffMultiplier: number;
  shouldRetry?: (error: ApiError, attempt: number) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

// 計算指數退避延遲
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  // 加入隨機 jitter 避免同時重試
  const jitter = Math.random() * 0.3 * delay;
  return Math.min(delay + jitter, config.maxDelay);
}

// 延遲函數
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 帶重試的請求包裝器
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: ApiError | null = null;

  for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = parseError(error);

      // 判斷是否應該重試
      const shouldRetry =
        finalConfig.shouldRetry?.(lastError, attempt) ?? lastError.isRetryable;

      if (attempt <= finalConfig.maxRetries && shouldRetry) {
        const waitTime = calculateBackoffDelay(attempt, finalConfig);
        console.warn(
          `API 請求失敗 (第 ${attempt} 次)，${waitTime}ms 後重試:`,
          lastError.message
        );
        await delay(waitTime);
      } else {
        break;
      }
    }
  }

  throw lastError || new ApiError('Unknown error', ApiErrorType.UNKNOWN);
}

// 超時包裝器
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new ApiError(
        `Request timeout after ${timeoutMs}ms`,
        ApiErrorType.TIMEOUT
      ));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// API 請求封裝（帶錯誤處理和重試）
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  config: {
    timeout?: number;
    retry?: Partial<RetryConfig>;
  } = {}
): Promise<T> {
  const { timeout = 30000, retry } = config;

  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || errorData.detail || response.statusText,
          getErrorTypeFromStatus(response.status),
          response.status
        );
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }, retry);
}

// React Hook 用的錯誤狀態類型
export interface ApiErrorState {
  error: ApiError | null;
  isError: boolean;
  errorMessage: string;
  errorType: ApiErrorType | null;
  clear: () => void;
}

// 創建錯誤狀態
export function createErrorState(
  error: unknown | null,
  clearFn: () => void
): ApiErrorState {
  const apiError = error ? parseError(error) : null;

  return {
    error: apiError,
    isError: !!apiError,
    errorMessage: apiError?.userMessage || '',
    errorType: apiError?.type || null,
    clear: clearFn,
  };
}
