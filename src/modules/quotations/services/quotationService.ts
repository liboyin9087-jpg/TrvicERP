import { api, API_ENDPOINTS } from '../../../lib/api';
import { ApiError } from '../../../core/types/api';
import { Currency, QuotationStatus } from '../../../core/types/quotation';
import type {
  Quotation,
  CreateQuotationData,
  UpdateQuotationData,
  ConvertQuotationToOrderData,
  QuotationItem,
  ApiResponse,
  NTAmount,
  Percentage,
} from '../../../core/types/quotation';
import {
  calculateQuotationCost,
  calculateSellingPrice,
  isQuotationExpired,
} from '../../../core/types/quotation';

export class QuotationService {
  static async getQuotations(params?: {
    customerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Quotation[]>> {
    const queryParams = new URLSearchParams();
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `${API_ENDPOINTS.quotations.list}?${queryParams.toString()}`;
    return api.get<Quotation[]>(endpoint);
  }

  static async getQuotation(id: string): Promise<ApiResponse<Quotation>> {
    return api.get<Quotation>(API_ENDPOINTS.quotations.detail(id));
  }

  static async createQuotation(
    data: CreateQuotationData
  ): Promise<ApiResponse<Quotation>> {
    const costBreakdown = calculateQuotationCost(data.items, data.paxCount);
    const totalCost = costBreakdown.total;
    const sellingPrice = calculateSellingPrice(totalCost, data.profitMargin);

    const validDays = data.validDays || 30;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const quotationData = {
      ...data,
      costBreakdown,
      sellingPrice,
      totalNTAmount: (sellingPrice * data.paxCount) as NTAmount,
      validUntil: validUntil.toISOString(),
      currency: data.currency || Currency.TWD,
    };

    return api.post<Quotation>(API_ENDPOINTS.quotations.create, quotationData);
  }

  static async updateQuotation(
    id: string,
    data: UpdateQuotationData
  ): Promise<ApiResponse<Quotation>> {
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
        totalNTAmount: (sellingPrice * paxCount) as NTAmount,
      };
    }

    return api.patch<Quotation>(API_ENDPOINTS.quotations.update(id), data);
  }

  static async deleteQuotation(id: string): Promise<ApiResponse<null>> {
    return api.delete(API_ENDPOINTS.quotations.delete(id));
  }

  static async convertToOrder(
    id: string,
    convertData?: ConvertQuotationToOrderData
  ): Promise<ApiResponse<{ orderId: string }>> {
    const quotation = await this.getQuotation(id);
    if (quotation.error || !quotation.data) {
      return { data: null, error: quotation.error };
    }

    if (isQuotationExpired(quotation.data.validUntil)) {
      return {
        data: null,
        error: new ApiError('報價已過期，無法轉換為訂單', 'QUOTATION_EXPIRED'),
      };
    }

    if (quotation.data.status !== QuotationStatus.SENT && quotation.data.status !== QuotationStatus.ACCEPTED) {
      return {
        data: null,
        error: new ApiError('只有已發送或已接受的報價才能轉換為訂單', 'INVALID_STATUS'),
      };
    }

    return api.post<{ orderId: string }>(
      API_ENDPOINTS.quotations.convert(id),
      convertData || {}
    );
  }

  static async getQuotationVersions(id: string): Promise<ApiResponse<Quotation[]>> {
    return api.get<Quotation[]>(API_ENDPOINTS.quotations.versions(id));
  }

  static calculateQuotationPreview(
    items: QuotationItem[],
    paxCount: number,
    profitMargin: Percentage
  ): {
    costBreakdown: ReturnType<typeof calculateQuotationCost>;
    sellingPrice: NTAmount;
    totalNTAmount: NTAmount;
  } {
    const costBreakdown = calculateQuotationCost(items, paxCount);
    const sellingPrice = calculateSellingPrice(
      costBreakdown.total,
      profitMargin
    );
    const totalNTAmount = (sellingPrice * paxCount) as NTAmount;

    return {
      costBreakdown,
      sellingPrice,
      totalNTAmount,
    };
  }
}

export default QuotationService;