/**
 * 報表服務層
 * Report Service Layer
 */

import { api, API_ENDPOINTS } from '../../../lib/api';
import {
  RevenueReportQuery,
  RevenueReportData,
  CustomerReportData,
  TeamReportData,
} from './reportTypes'; // [architect] 4. 介面定義與服務類別放在同檔案

/**
 * Report Service Configuration
 * [architect] 1. 服務層直接使用環境變量(USE_MOCK)
 * Configuration is injected into the service.
 */
export interface ReportServiceConfig {
  useMock: boolean;
}

/**
 * 自定義報表服務錯誤
 * [architect] 2. 回傳型別包含 error 欄位
 * 用於在服務層拋出結構化的錯誤。
 */
export class ReportServiceError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'ReportServiceError';
    this.code = code;
    this.details = details;
    // Maintain proper prototype chain for Error subclasses
    Object.setPrototypeOf(this, ReportServiceError.prototype);
  }
}

/**
 * 報表服務
 */
export class ReportService {
  private config: ReportServiceConfig;

  constructor(config: ReportServiceConfig) {
    this.config = config;
  }

  /**
   * Helper to build URLSearchParams from an object.
   * Filters out null/undefined values.
   * [architect] 3. URL 參數建構重複邏輯
   */
  private _buildQueryParams(params: Record<string, any>): URLSearchParams {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      // Only append if the value is not undefined or null
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    return queryParams;
  }

  /**
   * Helper to unwrap API response or throw a ReportServiceError.
   * Assumes `api.get` returns `{ data: T | null; error: any }`.
   * [architect] 2. 回傳型別包含 error 欄位
   */
  private _unwrapApiResponse<T>(response: { data: T | null; error: any }): T {
    if (response.error) {
      throw new ReportServiceError(
        response.error.message || 'API request failed',
        response.error.code || 'API_ERROR',
        response.error
      );
    }
    // If data is null/undefined but no explicit error, still treat as an issue.
    if (response.data === null || response.data === undefined) {
      throw new ReportServiceError('API returned no data', 'NO_DATA_RETURNED');
    }
    return response.data;
  }

  /**
   * 取得營收報表
   */
  async getRevenueReport(query: RevenueReportQuery): Promise<RevenueReportData[]> {
    const params = this._buildQueryParams(query);
    const endpoint = `${API_ENDPOINTS.reports.revenue}?${params.toString()}`;
    const response = await api.get<RevenueReportData[]>(endpoint);
    return this._unwrapApiResponse(response);
  }

  /**
   * 取得客戶統計報表
   */
  async getCustomerReport(params?: {
    dateFrom?: string;
    dateTo?: string;
    minSpent?: number;
    limit?: number;
  }): Promise<CustomerReportData[]> {
    const queryParams = this._buildQueryParams(params || {});
    const endpoint = `${API_ENDPOINTS.reports.customers}?${queryParams.toString()}`;
    const response = await api.get<CustomerReportData[]>(endpoint);
    return this._unwrapApiResponse(response);
  }

  /**
   * 取得團隊績效報表
   */
  async getTeamReport(params?: {
    dateFrom?: string;
    dateTo?: string;
    role?: string;
  }): Promise<TeamReportData[]> {
    const queryParams = this._buildQueryParams(params || {});
    const endpoint = `${API_ENDPOINTS.reports.teams}?${queryParams.toString()}`;
    const response = await api.get<TeamReportData[]>(endpoint);
    return this._unwrapApiResponse(response);
  }

  /**
   * 匯出報表（Excel/PDF）
   */
  async exportReport(
    type: 'revenue' | 'customers' | 'teams',
    format: 'excel' | 'pdf',
    params?: Record<string, any>
  ): Promise<Blob> {
    // [architect] 1. 服務層直接使用環境變量(USE_MOCK)
    // Use injected config instead of direct environment variable
    if (this.config.useMock) {
      // [architect] 2. 回傳型別包含 error 欄位
      // Throw an error instead of returning an error object
      throw new ReportServiceError(
        '目前為 Mock 模式，報表匯出尚未啟用',
        'MOCK_MODE'
      );
    }

    // [architect] 3. URL 參數建構重複邏輯
    const queryParams = this._buildQueryParams({ ...params, format });
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
        let errorData: any = {};
        try {
          // Attempt to parse JSON error, but catch if response isn't JSON
          errorData = await response.json();
        } catch (e) {
          // If response body is not JSON, use statusText as message
          errorData.message = response.statusText;
        }
        // [architect] 2. 回傳型別包含 error 欄位
        // Throw a custom error
        throw new ReportServiceError(
          errorData.message || '匯出失敗',
          'EXPORT_ERROR',
          { statusCode: response.status, details: errorData }
        );
      }

      const blob = await response.blob();
      // [architect] 2. 回傳型別包含 error 欄位
      // Return data directly
      return blob;
    } catch (error) {
      // Re-throw custom errors that were already caught
      if (error instanceof ReportServiceError) {
        throw error;
      }
      // Wrap other unexpected errors into ReportServiceError
      throw new ReportServiceError(
        error instanceof Error ? error.message : '網路連線錯誤',
        'NETWORK_ERROR',
        error
      );
    }
  }
}

// export default ReportService; // You might export an instance or the class depending on application structure.
// For example, to create an instance with config:
// const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
// const reportService = new ReportService({ useMock: USE_MOCK });
// export default reportService;
// For this output, we will just export the class to allow consumers to instantiate it.