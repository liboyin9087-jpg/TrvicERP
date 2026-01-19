/**
 * API 攔截器系統
 * API Interceptor System
 */

import type { ApiResponse, ApiError } from '@/lib/api';
import { auditLogger } from './auditLogger';
import { AuthService } from '../services/authService';

/**
 * 請求攔截器類型
 */
export type RequestInterceptor = (
  endpoint: string,
  options: RequestInit
) => Promise<[string, RequestInit]> | [string, RequestInit];

/**
 * 回應攔截器類型
 */
export type ResponseInterceptor<T = any> = (
  response: ApiResponse<T>
) => Promise<ApiResponse<T>> | ApiResponse<T>;

/**
 * 錯誤攔截器類型
 */
export type ErrorInterceptor = (error: ApiError) => void | Promise<void>;

/**
 * API 攔截器管理器
 */
class ApiInterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  /**
   * 註冊請求攔截器
   */
  useRequest(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * 註冊回應攔截器
   */
  useResponse<T = any>(interceptor: ResponseInterceptor<T>): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * 註冊錯誤攔截器
   */
  useError(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.errorInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * 執行請求攔截器
   */
  async executeRequestInterceptors(
    endpoint: string,
    options: RequestInit
  ): Promise<[string, RequestInit]> {
    let currentEndpoint = endpoint;
    let currentOptions = options;

    for (const interceptor of this.requestInterceptors) {
      [currentEndpoint, currentOptions] = await interceptor(
        currentEndpoint,
        currentOptions
      );
    }

    return [currentEndpoint, currentOptions];
  }

  /**
   * 執行回應攔截器
   */
  async executeResponseInterceptors<T>(
    response: ApiResponse<T>
  ): Promise<ApiResponse<T>> {
    let currentResponse = response;

    for (const interceptor of this.responseInterceptors) {
      currentResponse = await interceptor(currentResponse);
    }

    return currentResponse;
  }

  /**
   * 執行錯誤攔截器
   */
  async executeErrorInterceptors(error: ApiError): Promise<void> {
    for (const interceptor of this.errorInterceptors) {
      await interceptor(error);
    }
  }

  /**
   * 清除所有攔截器
   */
  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
  }
}

// 單例實例
export const apiInterceptor = new ApiInterceptorManager();

// 預設攔截器：自動刷新 Token
apiInterceptor.useResponse(async (response) => {
  if (response.error?.statusCode === 401) {
    // 嘗試刷新 token
    const refreshed = await AuthService.refreshToken();
    if (refreshed) {
      // Token 刷新成功，可以重試請求（這裡只是記錄，實際重試需要在調用層實現）
      console.log('Token refreshed, request can be retried');
    } else {
      // Token 刷新失敗，清除認證資訊
      await AuthService.logout();
    }
  }
  return response;
});

// 預設攔截器：記錄 API 錯誤
apiInterceptor.useError((error) => {
  // 記錄到審計日誌
  auditLogger.log('VIEW', 'api_error', {
    details: {
      code: error.code,
      message: error.message,
      endpoint: error.endpoint,
      method: error.method,
    },
    success: false,
    errorMessage: error.message,
  });
});

// 預設攔截器：請求日誌（開發環境）
if (import.meta.env.DEV) {
  apiInterceptor.useRequest(async (endpoint, options) => {
    console.log(`[API Request] ${options.method || 'GET'} ${endpoint}`, options);
    return [endpoint, options];
  });

  apiInterceptor.useResponse(async (response) => {
    if (response.error) {
      console.error('[API Error]', response.error);
    } else {
      console.log('[API Success]', response.data);
    }
    return response;
  });
}
