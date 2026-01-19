import { useState, useEffect, useCallback } from 'react';
import { OrderService } from '../services/orderService';
import type { Order, OrderQuery, CreateOrderData, UpdateOrderData, CancelOrderData } from '../../../core/types/order';
import { useToast } from '../../../store/useToastStore';
import { ServiceError } from '../../../core/types/service';

export function useOrders(query?: OrderQuery) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ServiceError | null>(null);
  const toast = useToast();

  const fetchOrders = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await OrderService.getOrders(query);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得訂單列表失敗');
      } else {
        setOrders(result.data || []);
      }
    } catch (err) {
      const error = err as ServiceError;
      setError(error);
      toast.error(error.message || '取得訂單列表失敗');
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

export function useOrder(id: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ServiceError | null>(null);
  const toast = useToast();

  const fetchOrder = useCallback(async (): Promise<void> => {
    if (!id) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await OrderService.getOrder(id);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得訂單失敗');
      } else {
        setOrder(result.data);
      }
    } catch (err) {
      const error = err as ServiceError;
      setError(error);
      toast.error(error.message || '取得訂單失敗');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
}

export function useCreateOrder() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const createOrder = useCallback(async (data: CreateOrderData): Promise<{ success: boolean; data?: Order; error?: ServiceError }> => {
    setLoading(true);
    try {
      const result = await OrderService.createOrder(data);
      if (result.error) {
        toast.error(result.error.message || '建立訂單失敗');
        return { success: false, error: result.error };
      }

      toast.success('訂單建立成功');
      return { success: true, data: result.data };
    } catch (err) {
      const error = err as ServiceError;
      toast.error(error.message || '建立訂單失敗');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { createOrder, loading };
}

export function useUpdateOrder() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const updateOrder = useCallback(async (id: string, data: UpdateOrderData): Promise<{ success: boolean; data?: Order; error?: ServiceError }> => {
    setLoading(true);
    try {
      const result = await OrderService.updateOrder(id, data);
      if (result.error) {
        toast.error(result.error.message || '更新訂單失敗');
        return { success: false, error: result.error };
      }

      toast.success('訂單更新成功');
      return { success: true, data: result.data };
    } catch (err) {
      const error = err as ServiceError;
      toast.error(error.message || '更新訂單失敗');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { updateOrder, loading };
}

export function useCancelOrder() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const cancelOrder = useCallback(async (id: string, data: CancelOrderData): Promise<{ success: boolean; data?: Order; error?: ServiceError }> => {
    setLoading(true);
    try {
      const result = await OrderService.cancelOrder(id, data);
      if (result.error) {
        toast.error(result.error.message || '取消訂單失敗');
        return { success: false, error: result.error };
      }

      toast.success('訂單已取消');
      return { success: true, data: result.data };
    } catch (err) {
      const error = err as ServiceError;
      toast.error(error.message || '取消訂單失敗');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { cancelOrder, loading };
}