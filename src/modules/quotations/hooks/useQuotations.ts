/**
 * 報價管理 Hooks
 * Quotation Management Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { QuotationService } from '../services/quotationService';
import type {
  Quotation,
  CreateQuotationData,
  UpdateQuotationData,
  QuotationItem,
} from '../../../core/types/quotation';
import { useToast } from '../../../store/useToastStore';

/**
 * 取得報價列表 Hook
 */
export function useQuotations(params?: {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await QuotationService.getQuotations(params);
    if (result.error) {
      setError(result.error);
      toast.error(result.error.message || '取得報價列表失敗');
    } else {
      setQuotations(result.data || []);
    }
    setLoading(false);
  }, [params, toast]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return { quotations, loading, error, refetch: fetchQuotations };
}

/**
 * 取得單一報價 Hook
 */
export function useQuotation(id: string | null) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

  const fetchQuotation = useCallback(async () => {
    if (!id) {
      setQuotation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await QuotationService.getQuotation(id);
    if (result.error) {
      setError(result.error);
      toast.error(result.error.message || '取得報價失敗');
    } else {
      setQuotation(result.data);
    }
    setLoading(false);
  }, [id, toast]);

  useEffect(() => {
    fetchQuotation();
  }, [fetchQuotation]);

  return { quotation, loading, error, refetch: fetchQuotation };
}

/**
 * 建立報價 Hook
 */
export function useCreateQuotation() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const createQuotation = useCallback(async (data: CreateQuotationData) => {
    setLoading(true);
    const result = await QuotationService.createQuotation(data);
    setLoading(false);

    if (result.error) {
      toast.error(result.error.message || '建立報價失敗');
      return { success: false, error: result.error };
    }

    toast.success('報價建立成功');
    return { success: true, data: result.data };
  }, [toast]);

  return { createQuotation, loading };
}

/**
 * 更新報價 Hook
 */
export function useUpdateQuotation() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const updateQuotation = useCallback(async (id: string, data: UpdateQuotationData) => {
    setLoading(true);
    const result = await QuotationService.updateQuotation(id, data);
    setLoading(false);

    if (result.error) {
      toast.error(result.error.message || '更新報價失敗');
      return { success: false, error: result.error };
    }

    toast.success('報價更新成功');
    return { success: true, data: result.data };
  }, [toast]);

  return { updateQuotation, loading };
}

/**
 * 轉換報價為訂單 Hook
 */
export function useConvertQuotationToOrder() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const convertToOrder = useCallback(async (quotationId: string, orderNumber?: string) => {
    setLoading(true);
    const result = await QuotationService.convertToOrder(quotationId, { orderNumber });
    setLoading(false);

    if (result.error) {
      toast.error(result.error.message || '轉換訂單失敗');
      return { success: false, error: result.error };
    }

    toast.success('報價已轉換為訂單');
    return { success: true, data: result.data };
  }, [toast]);

  return { convertToOrder, loading };
}

/**
 * 計算報價預覽 Hook
 */
export function useQuotationPreview() {
  const calculatePreview = useCallback((
    items: QuotationItem[],
    paxCount: number,
    profitMargin: number
  ) => {
    return QuotationService.calculateQuotationPreview(items, paxCount, profitMargin);
  }, []);

  return { calculatePreview };
}
