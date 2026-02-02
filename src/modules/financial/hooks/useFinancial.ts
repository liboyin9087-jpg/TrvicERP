import { useState, useEffect, useCallback } from 'react';
import { FinancialService } from '../services/financialService';
import type { Invoice, InvoiceStatus, AccountsReceivable, AccountsPayable, Currency } from '../types';

interface BaseHookConfig {
  onSuccess?: (data: any) => void;
  onError?: (error: { message: string }) => void;
}

// ─── Invoices ───

export function useInvoices(config?: BaseHookConfig & { status?: InvoiceStatus; customer_id?: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await FinancialService.getInvoices({
      status: config?.status,
      customer_id: config?.customer_id,
    });
    if (res.success && res.data) {
      setInvoices(res.data);
      config?.onSuccess?.(res.data);
    } else if (res.error) {
      setError(res.error);
      config?.onError?.(res.error);
    }
    setLoading(false);
  }, [config?.status, config?.customer_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { invoices, loading, error, refetch: fetch };
}

export function useCreateInvoice(config?: BaseHookConfig) {
  const [loading, setLoading] = useState(false);

  const createInvoice = useCallback(async (data: Partial<Invoice>) => {
    setLoading(true);
    const res = await FinancialService.createInvoice(data);
    setLoading(false);
    if (res.success) config?.onSuccess?.(res.data);
    else config?.onError?.(res.error || { message: 'Failed to create invoice' });
    return res;
  }, [config?.onSuccess, config?.onError]);

  return { createInvoice, loading };
}

export function useUpdateInvoice(config?: BaseHookConfig) {
  const [loading, setLoading] = useState(false);

  const updateInvoice = useCallback(async (id: string, data: Partial<Invoice>) => {
    setLoading(true);
    const res = await FinancialService.updateInvoice(id, data);
    setLoading(false);
    if (res.success) config?.onSuccess?.(res.data);
    else config?.onError?.(res.error || { message: 'Failed to update invoice' });
    return res;
  }, [config?.onSuccess, config?.onError]);

  return { updateInvoice, loading };
}

// ─── Accounts Receivable ───

export function useAccountsReceivable(config?: BaseHookConfig & { status?: string; customer_id?: string }) {
  const [items, setItems] = useState<AccountsReceivable[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await FinancialService.getAccountsReceivable({
      status: config?.status,
      customer_id: config?.customer_id,
    });
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  }, [config?.status, config?.customer_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, refetch: fetch };
}

// ─── Accounts Payable ───

export function useAccountsPayable(config?: BaseHookConfig & { status?: string; supplier_id?: string }) {
  const [items, setItems] = useState<AccountsPayable[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await FinancialService.getAccountsPayable({
      status: config?.status,
      supplier_id: config?.supplier_id,
    });
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  }, [config?.status, config?.supplier_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, refetch: fetch };
}

// ─── Financial Summary ───

export function useFinancialSummary(config?: BaseHookConfig) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await FinancialService.getSummary();
    if (res.success && res.data) {
      setSummary(res.data);
      config?.onSuccess?.(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, loading, refetch: fetch };
}

// ─── Exchange Rates ───

export function useExchangeRates(base: Currency = 'TWD') {
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await FinancialService.getExchangeRates(base);
    if (res.success && res.data) setRates(res.data);
    setLoading(false);
  }, [base]);

  useEffect(() => { fetch(); }, [fetch]);

  return { rates, loading, refetch: fetch };
}
