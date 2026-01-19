/**
 * 訂單相關 React Query Hooks
 * Order React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '@/modules/orders/services/orderService';
import { queryKeys } from '../queryKeys';
import type {
  Order,
  OrderQuery,
  CreateOrderData,
  UpdateOrderData,
  CancelOrderData,
} from '@/core/types/order';
import { useToast } from '@/store/useToastStore';

/**
 * 取得訂單列表
 */
export function useOrders(query?: OrderQuery) {
  return useQuery({
    queryKey: queryKeys.orders.list(query),
    queryFn: async () => {
      const result = await OrderService.getOrders(query);
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 1000 * 60 * 3, // 訂單列表 3 分鐘快取
  });
}

/**
 * 取得單一訂單
 */
export function useOrder(id: string | null) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const result = await OrderService.getOrder(id);
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
 * 建立訂單
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      const result = await OrderService.createOrder(data);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      toast.success('訂單建立成功');
    },
    onError: (error: any) => {
      toast.error(error?.message || '建立訂單失敗');
    },
  });
}

/**
 * 更新訂單
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOrderData }) => {
      const result = await OrderService.updateOrder(id, data);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // 更新單一訂單快取
      queryClient.setQueryData(
        queryKeys.orders.detail(variables.id),
        data
      );
      
      // 讓列表快取失效
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      
      toast.success('訂單更新成功');
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新訂單失敗');
    },
  });
}

/**
 * 取消訂單
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CancelOrderData }) => {
      const result = await OrderService.cancelOrder(id, data);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        queryKeys.orders.detail(variables.id),
        data
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      toast.success('訂單已取消');
    },
    onError: (error: any) => {
      toast.error(error?.message || '取消訂單失敗');
    },
  });
}

/**
 * 刪除訂單
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await OrderService.deleteOrder(id);
      if (result.error) {
        throw result.error;
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.orders.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      toast.success('訂單已刪除');
    },
    onError: (error: any) => {
      toast.error(error?.message || '刪除訂單失敗');
    },
  });
}
