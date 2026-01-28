/**
 * 訂單管理 Hooks
 * Order Management Hooks
 *
 * 修復規範:
 * - 移除全域 Store (useToast) 依賴，改為透過 Config Props 注入。
 * - 引入統一的 ApiError 和 ToastService 介面，規範錯誤處理。
 * - 定義各 Hook 的 Config Props 介面，提供類型約束。
 * - 錯誤處理訊息透過注入的 ToastService 處理，避免硬編碼。
 */

import { useState, useEffect, useCallback } from 'react';
import { OrderService } from '../services/orderService';
import type { Order, OrderQuery, CreateOrderData, UpdateOrderData, CancelOrderData } from '../../../core/types/order';

// --- 全局類型定義 (為Kintone獨立性和統一錯誤處理服務) ---

/**
 * 定義 API 錯誤結構
 */
interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * 定義 API 服務回傳結構
 * 統一處理成功數據和錯誤信息
 */
interface ApiResult<T> {
  data?: T;
  error?: ApiError;
}

/**
 * 定義 Toast 服務介面，用於依賴注入
 * 允許元件層面自行提供符合此介面的 Toast 實現
 */
interface ToastService {
  success: (message: string) => void;
  error: (message: string) => void;
}

// --- Hook 配置介面 ---

/**
 * 取得訂單列表 Hook 的配置參數
 */
interface UseOrdersConfig {
  query?: OrderQuery;
  toastService: ToastService;
  onSuccess?: (orders: Order[]) => void;
  onError?: (error: ApiError) => void;
}

/**
 * 取得單一訂單 Hook 的配置參數
 */
interface UseOrderConfig {
  id: string | null;
  toastService: ToastService;
  onSuccess?: (order: Order | null) => void;
  onError?: (error: ApiError) => void;
}

/**
 * 建立訂單 Hook 的配置參數
 */
interface UseCreateOrderConfig {
  toastService: ToastService;
  onSuccess?: (order: Order) => void;
  onError?: (error: ApiError) => void;
}

/**
 * 更新訂單 Hook 的配置參數
 */
interface UseUpdateOrderConfig {
  toastService: ToastService;
  onSuccess?: (order: Order) => void;
  onError?: (error: ApiError) => void;
}

/**
 * 取消訂單 Hook 的配置參數
 */
interface UseCancelOrderConfig {
  toastService: ToastService;
  onSuccess?: (order: Order) => void;
  onError?: (error: ApiError) => void;
}

// --- 統一的 API 錯誤處理輔助函數 (為可復用性和減少重複代碼) ---

/**
 * 處理 API 錯誤的通用邏輯
 * @param error API 錯誤對象
 * @param toastService 注入的 toast 服務
 * @param defaultMessage 預設的錯誤訊息
 * @param onError 外部提供的錯誤回調
 */
const handleApiError = (
  error: ApiError,
  toastService: ToastService,
  defaultMessage: string,
  onError?: (error: ApiError) => void
) => {
  const displayMessage = error.message || defaultMessage;
  toastService.error(displayMessage);
  if (onError) {
    onError(error);
  }
};

// --- 重寫後的 Hooks ---

/**
 * 取得訂單列表 Hook
 */
export function useOrders(config: UseOrdersConfig) {
  const { query, toastService, onSuccess, onError } = config;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result: ApiResult<Order[]> = await OrderService.getOrders(query);
      if (result.error) {
        setError(result.error);
        handleApiError(result.error, toastService, '取得訂單列表失敗', onError);
      } else {
        const fetchedOrders = result.data || [];
        setOrders(fetchedOrders);
        if (onSuccess) {
          onSuccess(fetchedOrders);
        }
      }
    } catch (e) {
      const genericError: ApiError = { message: e instanceof Error ? e.message : String(e) };
      setError(genericError);
      handleApiError(genericError, toastService, '服務器錯誤，無法取得訂單列表', onError);
    } finally {
      setLoading(false);
    }
  }, [query, toastService, onSuccess, onError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

/**
 * 取得單一訂單 Hook
 */
export function useOrder(config: UseOrderConfig) {
  const { id, toastService, onSuccess, onError } = config;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) {
      setOrder(null);
      setLoading(false);
      setError(null); // Clear error if ID is null
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result: ApiResult<Order> = await OrderService.getOrder(id);
      if (result.error) {
        setError(result.error);
        handleApiError(result.error, toastService, '取得訂單失敗', onError);
      } else {
        setOrder(result.data || null);
        if (onSuccess) {
          onSuccess(result.data || null);
        }
      }
    } catch (e) {
      const genericError: ApiError = { message: e instanceof Error ? e.message : String(e) };
      setError(genericError);
      handleApiError(genericError, toastService, '服務器錯誤，無法取得訂單', onError);
    } finally {
      setLoading(false);
    }
  }, [id, toastService, onSuccess, onError]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
}

/**
 * 建立訂單 Hook
 */
export function useCreateOrder(config: UseCreateOrderConfig) {
  const { toastService, onSuccess, onError } = config;
  const [loading, setLoading] = useState(false);

  const createOrder = useCallback(async (data: CreateOrderData) => {
    setLoading(true);
    try {
      const result: ApiResult<Order> = await OrderService.createOrder(data);
      if (result.error) {
        handleApiError(result.error, toastService, '建立訂單失敗', onError);
        return { success: false, error: result.error };
      } else {
        toastService.success('訂單建立成功');
        if (result.data && onSuccess) {
          onSuccess(result.data);
        }
        return { success: true, data: result.data };
      }
    } catch (e) {
      const genericError: ApiError = { message: e instanceof Error ? e.message : String(e) };
      handleApiError(genericError, toastService, '服務器錯誤，無法建立訂單', onError);
      return { success: false, error: genericError };
    } finally {
      setLoading(false);
    }
  }, [toastService, onSuccess, onError]);

  return { createOrder, loading };
}

/**
 * 更新訂單 Hook
 */
export function useUpdateOrder(config: UseUpdateOrderConfig) {
  const { toastService, onSuccess, onError } = config;
  const [loading, setLoading] = useState(false);

  const updateOrder = useCallback(async (id: string, data: UpdateOrderData) => {
    setLoading(true);
    try {
      const result: ApiResult<Order> = await OrderService.updateOrder(id, data);
      if (result.error) {
        handleApiError(result.error, toastService, '更新訂單失敗', onError);
        return { success: false, error: result.error };
      } else {
        toastService.success('訂單更新成功');
        if (result.data && onSuccess) {
          onSuccess(result.data);
        }
        return { success: true, data: result.data };
      }
    } catch (e) {
      const genericError: ApiError = { message: e instanceof Error ? e.message : String(e) };
      handleApiError(genericError, toastService, '服務器錯誤，無法更新訂單', onError);
      return { success: false, error: genericError };
    } finally {
      setLoading(false);
    }
  }, [toastService, onSuccess, onError]);

  return { updateOrder, loading };
}

/**
 * 取消訂單 Hook
 */
export function useCancelOrder(config: UseCancelOrderConfig) {
  const { toastService, onSuccess, onError } = config;
  const [loading, setLoading] = useState(false);

  const cancelOrder = useCallback(async (id: string, data: CancelOrderData) => {
    setLoading(true);
    try {
      const result: ApiResult<Order> = await OrderService.cancelOrder(id, data);
      if (result.error) {
        handleApiError(result.error, toastService, '取消訂單失敗', onError);
        return { success: false, error: result.error };
      } else {
        toastService.success('訂單已取消');
        if (result.data && onSuccess) {
          onSuccess(result.data);
        }
        return { success: true, data: result.data };
      }
    } catch (e) {
      const genericError: ApiError = { message: e instanceof Error ? e.message : String(e) };
      handleApiError(genericError, toastService, '服務器錯誤，無法取消訂單', onError);
      return { success: false, error: genericError };
    } finally {
      setLoading(false);
    }
  }, [toastService, onSuccess, onError]);

  return { cancelOrder, loading };
}