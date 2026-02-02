import type {
  Supplier,
  SupplierType,
  SupplierStatus,
  SupplierContract,
  SupplierRating,
  PurchaseOrder,
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

export const SupplierService = {
  // ─── Suppliers ───
  getSuppliers: async (params?: {
    supplier_type?: SupplierType;
    is_active?: boolean;
    country?: string;
  }): Promise<ServiceResponse<Supplier[]>> => {
    const query = new URLSearchParams();
    if (params?.supplier_type) query.append('supplier_type', params.supplier_type);
    if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));
    if (params?.country) query.append('country', params.country);
    const qs = query.toString();
    return request<Supplier[]>(`/api/v1/suppliers${qs ? `?${qs}` : ''}`);
  },

  getSupplier: async (id: string): Promise<ServiceResponse<Supplier>> =>
    request<Supplier>(`/api/v1/suppliers/${id}`),

  createSupplier: async (data: Partial<Supplier>): Promise<ServiceResponse<Supplier>> =>
    request<Supplier>('/api/v1/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  updateSupplier: async (id: string, data: Partial<Supplier>): Promise<ServiceResponse<Supplier>> =>
    request<Supplier>(`/api/v1/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteSupplier: async (id: string): Promise<ServiceResponse<void>> =>
    request<void>(`/api/v1/suppliers/${id}`, { method: 'DELETE' }),

  getSupplierTypes: async (): Promise<ServiceResponse<any>> =>
    request<any>('/api/v1/suppliers/types/list'),
};
