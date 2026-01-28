/**
 * API 錯誤處理工具
 * 提供統一的錯誤處理、重試機制、錯誤分類、錯誤日誌記錄
 */

// --- Logger Interface ---
export interface Logger {
  log(message: string, ...optionalParams: any[]): void;
  warn(message: string, ...optionalParams: any[]): void;
  error(message: string, ...optionalParams: any[]): void;
}

// 預設的 Console Logger 實現
export const consoleLogger: Logger = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

// --- 錯誤類型 ---
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
  CLIENT_ERROR = 'CLIENT_ERROR', // 用於表示所有未明確分類的 4xx 錯誤
}

// --- 自訂 API 錯誤類別 ---
export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly statusCode?: number;
  readonly originalError?: unknown;
  readonly isRetryable: boolean;
  readonly errorData?: any; // 儲存從後端接收的詳細錯誤資料 (例如：JSON 響應體)

  constructor(
    message: string,
    type: ApiErrorType,
    options?: {
      statusCode?: number;
      originalError?: unknown;
      isRetryable?: boolean; // 允許手動指定是否可重試，覆寫預設判斷
      errorData?: any; // 原始錯誤響應體或任何相關的詳細數據
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = options?.statusCode;
    this.originalError = options?.originalError;
    this.errorData = options?.errorData;
    // 優先使用手動指定的 isRetryable，否則使用內部判斷邏輯
    this.isRetryable = options?.isRetryable ?? this.determineRetryable();
  }

  /**
   * 根據錯誤類型和狀態碼判斷是否預設可重試。
   * 此為預設判斷邏輯，可透過 `ApiError` 構造函數的 `isRetryable` 或 `withRetry` 的 `shouldRetry` 配置覆蓋。
   */
  private determineRetryable(): boolean {
    // 網路相關的錯誤通常是可重試的
    if ([ApiErrorType.NETWORK, ApiErrorType.TIMEOUT, ApiErrorType.RATE_LIMIT].includes(this.type)) {
      return true;
    }

    // 伺服器內部錯誤 (5xx) 通常是暫時性的，可重試
    if (this.statusCode && this.statusCode >= 500 && this.statusCode < 600) {
      return true;
    }

    // 其他錯誤預設不可重試 (例如：4xx 客戶端錯誤、驗證失敗等)
    return false;
  }
}

// --- 錯誤訊息產生器 (與 ApiError 解耦) ---
/**
 * 根據 ApiError 類型產生使用者友善的訊息。
 * 此函數將錯誤處理邏輯與使用者訊息展示解耦。
 */
export function getUserFriendlyErrorMessage(error: ApiError): string {
  switch (error.type) {
    case ApiErrorType.NETWORK:
      return '網路連線失敗，請檢查您的網路連線';
    case ApiErrorType.TIMEOUT:
      return '請求逾時，請稍後再試';
    case ApiErrorType.SERVER:
      // 如果伺服器錯誤有提供更具體的訊息，則顯示，否則顯示通用訊息
      return error.errorData?.message || error.errorData?.detail || '伺服器發生錯誤，請稍後再試';
    case ApiErrorType.VALIDATION:
      // 如果驗證錯誤有提供更具體的訊息，則顯示，否則顯示通用訊息
      return error.errorData?.message || error.errorData?.detail || '輸入資料格式不正確，請檢查後重試';
    case ApiErrorType.AUTHENTICATION:
      return '登入已過期或未授權，請重新登入';
    case ApiErrorType.AUTHORIZATION:
      return '您沒有權限執行此操作';
    case ApiErrorType.NOT_FOUND:
      return '找不到請求的資源';
    case ApiErrorType.RATE_LIMIT:
      return '請求過於頻繁，請稍後再試';
    case ApiErrorType.CLIENT_ERROR:
      // 其他 4xx 客戶端錯誤，若有具體訊息則顯示，否則顯示通用訊息
      return error.errorData?.message || error.errorData?.detail || `發生客戶端錯誤 (${error.statusCode || ''})，請檢查您的請求`;
    case ApiErrorType.UNKNOWN:
    default:
      return '發生未知錯誤，請稍後再試';
  }
}

// --- 錯誤類型推斷與解析 ---
/**
 * 從 HTTP 狀態碼推斷錯誤類型
 */
export function getErrorTypeFromStatus(statusCode: number): ApiErrorType {
  if (statusCode === 400) return ApiErrorType.VALIDATION;
  if (statusCode === 401) return ApiErrorType.AUTHENTICATION;
  if (statusCode === 403) return ApiErrorType.AUTHORIZATION;
  if (statusCode === 404) return ApiErrorType.NOT_FOUND;
  if (statusCode === 429) return ApiErrorType.RATE_LIMIT;
  if (statusCode >= 500 && statusCode < 600) return ApiErrorType.SERVER;
  if (statusCode >= 400 && statusCode < 500) return ApiErrorType.CLIENT_ERROR; // 泛指其他 4xx 錯誤
  return ApiErrorType.UNKNOWN;
}

/**
 * 同步解析原始錯誤物件並轉換為 ApiError。
 * 此函數是同步的，主要用於處理非 HTTP Response 類型的錯誤 (例如 JavaScript 錯誤、Fetch 網路錯誤)。
 * 對於 HTTP Response 錯誤，其 JSON 內容的異步解析應在調用此函數前完成。
 *
 * @param error 原始錯誤物件 (例如 Error, TypeError 等)
 * @param logger 用於日誌記錄的 Logger 實例
 */
export function parseError(
  error: unknown,
  logger: Logger = consoleLogger
): ApiError {
  // 已經是 ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Fetch 網路錯誤 (例如網路斷線、CORS 錯誤，通常是 TypeError)
  // 檢查錯誤訊息中是否包含與網路請求相關的關鍵字
  if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network request'))) {
    logger.error('Parsing fetch network error:', error);
    return new ApiError(
      'Network request failed',
      ApiErrorType.NETWORK,
      { originalError: error }
    );
  }

  // 一般 Error (包括 AbortError for timeout)
  if (error instanceof Error) {
    // 超時錯誤 (Fetch API 的 AbortController 會拋出 AbortError)
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new ApiError(
        'Request timeout',
        ApiErrorType.TIMEOUT,
        { originalError: error }
      );
    }
    // 其他 JavaScript 錯誤
    logger.error('Parsing generic JavaScript error:', error);
    return new ApiError(
      error.message,
      ApiErrorType.UNKNOWN,
      { originalError: error }
    );
  }

  // 未知錯誤類型，將其轉換為字符串作為訊息
  logger.error('Parsing unknown error type:', error);
  return new ApiError(
    String(error),
    ApiErrorType.UNKNOWN,
    { originalError: error }
  );
}

// --- 重試機制 ---
export interface RetryConfig {
  maxRetries: number; // 最大重試次數
  baseDelay: number; // 基礎延遲 (毫秒)
  maxDelay: number;  // 最大延遲 (毫秒)，防止無限增長
  backoffMultiplier: number; // 指數退避乘數
  shouldRetry?: (error: ApiError, attempt: number) => boolean; // 允許自定義重試判斷邏輯
  logger?: Logger; // 注入日誌器
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 秒
  maxDelay: 10000, // 10 秒
  backoffMultiplier: 2,
  logger: consoleLogger, // 預設使用 consoleLogger
};

/**
 * 計算指數退避延遲時間，並加入隨機 jitter。
 * @param attempt 當前重試次數 (從 1 開始)
 * @param config 重試配置
 * @returns 計算出的延遲時間 (毫秒)
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delayTime = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  // 加入隨機 jitter (0% 到 30% 的隨機抖動) 避免多個客戶端同時重試
  const jitter = Math.random() * 0.3 * delayTime;
  return Math.min(delayTime + jitter, config.maxDelay);
}

/**
 * 延遲函數，返回一個在指定毫秒數後解決的 Promise。
 * @param ms 延遲時間 (毫秒)
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 帶重試機制的異步操作包裝器。
 * @param operation 嘗試執行的異步操作函數
 * @param config 重試配置，可部分覆寫預設配置
 * @returns 異步操作成功後的結果
 * @throws ApiError 如果所有重試嘗試都失敗
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const logger = finalConfig.logger!; // 確保 logger 總會有值，因為有 default 配置
  let lastError: ApiError | null = null;

  // 循環重試，總嘗試次數為 maxRetries + 1 (第一次嘗試 + maxRetries 次重試)
  for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // 將捕獲到的錯誤解析為 ApiError。這裡的 parseError 是同步的。
      lastError = parseError(error, logger);

      // 判斷是否應該重試：
      // 優先使用自定義的 `shouldRetry` 函數，如果未提供，則使用 `ApiError` 實例內建的 `isRetryable` 屬性。
      const shouldRetry =
        finalConfig.shouldRetry?.(lastError, attempt) ?? lastError.isRetryable;

      // 如果還未達到最大重試次數且錯誤是可重試的
      if (attempt <= finalConfig.maxRetries && shouldRetry) {
        const waitTime = calculateBackoffDelay(attempt, finalConfig);
        logger.warn(
          `API 請求失敗 (第 ${attempt} 次嘗試, 錯誤類型: ${lastError.type})，將在 ${waitTime.toFixed(0)}ms 後重試:`,
          lastError.message,
          lastError.errorData || lastError.originalError // 包含詳細錯誤資料供日誌記錄
        );
        await delay(waitTime); // 等待一段時間後再次嘗試
      } else {
        // 已達到最大重試次數或錯誤不可重試，終止循環
        logger.error(
          `API 請求最終失敗 (總嘗試 ${attempt} 次, 錯誤類型: ${lastError.type}):`,
          lastError.message,
          lastError.errorData || lastError.originalError
        );
        break;
      }
    }
  }

  // 如果所有重試都失敗，拋出最後一個捕獲到的 ApiError
  throw lastError || new ApiError('Unknown error after all retries', ApiErrorType.UNKNOWN);
}

// --- 超時包裝器 ---
/**
 * 為一個 Promise 操作添加超時限制。
 * @param promise 原始的 Promise 操作
 * @param timeoutMs 超時時間 (毫秒)
 * @returns 如果原始 Promise 在超時前完成，則返回其結果；否則拋出 ApiError.TIMEOUT
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id); // 清除自身的計時器
      reject(new ApiError(
        `Request timeout after ${timeoutMs}ms`,
        ApiErrorType.TIMEOUT
      ));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// --- API 請求封裝 ---
/**
 * 自定義錯誤解析函數的簽名 (針對 HTTP Response 物件)。
 * 此函數在 `apiRequest` 中用於解析非 2xx 響應的 JSON 錯誤體。
 * @param response 原始的 HTTP Response 物件
 * @param errorBody 已解析的 JSON 錯誤體 (如果無法解析則為 `null`)
 * @param originalError 原始的 `Response` 物件
 * @returns 包含訊息、類型、可重試標誌和詳細錯誤數據的物件
 */
export type CustomErrorParser = (
  response: Response,
  errorBody: any | null,
  originalError: unknown
) => { message: string; type: ApiErrorType; isRetryable?: boolean; errorData?: any };

export interface ApiRequestConfig {
  timeout?: number; // 請求超時時間 (毫秒)
  retry?: Partial<RetryConfig>; // 重試配置
  logger?: Logger; // 注入日誌器
  customErrorParser?: CustomErrorParser; // 允許自定義 HTTP 錯誤響應的解析邏輯
}

/**
 * 通用的 API 請求封裝函數，包含錯誤處理、重試機制和超時控制。
 * 支援 Fetch API，並將所有錯誤轉換為標準的 `ApiError` 類型。
 *
 * @param url 請求的 URL
 * @param options `fetch` API 的 `RequestInit` 選項
 * @param config 額外的配置，包含 `timeout`, `retry`, `logger`, `customErrorParser`
 * @returns Promise<T>，其中 T 是預期的響應數據類型
 * @throws ApiError 如果請求最終失敗
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  config: ApiRequestConfig = {}
): Promise<T> {
  const { timeout = 33000, retry, logger = consoleLogger, customErrorParser } = config;

  // 使用 withRetry 包裝實際的 fetch 操作
  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout); // 設定 AbortController 的超時

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal, // 將 AbortController 的 signal 傳遞給 fetch
        headers: {
          'Content-Type': 'application/json', // 預設為 JSON 格式
          'Accept': 'application/json', // 期望接收 JSON 響應
          ...options.headers,
        },
      });

      // 如果響應狀態碼不是 2xx，則認為是錯誤
      if (!response.ok) {
        let errorData: any = null;
        try {
          // 嘗試解析錯誤響應體為 JSON
          errorData = await response.json();
        } catch (jsonError) {
          logger.warn('Failed to parse error response JSON:', jsonError, response);
          // 如果無法解析 JSON，則使用狀態文本作為錯誤訊息
          errorData = { message: response.statusText || `HTTP error ${response.status}` };
        }

        let apiErrorToThrow: ApiError;
        if (customErrorParser) {
          try {
            // 嘗試使用自定義解析器
            const parsed = customErrorParser(response, errorData, response);
            apiErrorToThrow = new ApiError(parsed.message, parsed.type, {
              statusCode: response.status,
              originalError: response,
              isRetryable: parsed.isRetryable,
              errorData: parsed.errorData || errorData,
            });
          } catch (parserError) {
            logger.error('Custom error parser failed:', parserError);
            // 自定義解析器失敗時，回退到預設解析邏輯
            apiErrorToThrow = new ApiError(
              errorData.message || errorData.detail || response.statusText || `HTTP ${response.status} Error`,
              getErrorTypeFromStatus(response.status),
              { statusCode: response.status, originalError: response, errorData }
            );
          }
        } else {
          // 預設解析邏輯
          apiErrorToThrow = new ApiError(
            errorData.message || errorData.detail || response.statusText || `HTTP ${response.status} Error`,
            getErrorTypeFromStatus(response.status),
            { statusCode: response.status, originalError: response, errorData }
          );
        }
        throw apiErrorToThrow; // 拋出解析後的 ApiError
      }

      // 處理成功的響應
      // 如果響應是 204 No Content，則返回 undefined 而不是嘗試解析 JSON
      if (response.status === 204) {
          return undefined as T; // 假設 T 可以是 undefined 或允許空響應
      }

      // 嘗試解析 JSON 響應體
      try {
          return await response.json();
      } catch (jsonParseError) {
          logger.warn('Failed to parse successful response as JSON, returning text:', jsonParseError, response);
          // 成功的 API 響應通常是 JSON，如果解析失敗，這是一個潛在問題，應拋出錯誤。
          throw new ApiError(
              'Failed to parse API response as JSON',
              ApiErrorType.UNKNOWN,
              { originalError: jsonParseError, statusCode: response.status }
          );
      }
    } finally {
      clearTimeout(timeoutId); // 無論成功或失敗，都清除超時計時器
    }
  }, { ...retry, logger }); // 將 logger 傳遞給 withRetry
}

// --- React Hook 用的錯誤狀態類型與創建函數 ---
export interface ApiErrorState {
  error: ApiError | null;
  isError: boolean;
  errorMessage: string; // 使用解耦的 `getUserFriendlyErrorMessage` 產生
  errorType: ApiErrorType | null;
  statusCode: number | null; // 錯誤的 HTTP 狀態碼
  errorDetail: any; // 錯誤的詳細數據 (例如後端返回的 JSON 錯誤體或原始錯誤對象)
  clear: () => void; // 清除錯誤狀態的函數
}

/**
 * 創建錯誤狀態物件，供 React Hook 或 UI 層使用。
 * 將原始錯誤轉換為標準的 `ApiError`，並提供使用者友善的訊息。
 *
 * @param error 原始錯誤物件 (通常是一個 `Error` 或 `ApiError` 實例，不應是原始 `Response` 物件)
 * @param clearFn 清除錯誤狀態的函數
 * @param logger 用於日誌記錄的 Logger 實例
 * @returns `ApiErrorState` 物件
 */
export function createErrorState(
  error: unknown | null,
  clearFn: () => void,
  logger: Logger = consoleLogger
): ApiErrorState {
  // `parseError` 在此處應被視為同步函數，它處理除 `Response` 物件以外的所有錯誤。
  // `apiRequest` 已經確保將 `Response` 物件預處理為 `ApiError` 再拋出。
  const apiError = error ? parseError(error, logger) : null;

  return {
    error: apiError,
    isError: !!apiError,
    errorMessage: apiError ? getUserFriendlyErrorMessage(apiError) : '',
    errorType: apiError?.type || null,
    statusCode: apiError?.statusCode || null,
    errorDetail: apiError?.errorData || apiError?.originalError || null, // 優先顯示 errorData
    clear: clearFn,
  };
}