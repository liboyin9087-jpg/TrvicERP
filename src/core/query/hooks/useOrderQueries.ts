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
import { ErrorResponse } from '@/core/types/error';

export function useOrders(query?: OrderQuery) {
  return useQuery<Order[], Error>({
    queryKey: queryKeys.orders.list(query),
    queryFn: async () => {
      const result = await OrderService.getOrders(query);
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 1000 * 60 * 3,
  });
}

export function useOrder(id: string | null) {
  return useQuery<Order | null, Error>({
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

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<Order, ErrorResponse, CreateOrderData>({
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
    onError: (error: ErrorResponse) => {
      toast.error(error?.message || '建立訂單失敗');
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<Order, ErrorResponse, { id: string; data: UpdateOrderData }>({
    mutationFn: async ({ id, data }) => {
      const result = await OrderService.updateOrder(id, data);
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
      toast.success('訂單更新成功');
    },
    onError: (error: ErrorResponse) => {
      toast.error(error?.message || '更新訂單失敗');
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<Order, ErrorResponse, { id: string; data: CancelOrderData }>({
    mutationFn: async ({ id, data }) => {
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
    onError: (error: ErrorResponse) => {
      toast.error(error?.message || '取消訂單失敗');
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<string, ErrorResponse, string>({
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
    onError: (error: ErrorResponse) => {
      toast.error(error?.message || '刪除訂單失敗');
    },
  });
}