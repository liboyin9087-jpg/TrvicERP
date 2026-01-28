/**
 * 行程產品管理服務層
 * Tour Product Management Service Layer
 */

import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Tour,
  PublicTourData,
  CreateTourData,
  UpdateTourData,
  TourQuery,
} from '../../../core/types/tour';

/**
 * 定義服務層統一錯誤格式
 */
export class ServiceError extends Error {
  public readonly statusCode: number;
  public readonly originalError: any;

  constructor(message: string, statusCode: number = 500, originalError: any = null) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.originalError = originalError;

    // Set the prototype explicitly to ensure `instanceof` works correctly
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

/**
 * 內部通用的 API 響應介面，反映 `api` 客戶端的行為
 */
interface ApiResponse<T> {
  data: T | null;
  error: any; // 原始 API 客戶端錯誤結構
}

/**
 * 抽象 HTTP 客戶端介面，用於依賴注入
 * 假設 api 模組提供 get, post, patch, delete 方法
 * 且這些方法接受一個 options 物件，其中包含 AbortSignal
 */
interface HttpClient {
  get<T>(url: string, options?: { signal?: AbortSignal }): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: any, options?: { signal?: AbortSignal }): Promise<ApiResponse<T>>;
  patch<T>(url: string, data?: any, options?: { signal?: AbortSignal }): Promise<ApiResponse<T>>;
  delete<T>(url: string, options?: { signal?: AbortSignal }): Promise<ApiResponse<T>>;
}

/**
 * 輔助函式：建構 URL 查詢參數
 * 將查詢物件轉換為 URLSearchParams 字串，並處理陣列值和數字轉換
 */
function buildQueryParams<T extends Record<string, any>>(query?: T): URLSearchParams {
  const params = new URLSearchParams();
  if (!query) return params;

  for (const key in query) {
    // 確保只處理物件自身的屬性，而非原型鏈上的屬性
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      const value = query[key];
      // 忽略 undefined, null, 或空字串
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else if (typeof value === 'object') {
          // 對於非陣列的物件，可以選擇 JSON.stringify 或忽略
          // 根據 TourQuery 的定義，這裡不會出現複雜物件，直接轉字串即可
          params.append(key, String(value));
        } else {
          params.append(key, String(value));
        }
      }
    }
  }
  return params;
}

/**
 * 定義 TourService 的介面，用於依賴注入和測試
 */
export interface ITourService {
  getTours(query?: TourQuery, signal?: AbortSignal): Promise<Tour[]>;
  getTour(id: string, signal?: AbortSignal): Promise<Tour>;
  createTour(data: CreateTourData, signal?: AbortSignal): Promise<Tour>;
  updateTour(id: string, data: UpdateTourData, signal?: AbortSignal): Promise<Tour>;
  deleteTour(id: string, signal?: AbortSignal): Promise<void>;
  getPublicTour(shareToken: string, signal?: AbortSignal): Promise<PublicTourData>;
  cloneTour(id: string, newCode?: string, signal?: AbortSignal): Promise<Tour>;
  searchTours(keyword: string, signal?: AbortSignal): Promise<Tour[]>;
}

/**
 * 行程產品服務
 */
export class TourService implements ITourService {
  private httpClient: HttpClient;

  /**
   * 構造函數，允許注入 HTTP 客戶端
   * @param httpClient 處理 API 請求的客戶端，默認為全局的 `api` 實例
   */
  constructor(httpClient: HttpClient = api) {
    this.httpClient = httpClient;
  }

  /**
   * 統一處理 API 響應並拋出 ServiceError
   */
  private async handleApiResponse<T>(
    promise: Promise<ApiResponse<T>>,
    errorMessage: string = '操作失敗'
  ): Promise<T> {
    try {
      const result = await promise;
      if (result.error) {
        throw new ServiceError(
          result.error.message || errorMessage,
          result.error.statusCode || 500,
          result.error
        );
      }
      if (result.data === null || result.data === undefined) {
        // 對於 delete 等操作，data 可能為 null，但仍視為成功
        // 如果是期望有 data 但沒有，則拋出錯誤
        if (errorMessage.includes('刪除')) return undefined as T; // For delete, return void
        throw new ServiceError(errorMessage, 404, { message: 'Data not found after successful request.' });
      }
      return result.data;
    } catch (error: any) {
      if (error instanceof ServiceError) {
        throw error; // 如果已經是 ServiceError，直接拋出
      }
      // 處理網路錯誤、請求取消等情況
      let statusCode = 500;
      let message = errorMessage;
      if (error.name === 'AbortError') {
        statusCode = 499; // Client Closed Request
        message = '請求已取消';
      } else if (error.response?.status) {
        statusCode = error.response.status;
        message = error.response.data?.message || errorMessage;
      } else if (error.message) {
        message = error.message;
      }
      throw new ServiceError(message, statusCode, error);
    }
  }

  /**
   * 取得行程列表
   */
  async getTours(query?: TourQuery, signal?: AbortSignal): Promise<Tour[]> {
    const params = buildQueryParams(query);
    const endpoint = `${API_ENDPOINTS.tours.list}?${params.toString()}`;
    return this.handleApiResponse(
      this.httpClient.get<Tour[]>(endpoint, { signal }),
      '取得行程列表失敗'
    );
  }

  /**
   * 取得單一行程
   */
  async getTour(id: string, signal?: AbortSignal): Promise<Tour> {
    return this.handleApiResponse(
      this.httpClient.get<Tour>(API_ENDPOINTS.tours.detail(id), { signal }),
      '取得單一行程失敗'
    );
  }

  /**
   * 建立行程
   */
  async createTour(data: CreateTourData, signal?: AbortSignal): Promise<Tour> {
    return this.handleApiResponse(
      this.httpClient.post<Tour>(API_ENDPOINTS.tours.create, data, { signal }),
      '建立行程失敗'
    );
  }

  /**
   * 更新行程
   */
  async updateTour(id: string, data: UpdateTourData, signal?: AbortSignal): Promise<Tour> {
    return this.handleApiResponse(
      this.httpClient.patch<Tour>(API_ENDPOINTS.tours.update(id), data, { signal }),
      '更新行程失敗'
    );
  }

  /**
   * 刪除行程
   * 成功時返回 void
   */
  async deleteTour(id: string, signal?: AbortSignal): Promise<void> {
    return this.handleApiResponse(
      this.httpClient.delete<null>(API_ENDPOINTS.tours.delete(id), { signal }),
      '刪除行程失敗'
    );
  }

  /**
   * 取得公開行程資料（分享用）
   */
  async getPublicTour(shareToken: string, signal?: AbortSignal): Promise<PublicTourData> {
    return this.handleApiResponse(
      this.httpClient.get<PublicTourData>(`${API_ENDPOINTS.tours.list}/public/${shareToken}`, {
        signal,
      }),
      '取得公開行程資料失敗'
    );
  }

  /**
   * 複製行程
   */
  async cloneTour(id: string, newCode?: string, signal?: AbortSignal): Promise<Tour> {
    return this.handleApiResponse(
      this.httpClient.post<Tour>(`${API_ENDPOINTS.tours.detail(id)}/clone`, { newCode }, { signal }),
      '複製行程失敗'
    );
  }

  /**
   * 搜尋行程
   */
  async searchTours(keyword: string, signal?: AbortSignal): Promise<Tour[]> {
    // 內部呼叫 getTours 已經處理了參數建構
    return this.getTours({ search: keyword, status: 'active', limit: 20 }, signal);
  }
}

// 導出一個 TourService 的單例實例，方便在應用中使用
const tourService = new TourService(api);
export default tourService;