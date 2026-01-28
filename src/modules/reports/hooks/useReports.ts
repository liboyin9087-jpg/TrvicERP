import { useState, useCallback } from 'react';
import { ReportService } from '../services/reportService';
import type {
  RevenueReportQuery,
  RevenueReportData,
  CustomerReportData,
  TeamReportData,
} from '../services/reportService';

// --- Global Types & Interfaces for Standardization ---

/**
 * 標準化應用程式錯誤介面
 * Standardized application error interface
 */
export interface AppError {
  code: string; // 錯誤代碼，可用於i18n或特定錯誤處理 (e.g., 'API_ERROR_001', 'VALIDATION_FAILED')
  message: string; // 錯誤訊息，可作為預設或後備訊息 (e.g., '取得營收報表失敗')
  details?: Record<string, any>; // 更多錯誤細節，方便調試
}

/**
 * 標準化 API 回應結果介面
 * Standardized API response result interface
 * TData: 成功時的資料類型
 * TError: 失敗時的錯誤類型
 */
export interface AppResult<TData, TError = AppError> {
  data?: TData;
  error?: TError;
}

// --- Generic Hook for Data Fetching ---

/**
 * 通用資料查詢 Hook
 * A generic hook for data fetching that encapsulates loading, error, and data states.
 * This reduces repetitive state management logic across multiple specific data fetching hooks.
 *
 * @template TData The type of data to be fetched.
 * @template TParams The type of parameters required by the fetcher function. Defaults to `void` if no params are needed.
 * @template TError The type of error that can be returned. Defaults to `AppError`.
 *
 * @param fetcher A function that takes parameters of type `TParams` and returns a Promise resolving to `AppResult<TData, TError>`.
 * @returns An object containing:
 *          - `data`: The fetched data (or undefined).
 *          - `loading`: A boolean indicating if data is currently being fetched.
 *          - `error`: An `AppError` object if an error occurred (or null).
 *          - `fetchData`: A memoized function to trigger data fetching with new parameters.
 *          - `setData`: A function to directly set the data state (useful for local updates or initial data seeding).
 */
function useQuery<TData, TParams = void, TError = AppError>(
  fetcher: (params: TParams) => Promise<AppResult<TData, TError>>
) {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TError | null>(null);

  const fetchData = useCallback(async (params: TParams) => {
    setLoading(true);
    setError(null); // Clear previous errors before a new fetch
    try {
      const result = await fetcher(params);
      if (result.error) {
        setError(result.error);
        setData(undefined); // Clear data if an error occurred
      } else {
        setData(result.data);
      }
    } catch (e: any) {
      // Catch unexpected network or runtime errors not caught by the service layer
      setError({
        code: 'UNEXPECTED_ERROR',
        message: e.message || '發生未知錯誤',
        details: e,
      } as TError); // Cast to TError, assuming AppError is compatible
      setData(undefined);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  return { data, loading, error, fetchData, setData };
}

// --- Specific Report Hooks using useQuery ---

/**
 * 營收報表 Hook
 * Manages fetching and state for revenue reports.
 */
export function useRevenueReport() {
  // Define the specific fetcher function for revenue reports
  const fetcher = useCallback(async (query: RevenueReportQuery) => {
    const result = await ReportService.getRevenueReport(query);
    // Ensure data is always an array if successful for consistent typing in consumer
    return { ...result, data: result.data || [] };
  }, []);

  // Utilize the generic useQuery hook
  const { data, loading, error, fetchData } = useQuery<RevenueReportData[], RevenueReportQuery>(fetcher);

  // Provide a default empty array for data when undefined for easier consumption
  return { data: data || [], loading, error, fetchReport: fetchData };
}

/**
 * 客戶統計報表查詢參數介面
 */
export interface CustomerReportQueryParams {
  dateFrom?: string;
  dateTo?: string;
  minSpent?: number;
  limit?: number;
}

/**
 * 客戶統計報表 Hook
 * Manages fetching and state for customer reports.
 */
export function useCustomerReport() {
  // Define the specific fetcher function for customer reports
  const fetcher = useCallback(async (params: CustomerReportQueryParams) => {
    const result = await ReportService.getCustomerReport(params);
    return { ...result, data: result.data || [] };
  }, []);

  // Utilize the generic useQuery hook
  const { data, loading, error, fetchData } = useQuery<CustomerReportData[], CustomerReportQueryParams>(fetcher);

  return { data: data || [], loading, error, fetchReport: fetchData };
}

/**
 * 團隊績效報表查詢參數介面
 */
export interface TeamReportQueryParams {
  dateFrom?: string;
  dateTo?: string;
  role?: string;
}

/**
 * 團隊績效報表 Hook
 * Manages fetching and state for team performance reports.
 */
export function useTeamReport() {
  // Define the specific fetcher function for team reports
  const fetcher = useCallback(async (params: TeamReportQueryParams) => {
    const result = await ReportService.getTeamReport(params);
    return { ...result, data: result.data || [] };
  }, []);

  // Utilize the generic useQuery hook
  const { data, loading, error, fetchData } = useQuery<TeamReportData[], TeamReportQueryParams>(fetcher);

  return { data: data || [], loading, error, fetchReport: fetchData };
}

// --- Export Report Hook ---

/**
 * 匯出報表參數介面
 * Defines the parameters required for exporting a report.
 */
export interface ExportReportParams {
  type: 'revenue' | 'customers' | 'teams'; // 報表類型
  format: 'excel' | 'pdf'; // 匯出格式
  query?: Record<string, any>; // 通用的查詢參數，傳遞給後端 API
}

/**
 * 匯出報表成功結果介面
 */
export interface ExportReportSuccess {
  success: true;
  message?: string; // 可選的成功訊息，供 UI 顯示
}

/**
 * 匯出報表失敗結果介面
 */
export interface ExportReportFailure {
  success: false;
  error: AppError; // 失敗時包含標準化的錯誤訊息
}

/**
 * 匯出報表操作的綜合結果類型
 */
export type ExportReportResult = ExportReportSuccess | ExportReportFailure;

/**
 * 匯出報表 Hook
 * Manages the process of exporting reports, including loading state and file download.
 */
export function useExportReport() {
  const [loading, setLoading] = useState(false);

  /**
   * 執行報表匯出操作。
   * The actual file download logic is handled internally.
   *
   * @param params - 匯出報表的參數，包含類型、格式和查詢條件。
   * @returns Promise<ExportReportResult> - 匯出操作的結果，指示成功或失敗。
   */
  const exportReport = useCallback(async (params: ExportReportParams): Promise<ExportReportResult> => {
    setLoading(true);
    let result: AppResult<Blob, AppError>;
    try {
      // Call the service to get the report blob
      result = await ReportService.exportReport(params.type, params.format, params.query);
    } catch (e: any) {
      // Catch unexpected errors during the service call (e.g., network issues)
      setLoading(false);
      return {
        success: false,
        error: {
          code: 'EXPORT_UNEXPECTED_ERROR',
          message: e.message || '匯出報表時發生未知錯誤',
          details: e,
        },
      };
    } finally {
      // Ensure loading state is reset regardless of outcome
      setLoading(false);
    }

    if (result.error) {
      // If the service returned a structured error
      return { success: false, error: result.error };
    }

    if (result.data) {
      // If data (blob) is returned, proceed with file download
      const blob = result.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Construct a meaningful filename based on report type, date, and format
      a.download = `report_${params.type}_${new Date().toISOString().split('T')[0]}.${params.format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url); // Clean up the object URL to prevent memory leaks

      return { success: true, message: '報表匯出成功' }; // Return success with an optional message
    }

    // Fallback: This case should ideally not be reached if the AppResult contract is strictly followed (data OR error)
    return {
      success: false,
      error: {
        code: 'EXPORT_NO_DATA_OR_ERROR',
        message: '匯出報表失敗：服務未返回資料或錯誤訊息',
      },
    };
  }, []); // Dependencies for useCallback. No external dependencies needed besides the function itself.

  return { exportReport, loading };
}