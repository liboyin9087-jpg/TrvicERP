/**
 * 報價管理服務層
 * Quotation Management Service Layer
 */

import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Quotation,
  CreateQuotationData,
  UpdateQuotationData,
  ConvertQuotationToOrderData,
  QuotationItem,
} from '../../../core/types/quotation';
import {
  calculateQuotationCost,
  calculateSellingPrice,
  isQuotationExpired,
} from '../../../core/types/quotation';

/**
 * 報價服務
 */
export class QuotationService {
  /**
   * 取得報價列表
   */
  static async getQuotations(params?: {
    customerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Quotation[] | null;
    error: any;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `${API_ENDPOINTS.quotations.list}?${queryParams.toString()}`;
    return api.get<Quotation[]>(endpoint);
  }

  /**
   * 取得單一報價
   */
  static async getQuotation(id: string): Promise<{
    data: Quotation | null;
    error: any;
  }> {
    return api.get<Quotation>(API_ENDPOINTS.quotations.detail(id));
  }

  /**
   * 建立報價
   */
  static async createQuotation(
    data: CreateQuotationData
  ): Promise<{
    data: Quotation | null;
    error: any;
  }> {
    // 計算成本
    const costBreakdown = calculateQuotationCost(data.items, data.paxCount);
    const totalCost = costBreakdown.total;
    const sellingPrice = calculateSellingPrice(totalCost, data.profitMargin);

    // 計算有效期限
    const validDays = data.validDays || 30;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const quotationData = {
      ...data,
      costBreakdown,
      sellingPrice,
      totalAmount: sellingPrice * data.paxCount,
      validUntil: validUntil.toISOString(),
      currency: data.currency || 'TWD',
    };

    return api.post<Quotation>(
      API_ENDPOINTS.quotations.create,
      quotationData
    );
  }

  /**
   * 更新報價
   */
  static async updateQuotation(
    id: string,
    data: UpdateQuotationData
  ): Promise<{
    data: Quotation | null;
    error: any;
  }> {
    // 如果更新項目或人數，需要重新計算
    if (data.items || data.paxCount || data.profitMargin) {
      const currentQuotation = await this.getQuotation(id);
      if (currentQuotation.error || !currentQuotation.data) {
        return currentQuotation;
      }

      const items = data.items || currentQuotation.data.items;
      const paxCount = data.paxCount || currentQuotation.data.paxCount;
      const profitMargin =
        data.profitMargin ?? currentQuotation.data.profitMargin;

      const costBreakdown = calculateQuotationCost(items, paxCount);
      const sellingPrice = calculateSellingPrice(
        costBreakdown.total,
        profitMargin
      );

      data = {
        ...data,
        costBreakdown,
        sellingPrice,
        totalAmount: sellingPrice * paxCount,
      };
    }

    return api.patch<Quotation>(API_ENDPOINTS.quotations.update(id), data);
  }

  /**
   * 刪除報價
   */
  static async deleteQuotation(id: string): Promise<{
    data: null;
    error: any;
  }> {
    return api.delete(API_ENDPOINTS.quotations.delete(id));
  }

  /**
   * 將報價轉換為訂單
   */
  static async convertToOrder(
    id: string,
    convertData?: ConvertQuotationToOrderData
  ): Promise<{
    data: { orderId: string } | null;
    error: any;
  }> {
    // 檢查報價是否過期
    const quotation = await this.getQuotation(id);
    if (quotation.error || !quotation.data) {
      return quotation as any;
    }

    if (isQuotationExpired(quotation.data.validUntil)) {
      return {
        data: null,
        error: {
          code: 'QUOTATION_EXPIRED',
          message: '報價已過期，無法轉換為訂單',
        },
      };
    }

    if (quotation.data.status !== 'sent' && quotation.data.status !== 'accepted') {
      return {
        data: null,
        error: {
          code: 'INVALID_STATUS',
          message: '只有已發送或已接受的報價才能轉換為訂單',
        },
      };
    }

    return api.post<{ orderId: string }>(
      API_ENDPOINTS.quotations.convert(id),
      convertData || {}
    );
  }

  /**
   * 取得報價版本歷史
   */
  static async getQuotationVersions(id: string): Promise<{
    data: Quotation[] | null;
    error: any;
  }> {
    return api.get<Quotation[]>(API_ENDPOINTS.quotations.versions(id));
  }

  /**
   * 計算報價預覽（不儲存）
   */
  static calculateQuotationPreview(
    items: QuotationItem[],
    paxCount: number,
    profitMargin: number
  ): {
    costBreakdown: ReturnType<typeof calculateQuotationCost>;
    sellingPrice: number;
    totalAmount: number;
  } {
    const costBreakdown = calculateQuotationCost(items, paxCount);
    const sellingPrice = calculateSellingPrice(
      costBreakdown.total,
      profitMargin
    );
    const totalAmount = sellingPrice * paxCount;

    return {
      costBreakdown,
      sellingPrice,
      totalAmount,
    };
  }
}

export default QuotationService;
