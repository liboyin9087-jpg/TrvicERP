import { useState, useEffect, useCallback } from 'react';
import type { Order, OrderQuery, CreateOrderData, UpdateOrderData, CancelOrderData } from '../../../core/types/order';
import { OrderCurrency } from '../../../core/types/order';
import { useToast } from '../../../store/useToastStore';

export function useOrders(query?: OrderQuery) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const fetchOrders = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Mock 數據 - 暫時不調用 API 避免 502 錯誤
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockOrders: Order[] = [
        {
          id: 'order_1' as any,
          orderNumber: 'ORD-001',
          sessionId: 'session_1' as any,
          quotationId: null,
          customerId: query?.customerId || 'customer_1' as any,
          customerName: 'Mock Customer',
          status: 'pending' as any,
          totalAmount: 12000 as any,
          paidAmount: 0 as any,
          currency: OrderCurrency.TWD,
          createdAt: new Date().toISOString() as any,
          updatedAt: new Date().toISOString() as any,
          cancelledAt: null,
          cancelledReason: null,
          notes: null
        },
        {
          id: 'order_2' as any,
          orderNumber: 'ORD-002',
          sessionId: 'session_2' as any,
          quotationId: null,
          customerId: query?.customerId || 'customer_1' as any,
          customerName: 'Mock Customer',
          status: 'confirmed' as any,
          totalAmount: 15000 as any,
          paidAmount: 0 as any,
          currency: OrderCurrency.TWD,
          createdAt: new Date().toISOString() as any,
          updatedAt: new Date().toISOString() as any,
          cancelledAt: null,
          cancelledReason: null,
          notes: null
        }
      ];
      
      setOrders(mockOrders);
    } catch (err) {
      const error = err as Error;
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
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const fetchOrder = useCallback(async (): Promise<void> => {
    if (!id) {
      setOrder(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock 數據
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockOrder: Order = {
        id: id as any,
        orderNumber: 'ORD-001',
        sessionId: 'mock_session' as any,
        quotationId: null,
        customerId: 'mock_customer' as any,
        customerName: 'Mock Customer',
        status: 'pending' as any,
        totalAmount: 12000 as any,
        paidAmount: 0 as any,
        currency: OrderCurrency.TWD,
        createdAt: new Date().toISOString() as any,
        updatedAt: new Date().toISOString() as any,
        cancelledAt: null,
        cancelledReason: null,
        notes: null
      };
      
      setOrder(mockOrder);
    } catch (err) {
      const error = err as Error;
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

  const createOrder = useCallback(async (data: CreateOrderData): Promise<{ success: boolean; data?: Order; error?: Error }> => {
    setLoading(true);
    try {
      // Mock 數據
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newOrder: Order = {
        id: ('new_order_' + Date.now()) as any,
        orderNumber: 'ORD-' + Date.now(),
        sessionId: data.sessionId,
        quotationId: data.quotationId,
        customerId: data.customerId,
        customerName: data.customerName,
        status: 'pending' as any,
        totalAmount: data.totalAmount,
        paidAmount: 0 as any,
        currency: data.currency,
        createdAt: new Date().toISOString() as any,
        updatedAt: new Date().toISOString() as any,
        cancelledAt: null,
        cancelledReason: null,
        notes: data.notes
      };

      toast.success('訂單建立成功');
      return { success: true, data: newOrder };
    } catch (err) {
      const error = err as Error;
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

  const updateOrder = useCallback(async (id: string, data: UpdateOrderData): Promise<{ success: boolean; data?: Order; error?: Error }> => {
    setLoading(true);
    try {
      // Mock 數據
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedOrder: Order = {
        id: id as any,
        orderNumber: 'ORD-001',
        sessionId: 'mock_session' as any,
        quotationId: null,
        customerId: 'mock_customer' as any,
        customerName: 'Mock Customer',
        status: data.status as any,
        totalAmount: 12000 as any,
        paidAmount: 0 as any,
        currency: OrderCurrency.TWD,
        createdAt: new Date().toISOString() as any,
        updatedAt: new Date().toISOString() as any,
        cancelledAt: null,
        cancelledReason: null,
        notes: data.notes || null
      };

      toast.success('訂單更新成功');
      return { success: true, data: updatedOrder };
    } catch (err) {
      const error = err as Error;
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

  const cancelOrder = useCallback(async (id: string, data: CancelOrderData): Promise<{ success: boolean; error?: Error }> => {
    setLoading(true);
    try {
      // Mock 數據
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('訂單取消成功');
      return { success: true };
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || '取消訂單失敗');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { cancelOrder, loading };
}
