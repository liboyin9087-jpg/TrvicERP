import { useState, useCallback } from 'react';
import { ReportService } from '../services/reportService';
import type {
  RevenueReportQuery,
  RevenueReportData,
  CustomerReportData,
  TeamReportData,
  ReportError,
} from '../services/reportService';
import { useToast } from '../../../store/useToastStore';

export function useRevenueReport() {
  const [data, setData] = useState<RevenueReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReportError | null>(null);
  const toast = useToast();

  const fetchReport = useCallback(async (query: RevenueReportQuery): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await ReportService.getRevenueReport(query);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得營收報表失敗');
      } else {
        setData(result.data || []);
      }
    } catch (err) {
      setError(err as ReportError);
      toast.error('取得營收報表時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { data, loading, error, fetchReport };
}

export function useCustomerReport() {
  const [data, setData] = useState<CustomerReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReportError | null>(null);
  const toast = useToast();

  const fetchReport = useCallback(async (params?: {
    dateFrom?: string;
    dateTo?: string;
    minSpent?: number;
    limit?: number;
  }): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await ReportService.getCustomerReport(params);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得客戶報表失敗');
      } else {
        setData(result.data || []);
      }
    } catch (err) {
      setError(err as ReportError);
      toast.error('取得客戶報表時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { data, loading, error, fetchReport };
}

export function useTeamReport() {
  const [data, setData] = useState<TeamReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReportError | null>(null);
  const toast = useToast();

  const fetchReport = useCallback(async (params?: {
    dateFrom?: string;
    dateTo?: string;
    role?: string;
  }): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await ReportService.getTeamReport(params);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得團隊報表失敗');
      } else {
        setData(result.data || []);
      }
    } catch (err) {
      setError(err as ReportError);
      toast.error('取得團隊報表時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { data, loading, error, fetchReport };
}

export function useExportReport() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const exportReport = useCallback(async (
    type: 'revenue' | 'customers' | 'teams',
    format: 'excel' | 'pdf',
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: ReportError }> => {
    try {
      setLoading(true);
      const result = await ReportService.exportReport(type, format, params);
      
      if (result.error) {
        toast.error(result.error.message || '匯出報表失敗');
        return { success: false, error: result.error };
      }

      if (result.data) {
        const blob = result.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${type}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success('報表匯出成功');
      }

      return { success: true };
    } catch (err) {
      toast.error('匯出報表時發生錯誤');
      return { success: false, error: err as ReportError };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { exportReport, loading };
}