/**
 * 報表服務層
 * Report Service Layer
 */

import { api, API_ENDPOINTS } from '../../../lib/api';

/**
 * 營收報表查詢條件
 */
export interface RevenueReportQuery {
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  customerId?: string;
  sessionId?: string;
}

/**
 * 營收報表資料
 */
export interface RevenueReportData {
  period: string;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  orderCount: number;
  averageOrderValue: number;
}

/**
 * 客戶統計報表資料
 */
export interface CustomerReportData {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
  favoriteDestinations: string[];
}

/**
 * 團隊績效報表資料
 */
export interface TeamReportData {
  teamMemberId: string;
  teamMemberName: string;
  role: string;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
}

/**
 * 報表服務
 */
export class ReportService {
  /**
   * 取得營收報表
   */
  static async getRevenueReport(
    query: RevenueReportQuery
  ): Promise<{
    data: RevenueReportData[] | null;
    error: any;
  }> {
    const params = new URLSearchParams();
    params.append('dateFrom', query.dateFrom);
    params.append('dateTo', query.dateTo);
    if (query.groupBy) params.append('groupBy', query.groupBy);
    if (query.customerId) params.append('customerId', query.customerId);
    if (query.sessionId) params.append('sessionId', query.sessionId);

    const endpoint = `${API_ENDPOINTS.reports.revenue}?${params.toString()}`;
    return api.get<RevenueReportData[]>(endpoint);
  }

  /**
   * 取得客戶統計報表
   */
  static async getCustomerReport(params?: {
    dateFrom?: string;
    dateTo?: string;
    minSpent?: number;
    limit?: number;
  }): Promise<{
    data: CustomerReportData[] | null;
    error: any;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.minSpent) queryParams.append('minSpent', params.minSpent.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `${API_ENDPOINTS.reports.customers}?${queryParams.toString()}`;
    return api.get<CustomerReportData[]>(endpoint);
  }

  /**
   * 取得團隊績效報表
   */
  static async getTeamReport(params?: {
    dateFrom?: string;
    dateTo?: string;
    role?: string;
  }): Promise<{
    data: TeamReportData[] | null;
    error: any;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.role) queryParams.append('role', params.role);

    const endpoint = `${API_ENDPOINTS.reports.teams}?${queryParams.toString()}`;
    return api.get<TeamReportData[]>(endpoint);
  }

  /**
   * 匯出報表（Excel/PDF）
   */
  static async exportReport(
    type: 'revenue' | 'customers' | 'teams',
    format: 'excel' | 'pdf',
    params?: Record<string, any>
  ): Promise<{
    data: Blob | null;
    error: any;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    Object.entries(params || {}).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });

    const endpoint = `${API_ENDPOINTS.reports.export(type)}?${queryParams.toString()}`;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          data: null,
          error: {
            code: 'EXPORT_ERROR',
            message: errorData.message || '匯出失敗',
            statusCode: response.status,
          },
        };
      }

      const blob = await response.blob();
      return { data: blob, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '網路連線錯誤',
        },
      };
    }
  }
}

export default ReportService;
