import type {
  Invoice,
  InvoiceStatus,
  AccountsReceivable,
  AccountsPayable,
  Currency,
  ExchangeRate,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

type ServiceResponse<T> = {
  data?: T;
  error?: { message: string; code?: string; details?: any };
  success: boolean;
};

async function request<T>(url: string, options?: RequestInit): Promise<ServiceResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: { message: err.detail || res.statusText, code: String(res.status) } };
    }
    if (res.status === 204) return { success: true, data: undefined as any };
    const data = await res.json();
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: { message: e.message || 'Network error' } };
  }
}

export const FinancialService = {
  // ─── Invoices ───
  getInvoices: async (params?: { status?: InvoiceStatus; customer_id?: string; currency?: Currency }): Promise<ServiceResponse<Invoice[]>> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.customer_id) query.append('customer_id', params.customer_id);
    if (params?.currency) query.append('currency', params.currency);
    const qs = query.toString();
    return request<Invoice[]>(`/api/v1/financial/invoices${qs ? `?${qs}` : ''}`);
  },

  getInvoice: async (id: string): Promise<ServiceResponse<Invoice>> =>
    request<Invoice>(`/api/v1/financial/invoices/${id}`),

  createInvoice: async (data: Partial<Invoice>): Promise<ServiceResponse<Invoice>> =>
    request<Invoice>('/api/v1/financial/invoices', { method: 'POST', body: JSON.stringify(data) }),

  updateInvoice: async (id: string, data: Partial<Invoice>): Promise<ServiceResponse<Invoice>> =>
    request<Invoice>(`/api/v1/financial/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteInvoice: async (id: string): Promise<ServiceResponse<void>> =>
    request<void>(`/api/v1/financial/invoices/${id}`, { method: 'DELETE' }),

  sendInvoice: async (id: string): Promise<ServiceResponse<Invoice>> =>
    request<Invoice>(`/api/v1/financial/invoices/${id}/send`, { method: 'POST' }),

  recordPayment: async (id: string, amount: number, paymentMethod?: string): Promise<ServiceResponse<Invoice>> =>
    request<Invoice>(`/api/v1/financial/invoices/${id}/record-payment?amount=${amount}&payment_method=${paymentMethod || 'bank_transfer'}`, { method: 'POST' }),

  // ─── Accounts Receivable ───
  getAccountsReceivable: async (params?: { status?: string; customer_id?: string }): Promise<ServiceResponse<AccountsReceivable[]>> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.customer_id) query.append('customer_id', params.customer_id);
    return request<AccountsReceivable[]>(`/api/v1/financial/ar?${query.toString()}`);
  },

  createAR: async (data: Partial<AccountsReceivable>): Promise<ServiceResponse<AccountsReceivable>> =>
    request<AccountsReceivable>('/api/v1/financial/ar', { method: 'POST', body: JSON.stringify(data) }),

  // ─── Accounts Payable ───
  getAccountsPayable: async (params?: { status?: string; supplier_id?: string }): Promise<ServiceResponse<AccountsPayable[]>> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.supplier_id) query.append('supplier_id', params.supplier_id);
    return request<AccountsPayable[]>(`/api/v1/financial/ap?${query.toString()}`);
  },

  createAP: async (data: Partial<AccountsPayable>): Promise<ServiceResponse<AccountsPayable>> =>
    request<AccountsPayable>('/api/v1/financial/ap', { method: 'POST', body: JSON.stringify(data) }),

  // ─── Exchange Rates ───
  getExchangeRates: async (base: Currency = 'TWD'): Promise<ServiceResponse<ExchangeRate>> =>
    request<ExchangeRate>(`/api/v1/financial/exchange-rates?base=${base}`),

  // ─── Financial Summary ───
  getSummary: async (): Promise<ServiceResponse<any>> =>
    request<any>('/api/v1/financial/summary'),
};
