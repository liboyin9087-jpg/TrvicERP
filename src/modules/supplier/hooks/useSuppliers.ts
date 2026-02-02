import { useState, useEffect, useCallback } from 'react';
import { SupplierService } from '../services/supplierService';
import type { Supplier, SupplierType } from '../types';

interface BaseHookConfig {
  onSuccess?: (data: any) => void;
  onError?: (error: { message: string }) => void;
}

// ─── List Suppliers ───

export function useSuppliers(config?: BaseHookConfig & { supplier_type?: SupplierType; is_active?: boolean }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await SupplierService.getSuppliers({
      supplier_type: config?.supplier_type,
      is_active: config?.is_active,
    });
    if (res.success && res.data) {
      setSuppliers(res.data);
      config?.onSuccess?.(res.data);
    } else if (res.error) {
      setError(res.error);
      config?.onError?.(res.error);
    }
    setLoading(false);
  }, [config?.supplier_type, config?.is_active]);

  useEffect(() => { fetch(); }, [fetch]);

  return { suppliers, loading, error, refetch: fetch };
}

// ─── Single Supplier ───

export function useSupplier(id: string | null, config?: BaseHookConfig) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await SupplierService.getSupplier(id);
    if (res.success && res.data) {
      setSupplier(res.data);
      config?.onSuccess?.(res.data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { supplier, loading, refetch: fetch };
}

// ─── Create ───

export function useCreateSupplier(config?: BaseHookConfig) {
  const [loading, setLoading] = useState(false);

  const createSupplier = useCallback(async (data: Partial<Supplier>) => {
    setLoading(true);
    const res = await SupplierService.createSupplier(data);
    setLoading(false);
    if (res.success) config?.onSuccess?.(res.data);
    else config?.onError?.(res.error || { message: 'Failed to create supplier' });
    return res;
  }, [config?.onSuccess, config?.onError]);

  return { createSupplier, loading };
}

// ─── Update ───

export function useUpdateSupplier(config?: BaseHookConfig) {
  const [loading, setLoading] = useState(false);

  const updateSupplier = useCallback(async (id: string, data: Partial<Supplier>) => {
    setLoading(true);
    const res = await SupplierService.updateSupplier(id, data);
    setLoading(false);
    if (res.success) config?.onSuccess?.(res.data);
    else config?.onError?.(res.error || { message: 'Failed to update supplier' });
    return res;
  }, [config?.onSuccess, config?.onError]);

  return { updateSupplier, loading };
}

// ─── Delete ───

export function useDeleteSupplier(config?: BaseHookConfig) {
  const [loading, setLoading] = useState(false);

  const deleteSupplier = useCallback(async (id: string) => {
    setLoading(true);
    const res = await SupplierService.deleteSupplier(id);
    setLoading(false);
    if (res.success) config?.onSuccess?.(id);
    else config?.onError?.(res.error || { message: 'Failed to delete supplier' });
    return res;
  }, [config?.onSuccess, config?.onError]);

  return { deleteSupplier, loading };
}

// ─── Supplier Types ───

export function useSupplierTypes() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    SupplierService.getSupplierTypes().then((res) => {
      if (res.success && res.data) setTypes(res.data.types || []);
      setLoading(false);
    });
  }, []);

  return { types, loading };
}
