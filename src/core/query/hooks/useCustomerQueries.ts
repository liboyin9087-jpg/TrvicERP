/**
 * 客戶相關 React Query Hooks
 * Customer React Query Hooks - 使用 BaseService + React Query
 */

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

/**
 * 取得客戶列表 (Read)
 * 
 * ✨ 優勢：
 * - 自動管理 loading/error 狀態
 * - 自動快取（5 分鐘內不重新 fetch）
 * - 自動去重（同時多個組件使用時只發送一次請求）
 * - 自動重試（失敗時重試 3 次）
 */
export function useCustomers(query?: CustomerQuery) {
  return useQuery({
    queryKey: queryKeys.customers.list(query),
    queryFn: async () => {
      const result = await CustomerService.getCustomers(query);
      if (result.error) {
        throw result.error; // React Query 會自動處理錯誤
      }
      return result.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 分鐘內資料視為新鮮
  });
}

/**
 * 取得單一客戶 (Read)
 */
export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const result = await CustomerService.getCustomer(id);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!id, // 只有當 id 存在時才執行查詢
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 取得客戶完整資料 (CDP) (Read)
 */
export function useCustomerProfile(id: string | null) {
  return useQuery({
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

/**
 * 取得客戶互動記錄 (Read)
 */
export function useCustomerInteractions(customerId: string | null) {
  return useQuery({
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
    staleTime: 1000 * 60 * 2, // 互動記錄 2 分鐘快取
  });
}

/**
 * 建立客戶 (Write)
 * 
 * ✨ 優勢：
 * - 成功後自動讓列表快取失效，觸發重新獲取
 * - 自動管理 loading 狀態
 * - 自動錯誤處理
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: CreateCustomerData) => {
      const result = await CustomerService.createCustomer(data);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      // 成功後，讓客戶列表快取失效，觸發重新獲取
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      // 也可以選擇性地更新快取（樂觀更新）
      // queryClient.setQueryData(queryKeys.customers.list(), (old: Customer[] = []) => {
      //   return [...old, data!];
      // });
      
      toast.success('客戶建立成功');
    },
    onError: (error: any) => {
      toast.error(error?.message || '建立客戶失敗');
    },
  });
}

/**
 * 更新客戶 (Write)
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomerData }) => {
      const result = await CustomerService.updateCustomer(id, data);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // 更新單一客戶快取
      queryClient.setQueryData(
        queryKeys.customers.detail(variables.id),
        data
      );
      
      // 讓列表快取失效
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      toast.success('客戶更新成功');
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新客戶失敗');
    },
  });
}

/**
 * 刪除客戶 (Write)
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await CustomerService.deleteCustomer(id);
      if (result.error) {
        throw result.error;
      }
      return id;
    },
    onSuccess: (id) => {
      // 從快取中移除
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(id) });
      
      // 讓列表快取失效
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      toast.success('客戶已刪除');
    },
    onError: (error: any) => {
      toast.error(error?.message || '刪除客戶失敗');
    },
  });
}

/**
 * 搜尋客戶 (Read with debounce)
 * 
 * 注意：這個 hook 需要配合 debounce 使用
 */
export function useCustomerSearch() {
  return useQuery({
    queryKey: queryKeys.customers.search(''), // 實際使用時需要動態設置
    queryFn: async ({ queryKey }) => {
      const keyword = queryKey[2] as string;
      if (!keyword.trim()) return [];
      
      const result = await CustomerService.searchCustomers(keyword);
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: false, // 預設不自動執行，需要手動觸發
    staleTime: 1000 * 60, // 搜尋結果 1 分鐘快取
  });
}
