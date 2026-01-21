import { useState, useEffect, useCallback } from 'react';
import { QuotationService } from '../services/quotationService';
import type {
  Quotation,
  CreateQuotationData,
  UpdateQuotationData,
  QuotationItem,
  QuotationPreviewResult,
  QuotationServiceResult,
  Percentage,
} from '../../../core/types/quotation';
import { useToast } from '../../../store/useToastStore';

interface QuotationListParams {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface QuotationHookResult<T> {
  loading: boolean;
  error: Error | null;
  data: T | null;
  refetch: () => Promise<void>;
}

interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

export function useQuotations(params?: QuotationListParams) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await QuotationService.getQuotations(params);
      if (result.error) {
        throw result.error;
      }
      setQuotations(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('取得報價列表失敗'));
      toast.error('取得報價列表失敗');
    } finally {
      setLoading(false);
    }
  }, [params, toast]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return { quotations, loading, error, refetch: fetchQuotations };
}

export function useQuotation(id: string | null): QuotationHookResult<Quotation> {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

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
        throw result.error;
      }
      setQuotation(result.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('取得報價失敗'));
      toast.error('取得報價失敗');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchQuotation();
  }, [fetchQuotation]);

  return { data: quotation, loading, error, refetch: fetchQuotation };
}

export function useCreateQuotation() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const createQuotation = useCallback(async (data: CreateQuotationData): Promise<MutationResult<Quotation>> => {
    setLoading(true);
    try {
      const result = await QuotationService.createQuotation(data);
      if (result.error) {
        throw result.error;
      }
      toast.success('報價建立成功');
      return { success: true, data: result.data };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('建立報價失敗');
      toast.error(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { createQuotation, loading };
}

export function useUpdateQuotation() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const updateQuotation = useCallback(async (id: string, data: UpdateQuotationData): Promise<MutationResult<Quotation>> => {
    setLoading(true);
    try {
      const result = await QuotationService.updateQuotation(id, data);
      if (result.error) {
        throw result.error;
      }
      toast.success('報價更新成功');
      return { success: true, data: result.data };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('更新報價失敗');
      toast.error(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { updateQuotation, loading };
}

export function useConvertQuotationToOrder() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const convertToOrder = useCallback(async (quotationId: string, orderNumber?: string): Promise<MutationResult<{ orderId: string }>> => {
    setLoading(true);
    try {
      const result = await QuotationService.convertToOrder(quotationId, { orderNumber });
      if (result.error) {
        throw result.error;
      }
      toast.success('報價已轉換為訂單');
      return { success: true, data: result.data };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('轉換訂單失敗');
      toast.error(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { convertToOrder, loading };
}

export function useQuotationPreview() {
  const calculatePreview = useCallback((
    items: QuotationItem[],
    paxCount: number,
    profitMargin: number
  ): QuotationPreviewResult => {
    return QuotationService.calculateQuotationPreview(items, paxCount, profitMargin as Percentage);
  }, []);

  return { calculatePreview };
}