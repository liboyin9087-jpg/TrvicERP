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
import { ServiceError } from '../../../core/types/service';

export function useCustomers(query?: CustomerQuery) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ServiceError | null>(null);
  const toast = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await CustomerService.getCustomers(query);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得客戶列表失敗');
      } else {
        setCustomers(result.data || []);
      }
    } catch (err) {
      const error = err as ServiceError;
      setError(error);
      toast.error(error.message || '取得客戶列表失敗');
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, loading, error, refetch: fetchCustomers };
}

export function useCustomer(id: string | null) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ServiceError | null>(null);
  const toast = useToast();

  const fetchCustomer = useCallback(async () => {
    if (!id) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await CustomerService.getCustomer(id);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得客戶失敗');
      } else {
        setCustomer(result.data);
      }
    } catch (err) {
      const error = err as ServiceError;
      setError(error);
      toast.error(error.message || '取得客戶失敗');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return { customer, loading, error, refetch: fetchCustomer };
}

export function useCustomerProfile(id: string | null) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ServiceError | null>(null);
  const toast = useToast();

  const fetchProfile = useCallback(async () => {
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await CustomerService.getCustomerProfile(id);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得客戶資料失敗');
      } else {
        setProfile(result.data);
      }
    } catch (err) {
      const error = err as ServiceError;
      setError(error);
      toast.error(error.message || '取得客戶資料失敗');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

export function useCreateCustomer() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const createCustomer = useCallback(
    async (data: CreateCustomerData) => {
      setLoading(true);
      try {
        const result = await CustomerService.createCustomer(data);
        if (result.error) {
          toast.error(result.error.message || '建立客戶失敗');
          return { success: false, error: result.error };
        }
        toast.success('客戶建立成功');
        return { success: true, data: result.data };
      } catch (err) {
        const error = err as ServiceError;
        toast.error(error.message || '建立客戶失敗');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { createCustomer, loading };
}

export function useUpdateCustomer() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const updateCustomer = useCallback(
    async (id: string, data: UpdateCustomerData) => {
      setLoading(true);
      try {
        const result = await CustomerService.updateCustomer(id, data);
        if (result.error) {
          toast.error(result.error.message || '更新客戶失敗');
          return { success: false, error: result.error };
        }
        toast.success('客戶更新成功');
        return { success: true, data: result.data };
      } catch (err) {
        const error = err as ServiceError;
        toast.error(error.message || '更新客戶失敗');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { updateCustomer, loading };
}

export function useDeleteCustomer() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const deleteCustomer = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const result = await CustomerService.deleteCustomer(id);
        if (result.error) {
          toast.error(result.error.message || '刪除客戶失敗');
          return { success: false, error: result.error };
        }
        toast.success('客戶已刪除');
        return { success: true };
      } catch (err) {
        const error = err as ServiceError;
        toast.error(error.message || '刪除客戶失敗');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { deleteCustomer, loading };
}

export function useCustomerInteractions(customerId: string | null) {
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ServiceError | null>(null);
  const toast = useToast();

  const fetchInteractions = useCallback(async () => {
    if (!customerId) {
      setInteractions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await CustomerService.getCustomerInteractions(customerId);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得互動記錄失敗');
      } else {
        setInteractions(result.data || []);
      }
    } catch (err) {
      const error = err as ServiceError;
      setError(error);
      toast.error(error.message || '取得互動記錄失敗');
    } finally {
      setLoading(false);
    }
  }, [customerId, toast]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  return { interactions, loading, error, refetch: fetchInteractions };
}

export function useCustomerSearch() {
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await CustomerService.searchCustomers(keyword);
      setResults(result.data || []);
    } catch (err) {
      const error = err as ServiceError;
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}