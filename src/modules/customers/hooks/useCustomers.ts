/**
 * 客戶管理 Hooks
 * Customer Management Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customerService';
import type {
  Customer,
  CustomerProfile,
  CustomerQuery,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerInteraction,
} from '../../../core/types/customer';
import { useToast } from '../../../store/useToastStore';

/**
 * 取得客戶列表 Hook
 */
export function useCustomers(query?: CustomerQuery) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await CustomerService.getCustomers(query);
    if (result.error) {
      setError(result.error);
      toast.error(result.error.message || '取得客戶列表失敗');
    } else {
      setCustomers(result.data || []);
    }
    setLoading(false);
  }, [query, toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, loading, error, refetch: fetchCustomers };
}

/**
 * 取得單一客戶 Hook
 */
export function useCustomer(id: string | null) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

  const fetchCustomer = useCallback(async () => {
    if (!id) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await CustomerService.getCustomer(id);
    if (result.error) {
      setError(result.error);
      toast.error(result.error.message || '取得客戶失敗');
    } else {
      setCustomer(result.data);
    }
    setLoading(false);
  }, [id, toast]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return { customer, loading, error, refetch: fetchCustomer };
}

/**
 * 取得客戶完整資料 Hook (CDP)
 */
export function useCustomerProfile(id: string | null) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

  const fetchProfile = useCallback(async () => {
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await CustomerService.getCustomerProfile(id);
    if (result.error) {
      setError(result.error);
      toast.error(result.error.message || '取得客戶資料失敗');
    } else {
      setProfile(result.data);
    }
    setLoading(false);
  }, [id, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

/**
 * 建立客戶 Hook
 */
export function useCreateCustomer() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const createCustomer = useCallback(
    async (data: CreateCustomerData) => {
      setLoading(true);
      const result = await CustomerService.createCustomer(data);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '建立客戶失敗');
        return { success: false, error: result.error };
      }

      toast.success('客戶建立成功');
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { createCustomer, loading };
}

/**
 * 更新客戶 Hook
 */
export function useUpdateCustomer() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const updateCustomer = useCallback(
    async (id: string, data: UpdateCustomerData) => {
      setLoading(true);
      const result = await CustomerService.updateCustomer(id, data);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '更新客戶失敗');
        return { success: false, error: result.error };
      }

      toast.success('客戶更新成功');
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { updateCustomer, loading };
}

/**
 * 刪除客戶 Hook
 */
export function useDeleteCustomer() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const deleteCustomer = useCallback(
    async (id: string) => {
      setLoading(true);
      const result = await CustomerService.deleteCustomer(id);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '刪除客戶失敗');
        return { success: false, error: result.error };
      }

      toast.success('客戶已刪除');
      return { success: true };
    },
    [toast]
  );

  return { deleteCustomer, loading };
}

/**
 * 客戶互動記錄 Hook
 */
export function useCustomerInteractions(customerId: string | null) {
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

  const fetchInteractions = useCallback(async () => {
    if (!customerId) {
      setInteractions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await CustomerService.getCustomerInteractions(customerId);
    if (result.error) {
      setError(result.error);
      toast.error(result.error.message || '取得互動記錄失敗');
    } else {
      setInteractions(result.data || []);
    }
    setLoading(false);
  }, [customerId, toast]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  return { interactions, loading, error, refetch: fetchInteractions };
}

/**
 * 搜尋客戶 Hook
 */
export function useCustomerSearch() {
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const result = await CustomerService.searchCustomers(keyword);
    setResults(result.data || []);
    setLoading(false);
  }, []);

  return { results, loading, search };
}
