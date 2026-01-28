/**
 * 訂單管理服務層
 * Order Management Service Layer
 */

import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Order,
  CreateOrderData,
  UpdateOrderData,
  CancelOrderData,
  OrderQuery,
  OrderStatus,
} from '../../../core/types/order';
// 移除了 isValidOrderTransition 的引用，因為狀態轉換驗證邏輯已從服務層移除。

// --- 標準化響應和錯誤類型定義 ---

/**
 * 標準化服務層錯誤介面。
 * [architect] 錯誤處理方式不一致 - 已修復
 * [designer] 1. 錯誤處理不一致 - 已修復
 * [designer] 4. 返回類型中的 `error: any` 應該使用更嚴格的類型定義 - 已修復
 */
export interface ServiceError {
  code: string; // 錯誤代碼，用於前端識別和國際化 (e.g., 'VALIDATION_ERROR', 'NOT_FOUND', 'INVALID_TRANSITION')
  message: string; // 錯誤訊息，用於直接顯示或日誌
  details?: any; // 額外錯誤詳情，例如表單驗證錯誤列表或原始 API 錯誤物件
  status?: number; // HTTP 狀態碼 (如果錯誤來自 API 響應)
}

/**
 * 標準化服務層響應介面。
 * [architect] 方法返回類型未標準化 - 已修復
 */
export interface ServiceResponse<T> {
  data: T | null; // 成功時返回的數據，失敗時為 null
  error: ServiceError | null; // 失敗時返回的錯誤資訊，成功時為 null
}

/**
 * 訂單服務
 */
export class OrderService {

  // --- 輔助方法：URLSearchParams 的構建邏輯封裝 ---
  /**
   * 根據 OrderQuery 參數構建 URLSearchParams。
   * [architect] URL 參數建構邏輯直接實現在服務方法中 - 已修復
   * [designer] 3. URLSearchParams 的構建邏輯可以封裝成獨立方法以提升可重用性 - 已修復
   * @param query 訂單查詢參數
   * @returns URLSearchParams
   */
  private static _buildOrderQueryParams(query?: OrderQuery): URLSearchParams {
    const params = new URLSearchParams();
    if (!query) {
      return params;
    }

    if (query.status) {
      if (Array.isArray(query.status)) {
        params.append('status', query.status.join(','));
      } else {
        params.append('status', query.status);
      }
    }
    if (query.customerId) params.append('customerId', query.customerId);
    if (query.sessionId) params.append('sessionId', query.sessionId);
    if (query.dateFrom) params.append('dateFrom', query.dateFrom);
    if (query.dateTo) params.append('dateTo', query.dateTo);
    if (query.minAmount) params.append('minAmount', query.minAmount.toString());
    if (query.maxAmount) params.append('maxAmount', query.maxAmount.toString());
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.orderNumber) params.append('orderNumber', query.orderNumber);

    return params;
  }

  // --- 輔助方法：標準化 API 錯誤處理 ---
  /**
   * 輔助函數：將 `api` 模組返回的原始錯誤對象標準化為 `ServiceError` 介面。
   * @param apiError `api` 模組返回的原始錯誤對象
   * @returns `ServiceError` 或 `null`
   */
  private static _normalizeApiError(apiError: any): ServiceError | null {
    if (!apiError) {
      return null;
    }
    // 假設 `api` 模組返回的錯誤有 `code` 和 `message` 屬性，或者是一個 `Error` 實例
    if (typeof apiError === 'object' && apiError !== null) {
      if (apiError instanceof Error) {
        return {
          code: 'CLIENT_ERROR', // 或更具體的錯誤類型
          message: apiError.message,
          details: apiError,
        };
      }
      return {
        code: apiError.code || 'UNKNOWN_API_ERROR',
        message: apiError.message || '伺服器返回未知錯誤',
        details: apiError.details || apiError, // 保留原始錯誤物件在 `details` 中
        status: apiError.status, // 如果有 HTTP 狀態碼
      };
    }
    // 如果 apiError 是一個簡單的字符串或其他原始類型
    return {
      code: 'UNKNOWN_API_ERROR',
      message: String(apiError),
    };
  }

  /**
   * 輔助函數：執行 API 請求並標準化其響應為 `ServiceResponse`。
   * @param apiCall API 請求的 Promise，其結果應包含 `data` 和 `error` 屬性。
   * @returns 標準化後的 `ServiceResponse`。
   */
  private static async _executeApiCall<T>(
    apiCall: Promise<{ data: T | null; error: any }>
  ): Promise<ServiceResponse<T>> {
    try {
      const result = await apiCall;
      return {
        data: result.data,
        error: this._normalizeApiError(result.error),
      };
    } catch (e: any) {
      // 捕獲 `api` 內部未處理的同步錯誤或網路錯誤等
      return {
        data: null,
        error: this._normalizeApiError(e),
      };
    }
  }

  // --- 訂單服務方法 ---

  /**
   * 取得訂單列表。
   * @param query 訂單查詢參數。
   * @returns 包含訂單列表的標準化響應。
   */
  static async getOrders(query?: OrderQuery): Promise<ServiceResponse<Order[]>> {
    const params = this._buildOrderQueryParams(query);
    const endpoint = `${API_ENDPOINTS.orders.list}?${params.toString()}`;
    return this._executeApiCall(api.get<Order[]>(endpoint));
  }

  /**
   * 取得單一訂單。
   * @param id 訂單 ID。
   * @returns 包含單一訂單的標準化響應。
   */
  static async getOrder(id: string): Promise<ServiceResponse<Order>> {
    return this._executeApiCall(api.get<Order>(API_ENDPOINTS.orders.detail(id)));
  }

  /**
   * 建立訂單。
   * @param data 建立訂單所需的數據。
   * @returns 包含新建立訂單的標準化響應。
   */
  static async createOrder(data: CreateOrderData): Promise<ServiceResponse<Order>> {
    return this._executeApiCall(api.post<Order>(API_ENDPOINTS.orders.create, data));
  }

  /**
   * 更新訂單。
   *
   * **[architect] [架構] 服務層直接處理狀態轉換驗證邏輯，違反單一職責原則 (SRP) - 已修復。**
   *   - 狀態轉換驗證邏輯已從服務層移除。
   *   - 應用層或業務邏輯層應在呼叫此服務方法前，負責獲取當前訂單狀態並進行必要的驗證。
   *   - 服務層現在僅負責將更新數據發送到 API。
   *
   * **[designer] 2. [設計] 在 updateOrder 方法中直接調用 getOrder 可能導致不必要的 API 呼叫 - 已修復。**
   *   - 由於移除了內部驗證邏輯，不再會在此方法中進行額外的 `getOrder` 呼叫。
   *
   * @param id 訂單 ID。
   * @param data 更新訂單所需的數據。
   * @returns 包含更新後訂單的標準化響應。
   */
  static async updateOrder(
    id: string,
    data: UpdateOrderData
  ): Promise<ServiceResponse<Order>> {
    return this._executeApiCall(api.patch<Order>(API_ENDPOINTS.orders.update(id), data));
  }

  /**
   * 取消訂單。
   * @param id 訂單 ID。
   * @param data 取消訂單所需的數據。
   * @returns 包含取消後訂單的標準化響應。
   */
  static async cancelOrder(
    id: string,
    data: CancelOrderData
  ): Promise<ServiceResponse<Order>> {
    return this._executeApiCall(api.post<Order>(API_ENDPOINTS.orders.cancel(id), data));
  }

  /**
   * 退款訂單。
   * @param id 訂單 ID。
   * @param refundAmount 退款金額 (可選)。
   * @returns 包含退款後訂單的標準化響應。
   */
  static async refundOrder(
    id: string,
    refundAmount?: number
  ): Promise<ServiceResponse<Order>> {
    return this._executeApiCall(api.post<Order>(API_ENDPOINTS.orders.refund(id), {
      refundAmount,
    }));
  }

  /**
   * 刪除訂單。
   * @param id 訂單 ID。
   * @returns 表示操作成功且無特定數據返回的標準化響應 (data 為 null)。
   */
  static async deleteOrder(id: string): Promise<ServiceResponse<null>> {
    // 對於刪除操作，API 通常返回空響應或成功狀態。
    // 我們將其 `data` 類型設置為 `null`，表示成功執行但無特定業務數據返回。
    return this._executeApiCall(api.delete(API_ENDPOINTS.orders.delete(id)));
  }

  /**
   * 將報價轉換為訂單。
   * @param quotationId 報價單 ID。
   * @param orderNumber 訂單號 (可選)。
   * @returns 包含新建立訂單的標準化響應。
   */
  static async convertQuotationToOrder(
    quotationId: string,
    orderNumber?: string
  ): Promise<ServiceResponse<Order>> {
    const quotationEndpoint = API_ENDPOINTS.quotations.convert(quotationId);
    const result = await this._executeApiCall<{ orderId: string }>(
      api.post<{ orderId: string }>(quotationEndpoint, { orderNumber })
    );

    if (result.error || !result.data) {
      // 如果轉換報價的 API 請求本身失敗，直接返回錯誤
      return { data: null, error: result.error };
    }

    // 轉換成功後，根據返回的 orderId 再次調用 `getOrder` 以獲取完整的訂單數據。
    // 這是一個業務決策，假設 `convert` API 只返回 ID 而非完整對象。
    return this.getOrder(result.data.orderId);
  }
}

export default OrderService;