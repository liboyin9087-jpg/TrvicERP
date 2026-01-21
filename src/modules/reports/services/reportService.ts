import { api, API_ENDPOINTS } from '../../../lib/api';

export interface RevenueReportQuery {
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  customerId?: string;
  sessionId?: string;
}

export interface RevenueReportData {
  period: string;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface CustomerReportData {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
  favoriteDestinations: string[];
}

export interface TeamReportData {
  teamMemberId: string;
  teamMemberName: string;
  role: string;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
    statusCode?: number;
  } | null;
}

export type ReportError = NonNullable<ApiResponse<unknown>['error']>;

interface ExportParams {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: string;
  customerId?: string;
  sessionId?: string;
  minSpent?: number;
  limit?: number;
  role?: string;
}

export class ReportService {
  static async getRevenueReport(
    query: RevenueReportQuery
  ): Promise<ApiResponse<RevenueReportData[]>> {
    try {
      const params = new URLSearchParams();
      params.append('dateFrom', query.dateFrom);
      params.append('dateTo', query.dateTo);
      if (query.groupBy) params.append('groupBy', query.groupBy);
      if (query.customerId) params.append('customerId', query.customerId);
      if (query.sessionId) params.append('sessionId', query.sessionId);

      const endpoint = `${API_ENDPOINTS.reports.revenue}?${params.toString()}`;
      const response = await api.get<RevenueReportData[]>(endpoint);
      return response;
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : '取得營收報表失敗'
        }
      };
    }
  }

  static async getCustomerReport(params?: {
    dateFrom?: string;
    dateTo?: string;
    minSpent?: number;
    limit?: number;
  }): Promise<ApiResponse<CustomerReportData[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params?.minSpent) queryParams.append('minSpent', params.minSpent.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const endpoint = `${API_ENDPOINTS.reports.customers}?${queryParams.toString()}`;
      const response = await api.get<CustomerReportData[]>(endpoint);
      return response;
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : '取得客戶報表失敗'
        }
      };
    }
  }

  static async getTeamReport(params?: {
    dateFrom?: string;
    dateTo?: string;
    role?: string;
  }): Promise<ApiResponse<TeamReportData[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params?.role) queryParams.append('role', params.role);

      const endpoint = `${API_ENDPOINTS.reports.teams}?${queryParams.toString()}`;
      const response = await api.get<TeamReportData[]>(endpoint);
      return response;
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : '取得團隊報表失敗'
        }
      };
    }
  }

  static async exportReport(
    type: 'revenue' | 'customers' | 'teams',
    format: 'excel' | 'pdf',
    params?: ExportParams
  ): Promise<ApiResponse<Blob>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const endpoint = `${API_ENDPOINTS.reports.export(type)}?${queryParams.toString()}`;
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