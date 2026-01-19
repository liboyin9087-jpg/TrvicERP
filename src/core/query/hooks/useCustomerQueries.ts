import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerService } from '@/modules/customers/services/customerService';
import { queryKeys } from '../queryKeys';
import type {
  Customer,
  CustomerProfile,
  CustomerQuery,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerInteraction,
} from '@/core/types/customer';
import { useToast } from '@/store/useToastStore';
import { ErrorResponse } from '@/core/types/error';

export function useCustomers(query?: CustomerQuery) {
  return useQuery<Customer[], Error>({
    queryKey: queryKeys.customers.list(query),
    queryFn: async () => {
      const result = await CustomerService.getCustomers(query);
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCustomer(id: string | null) {
  return useQuery<Customer | null, Error>({
    queryKey: queryKeys.customers.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const result = await CustomerService.getCustomer(id);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCustomerProfile(id: string | null) {
  return useQuery<CustomerProfile | null, Error>({
    queryKey: queryKeys.customers.profile(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const result = await CustomerService.getCustomerProfile(id);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCustomerInteractions(customerId: string | null) {
  return useQuery<CustomerInteraction[], Error>({
    queryKey: queryKeys.customers.interactions(customerId || ''),
    queryFn: async () => {
      if (!customerId) return [];
      const result = await CustomerService.getCustomerInteractions(customerId);
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<Customer, ErrorResponse, CreateCustomerData>({
    mutationFn: async (data: CreateCustomerData) => {
      const result = await CustomerService.createCustomer(data);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      toast.success('客戶建立成功');
    },
    onError: (error) => {
      toast.error(error?.message || '建立客戶失敗');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<Customer, ErrorResponse, { id: string; data: UpdateCustomerData }>({
    mutationFn: async ({ id, data }) => {
      const result = await CustomerService.updateCustomer(id, data);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        queryKeys.customers.detail(variables.id),
        data
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      toast.success('客戶更新成功');
    },
    onError: (error) => {
      toast.error(error?.message || '更新客戶失敗');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<string, ErrorResponse, string>({
    mutationFn: async (id: string) => {
      const result = await CustomerService.deleteCustomer(id);
      if (result.error) {
        throw result.error;
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      toast.success('客戶已刪除');
    },
    onError: (error) => {
      toast.error(error?.message || '刪除客戶失敗');
    },
  });
}

export function useCustomerSearch() {
  return useQuery<Customer[], Error>({
    queryKey: queryKeys.customers.search(''),
    queryFn: async ({ queryKey }) => {
      const keyword = queryKey[2] as string;
      if (!keyword.trim()) return [];
      
      const result = await CustomerService.searchCustomers(keyword);
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: false,
    staleTime: 1000 * 60,
  });
}