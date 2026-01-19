import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Order,
  CreateOrderData,
  UpdateOrderData,
  CancelOrderData,
  OrderQuery,
  OrderStatus,
} from '../../../core/types/order';
import { isValidOrderTransition } from '../../../core/types/order';
import { ApiError } from '../../../core/types/api';

interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

/**
 * 訂單服務
 */
export class OrderService {
  /**
   * 取得訂單列表
   */
  static async getOrders(query?: OrderQuery): Promise<ApiResponse<Order[]>> {
    const params = new URLSearchParams();
    if (query?.status) {
      if (Array.isArray(query.status)) {
        params.append('status', query.status.join(','));
      } else {
        params.append('status', query.status);
      }
    }
    if (query?.customerId) params.append('customerId', query.customerId);
    if (query?.sessionId) params.append('sessionId', query.sessionId);
    if (query?.dateFrom) params.append('dateFrom', query.dateFrom);
    if (query?.dateTo) params.append('dateTo', query.dateTo);
    if (query?.minAmount) params.append('minAmount', query.minAmount.toString());
    if (query?.maxAmount) params.append('maxAmount', query.maxAmount.toString());
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());

    const endpoint = `${API_ENDPOINTS.orders.list}?${params.toString()}`;
    return api.get<Order[]>(endpoint);
  }

  /**
   * 取得單一訂單
   */
  static async getOrder(id: string): Promise<ApiResponse<Order>> {
    return api.get<Order>(API_ENDPOINTS.orders.detail(id));
  }

  /**
   * 建立訂單
   */
  static async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    return api.post<Order>(API_ENDPOINTS.orders.create, data);
  }

  /**
   * 更新訂單
   */
  static async updateOrder(
    id: string,
    data: UpdateOrderData
  ): Promise<ApiResponse<Order>> {
    if (data.status) {
      const currentOrder = await this.getOrder(id);
      if (currentOrder.error) {
        return currentOrder;
      }
      if (currentOrder.data) {
        const isValid = isValidOrderTransition(
          currentOrder.data.status,
          data.status
        );
        if (!isValid) {
          return {
            data: null,
            error: {
              code: 'INVALID_TRANSITION',
              message: `無法從 ${currentOrder.data.status} 轉換到 ${data.status}`,
            },
          };
        }
      }
    }

    return api.patch<Order>(API_ENDPOINTS.orders.update(id), data);
  }

  /**
   * 取消訂單
   */
  static async cancelOrder(
    id: string,
    data: CancelOrderData
  ): Promise<ApiResponse<Order>> {
    return api.post<Order>(API_ENDPOINTS.orders.cancel(id), data);
  }

  /**
   * 退款訂單
   */
  static async refundOrder(
    id: string,
    refundAmount?: number
  ): Promise<ApiResponse<Order>> {
    return api.post<Order>(API_ENDPOINTS.orders.refund(id), {
      refundAmount,
    });
  }

  /**
   * 刪除訂單
   */
  static async deleteOrder(id: string): Promise<ApiResponse<null>> {
    return api.delete(API_ENDPOINTS.orders.delete(id));
  }

  /**
   * 將報價轉換為訂單
   */
  static async convertQuotationToOrder(
    quotationId: string,
    orderNumber?: string
  ): Promise<ApiResponse<Order>> {
    const quotationEndpoint = API_ENDPOINTS.quotations.convert(quotationId);
    const result = await api.post<{ orderId: string }>(quotationEndpoint, {
      orderNumber,
    });

    if (result.error || !result.data) {
      return {
        data: null,
        error: result.error || {
          code: 'CONVERSION_FAILED',
          message: '報價轉換為訂單失敗'
        }
      };
    }

    return this.getOrder(result.data.orderId);
  }
}

export default OrderService;