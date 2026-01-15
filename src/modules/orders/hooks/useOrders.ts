/**
 * 訂單管理 Hooks
 * Order Management Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { OrderService } from '../services/orderService';
import type { Order, OrderQuery, CreateOrderData, UpdateOrderData, CancelOrderData } from '../../../core/types/order';
import { useToast } from '../../../store/useToastStore';

/**
 * 取得訂單列表 Hook
 */
export function useOrders(query?: OrderQuery) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await OrderService.getOrders(query);
    if (result.error) {
      setError(result.error);
      toast.error(result.error.message || '取得訂單列表失敗');
    } else {
      setOrders(result.data || []);
    }
    setLoading(false);
  }, [query, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

/**
 * 取得單一訂單 Hook
 */
export function useOrder(id: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

  const fetchOrder = useCallback(async () => {
    if (!id) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await OrderService.getOrder(id);
    if (result.error) {
      setError(result.error);
      toast.error(result.error.message || '取得訂單失敗');
    } else {
      setOrder(result.data);
    }
    setLoading(false);
  }, [id, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
}

/**
 * 建立訂單 Hook
 */
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const createOrder = useCallback(async (data: CreateOrderData) => {
    setLoading(true);
    const result = await OrderService.createOrder(data);
    setLoading(false);

    if (result.error) {
      toast.error(result.error.message || '建立訂單失敗');
      return { success: false, error: result.error };
    }

    toast.success('訂單建立成功');
    return { success: true, data: result.data };
  }, [toast]);

  return { createOrder, loading };
}

/**
 * 更新訂單 Hook
 */
export function useUpdateOrder() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const updateOrder = useCallback(async (id: string, data: UpdateOrderData) => {
    setLoading(true);
    const result = await OrderService.updateOrder(id, data);
    setLoading(false);

    if (result.error) {
      toast.error(result.error.message || '更新訂單失敗');
      return { success: false, error: result.error };
    }

    toast.success('訂單更新成功');
    return { success: true, data: result.data };
  }, [toast]);

  return { updateOrder, loading };
}

/**
 * 取消訂單 Hook
 */
export function useCancelOrder() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const cancelOrder = useCallback(async (id: string, data: CancelOrderData) => {
    setLoading(true);
    const result = await OrderService.cancelOrder(id, data);
    setLoading(false);

    if (result.error) {
      toast.error(result.error.message || '取消訂單失敗');
      return { success: false, error: result.error };
    }

    toast.success('訂單已取消');
    return { success: true, data: result.data };
  }, [toast]);

  return { cancelOrder, loading };
}
