import { useState, useEffect, useCallback, useMemo } from 'react';
import { QuotationService } from '../services/quotationService';
import type {
  Quotation,
  CreateQuotationData,
  UpdateQuotationData,
  QuotationItem,
  QuotationListParams, // Assuming this type exists or will be created
} from '../../../core/types/quotation';
// Removed direct import of useToast from '../../../store/useToastStore';

/**
 * 輔助介面：Toast 服務，用於透過配置傳入
 */
export interface ToastService {
  success: (message: string) => void;
  error: (message: string) => void;
}

/**
 * 輔助介面：國際化服務，用於透過配置傳入
 */
export interface I18nService {
  t: (key: string, fallback?: string) => string;
}

/**
 * 預設的 Toast 服務實現（無操作或記錄）
 * 當 Hook 未提供 Toast 服務時使用，避免運行錯誤。
 */
const defaultToastService: ToastService = {
  success: (message: string) => console.log(`[Toast Success]: ${message}`),
  error: (message: string) => console.error(`[Toast Error]: ${message}`),
};

/**
 * 預設的國際化服務實現
 * 當 Hook 未提供國際化服務時使用，回傳 key 或 fallback 字串。
 */
const defaultI18nService: I18nService = {
  t: (key: string, fallback?: string) => fallback || key,
};

/**
 * 取得報價列表 Hook 的參數介面
 */
export interface UseQuotationsParams {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * 取得報價列表 Hook 的配置介面
 */
export interface UseQuotationsConfig {
  toastService?: ToastService;
  i18nService?: I18nService;
}

/**
 * 取得報價列表 Hook
 * @param params 查詢參數
 * @param config Hook 配置，包含 Toast 和國際化服務
 */
export function useQuotations(
  params: UseQuotationsParams = {},
  config?: UseQuotationsConfig,
) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null); // Consider defining a more specific error type

  const toast = config?.toastService || defaultToastService;
  const i18n = config?.i18nService || defaultI18nService;

  // 使用 useMemo 穩定化 params，確保即使外部傳入的 params 物件實例變化，
  // 只要內部屬性值不變，就不會導致過度觸發。
  // 注意：此處僅對 params 進行淺層比較，若 params 包含深度嵌套物件，需使用深層比較或結構化為多個依賴項。
  const stableParams = useMemo(() => params, [
    params.customerId,
    params.status,
    params.page,
    params.limit,
  ]);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await QuotationService.getQuotations(stableParams);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || i18n.t('quotation.fetchListError', '取得報價列表失敗'));
      } else {
        setQuotations(result.data || []);
      }
    } catch (err: any) {
      setError(err);
      toast.error(err.message || i18n.t('quotation.fetchListUnexpectedError', '取得報價列表時發生意外錯誤'));
    } finally {
      setLoading(false);
    }
  }, [stableParams, toast, i18n]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return { quotations, loading, error, refetch: fetchQuotations };
}

/**
 * 取得單一報價 Hook 的配置介面
 */
export interface UseQuotationConfig {
  toastService?: ToastService;
  i18nService?: I18nService;
}

/**
 * 取得單一報價 Hook
 * @param id 報價 ID
 * @param config Hook 配置，包含 Toast 和國際化服務
 */
export function useQuotation(id: string | null, config?: UseQuotationConfig) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null); // Consider defining a more specific error type

  const toast = config?.toastService || defaultToastService;
  const i18n = config?.i18nService || defaultI18nService;

  const fetchQuotation = useCallback(async () => {
    if (!id) {
      setQuotation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await QuotationService.getQuotation(id);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || i18n.t('quotation.fetchSingleError', '取得報價失敗'));
      } else {
        setQuotation(result.data);
      }
    } catch (err: any) {
      setError(err);
      toast.error(err.message || i18n.t('quotation.fetchSingleUnexpectedError', '取得報價時發生意外錯誤'));
    } finally {
      setLoading(false);
    }
  }, [id, toast, i18n]);

  useEffect(() => {
    fetchQuotation();
  }, [fetchQuotation]);

  return { quotation, loading, error, refetch: fetchQuotation };
}

/**
 * 建立報價 Hook 的配置介面
 */
export interface UseCreateQuotationConfig {
  toastService?: ToastService;
  i18nService?: I18nService;
}

/**
 * 建立報價 Hook
 * @param config Hook 配置，包含 Toast 和國際化服務
 */
export function useCreateQuotation(config?: UseCreateQuotationConfig) {
  const [loading, setLoading] = useState(false);

  const toast = config?.toastService || defaultToastService;
  const i18n = config?.i18nService || defaultI18nService;

  const createQuotation = useCallback(async (data: CreateQuotationData) => {
    setLoading(true);
    try {
      const result = await QuotationService.createQuotation(data);
      if (result.error) {
        toast.error(result.error.message || i18n.t('quotation.createError', '建立報價失敗'));
        return { success: false, error: result.error };
      }

      toast.success(i18n.t('quotation.createSuccess', '報價建立成功'));
      return { success: true, data: result.data };
    } catch (err: any) {
      toast.error(err.message || i18n.t('quotation.createUnexpectedError', '建立報價時發生意外錯誤'));
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [toast, i18n]);

  return { createQuotation, loading };
}

/**
 * 更新報價 Hook 的配置介面
 */
export interface UseUpdateQuotationConfig {
  toastService?: ToastService;
  i18nService?: I18nService;
}

/**
 * 更新報價 Hook
 * @param config Hook 配置，包含 Toast 和國際化服務
 */
export function useUpdateQuotation(config?: UseUpdateQuotationConfig) {
  const [loading, setLoading] = useState(false);

  const toast = config?.toastService || defaultToastService;
  const i18n = config?.i18nService || defaultI18nService;

  const updateQuotation = useCallback(async (id: string, data: UpdateQuotationData) => {
    setLoading(true);
    try {
      const result = await QuotationService.updateQuotation(id, data);
      if (result.error) {
        toast.error(result.error.message || i18n.t('quotation.updateError', '更新報價失敗'));
        return { success: false, error: result.error };
      }

      toast.success(i18n.t('quotation.updateSuccess', '報價更新成功'));
      return { success: true, data: result.data };
    } catch (err: any) {
      toast.error(err.message || i18n.t('quotation.updateUnexpectedError', '更新報價時發生意外錯誤'));
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [toast, i18n]);

  return { updateQuotation, loading };
}

/**
 * 轉換報價為訂單 Hook 的配置介面
 */
export interface UseConvertQuotationToOrderConfig {
  toastService?: ToastService;
  i18nService?: I18nService;
}

/**
 * 轉換報價為訂單 Hook
 * @param config Hook 配置，包含 Toast 和國際化服務
 */
export function useConvertQuotationToOrder(config?: UseConvertQuotationToOrderConfig) {
  const [loading, setLoading] = useState(false);

  const toast = config?.toastService || defaultToastService;
  const i18n = config?.i18nService || defaultI18nService;

  const convertToOrder = useCallback(async (quotationId: string, orderNumber?: string) => {
    setLoading(true);
    try {
      const result = await QuotationService.convertToOrder(quotationId, { orderNumber });
      if (result.error) {
        toast.error(result.error.message || i18n.t('quotation.convertToOrderError', '轉換訂單失敗'));
        return { success: false, error: result.error };
      }

      toast.success(i18n.t('quotation.convertToOrderSuccess', '報價已轉換為訂單'));
      return { success: true, data: result.data };
    } catch (err: any) {
      toast.error(err.message || i18n.t('quotation.convertToOrderUnexpectedError', '轉換訂單時發生意外錯誤'));
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [toast, i18n]);

  return { convertToOrder, loading };
}

/**
 * 計算報價預覽 Hook
 * 此 Hook 僅執行純計算，不涉及副作用或外部服務。
 */
export function useQuotationPreview() {
  const calculatePreview = useCallback((
    items: QuotationItem[],
    paxCount: number,
    profitMargin: number
  ) => {
    // 這裡假設 QuotationService.calculateQuotationPreview 是一個同步純函數
    // 如果它有潛在的錯誤或需要異步操作，則需增加 try-catch 或異步處理
    return QuotationService.calculateQuotationPreview(items, paxCount, profitMargin);
  }, []);

  return { calculatePreview };
}