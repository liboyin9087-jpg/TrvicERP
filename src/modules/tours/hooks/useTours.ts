/**
 * 行程產品管理 Hooks
 * Tour Product Management Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { TourService } from '../services/tourService';
import type {
  Tour,
  TourQuery,
  CreateTourData,
  UpdateTourData,
} from '../../../core/types/tour';

// 1. [architect] [架構] 缺少明確的 Config Props 介面定義
//    定義基礎的 Toast 功能介面，用於傳遞給 Hooks
interface UseToastConfig {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

// 2. [architect] [架構] 缺少明確的 Config Props 介面定義
//    為每個需要配置的 Hook 定義專屬的 Config 介面
interface UseToursConfig extends UseToastConfig {}
interface UseTourConfig extends UseToastConfig {}
interface UseCreateTourConfig extends UseToastConfig {}
interface UseUpdateTourConfig extends UseToastConfig {}
interface UseDeleteTourConfig extends UseToastConfig {}
interface UseCloneTourConfig extends UseToastConfig {}

// 3. [architect] [架構] 錯誤處理重複性高
//    抽取通用的錯誤處理邏輯，包含錯誤訊息顯示和狀態更新
function handleServiceError(
  error: any,
  showErrorToast: (message: string) => void,
  defaultMessage: string,
  setError?: (error: any) => void
) {
  const message = error?.message || defaultMessage;
  showErrorToast(message);
  if (setError) {
    setError(error);
  }
}

// 4. [architect] [架構] 錯誤處理重複性高
//    抽取通用的成功訊息處理邏輯
function handleServiceSuccess(
  showSuccessToast: (message: string) => void,
  message: string
) {
  showSuccessToast(message);
}

/**
 * 取得行程列表 Hook
 */
export function useTours(query: TourQuery | undefined, config: UseToursConfig) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await TourService.getTours(query);
    if (result.error) {
      // [architect] [架構] 錯誤處理重複性高
      // 使用抽象化的錯誤處理函數
      handleServiceError(
        result.error,
        config.showError, // [architect] [架構] 使用全域 Store (useToast) 而非透過 Props 傳遞
        '取得行程列表失敗',
        setError
      );
    } else {
      setTours(result.data || []);
    }
    setLoading(false);
  }, [query, config.showError]); // 依賴於 config.showError

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  return { tours, loading, error, refetch: fetchTours };
}

/**
 * 取得單一行程 Hook
 */
export function useTour(id: string | null, config: UseTourConfig) {
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchTour = useCallback(async () => {
    if (!id) {
      setTour(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await TourService.getTour(id);
    if (result.error) {
      // [architect] [架構] 錯誤處理重複性高
      handleServiceError(
        result.error,
        config.showError, // [architect] [架構] 使用全域 Store (useToast) 而非透過 Props 傳遞
        '取得行程失敗',
        setError
      );
    } else {
      setTour(result.data);
    }
    setLoading(false);
  }, [id, config.showError]); // 依賴於 config.showError

  useEffect(() => {
    fetchTour();
  }, [fetchTour]);

  return { tour, loading, error, refetch: fetchTour };
}

/**
 * 建立行程 Hook
 */
export function useCreateTour(config: UseCreateTourConfig) {
  const [loading, setLoading] = useState(false);

  const createTour = useCallback(
    async (data: CreateTourData) => {
      setLoading(true);
      const result = await TourService.createTour(data);
      setLoading(false);

      if (result.error) {
        // [architect] [架構] 錯誤處理重複性高
        handleServiceError(
          result.error,
          config.showError, // [architect] [架構] 使用全域 Store (useToast) 而非透過 Props 傳遞
          '建立行程失敗'
        );
        return { success: false, error: result.error };
      }

      // [architect] [架構] 錯誤處理重複性高
      handleServiceSuccess(
        config.showSuccess, // [architect] [架構] 使用全域 Store (useToast) 而非透過 Props 傳遞
        '行程建立成功'
      );
      return { success: true, data: result.data };
    },
    [config.showError, config.showSuccess] // 依賴於 config 中的 toast 函數
  );

  return { createTour, loading };
}

/**
 * 更新行程 Hook
 */
export function useUpdateTour(config: UseUpdateTourConfig) {
  const [loading, setLoading] = useState(false);

  const updateTour = useCallback(
    async (id: string, data: UpdateTourData) => {
      setLoading(true);
      const result = await TourService.updateTour(id, data);
      setLoading(false);

      if (result.error) {
        // [architect] [架構] 錯誤處理重複性高
        handleServiceError(
          result.error,
          config.showError, // [architect] [架構] 使用全域 Store (useToast) 而非透過 Props 傳遞
          '更新行程失敗'
        );
        return { success: false, error: result.error };
      }

      // [architect] [架構] 錯誤處理重複性高
      handleServiceSuccess(
        config.showSuccess, // [architect] [架構] 使用全域 Store (useToast) 而非透過 Props 傳遞
        '行程更新成功'
      );
      return { success: true, data: result.data };
    },
    [config.showError, config.showSuccess] // 依賴於 config 中的 toast 函數
  );

  return { updateTour, loading };
}

/**
 * 刪除行程 Hook
 */
export function useDeleteTour(config: UseDeleteTourConfig) {
  const [loading, setLoading] = useState(false);

  const deleteTour = useCallback(
    async (id: string) => {
      setLoading(true);
      const result = await TourService.deleteTour(id);
      setLoading(false);

      if (result.error) {
        // [architect] [架構] 錯誤處理重複性高
        handleServiceError(
          result.error,
          config.showError, // [architect] [架構] 使用全域 Store (useToast) 而非透過 Props 傳遞
          '刪除行程失敗'
        );
        return { success: false, error: result.error };
      }

      // [architect] [架構] 錯誤處理重複性高
      handleServiceSuccess(
        config.showSuccess, // [architect] [架構] 使用全域 Store (useToast) 而非透過 Props 傳遞
        '行程已刪除'
      );
      return { success: true };
    },
    [config.showError, config.showSuccess] // 依賴於 config 中的 toast 函數
  );

  return { deleteTour, loading };
}

/**
 * 複製行程 Hook
 */
export function useCloneTour(config: UseCloneTourConfig) {
  const [loading, setLoading] = useState(false);

  const cloneTour = useCallback(
    async (id: string, newCode?: string) => {
      setLoading(true);
      const result = await TourService.cloneTour(id, newCode);
      setLoading(false);

      if (result.error) {
        // [architect] [架構] 錯誤處理重複性高
        handleServiceError(
          result.error,
          config.showError, // [architect] [架構] 使用全域 Store (useToast) 而非透過 Props 傳遞
          '複製行程失敗'
        );
        return { success: false, error: result.error };
      }

      // [architect] [架構] 錯誤處理重複性高
      handleServiceSuccess(
        config.showSuccess, // [architect] [架構] 使用全域 Store (useToast) 而非透過 Props 傳遞
        '行程複製成功'
      );
      return { success: true, data: result.data };
    },
    [config.showError, config.showSuccess] // 依賴於 config 中的 toast 函數
  );

  return { cloneTour, loading };
}

/**
 * 搜尋行程 Hook
 * (此 Hook 不涉及 toast 通知，因此不需 UseToastConfig)
 * [architect] [架構] 符合 Single Responsibility 原則：此 Hook 專注於搜尋邏輯和結果管理
 */
export function useTourSearch() {
  const [results, setResults] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const result = await TourService.searchTours(keyword);
    // 搜尋功能通常不需要錯誤通知給用戶，只需顯示空結果或內部紀錄錯誤
    // 若需錯誤通知，可擴展此 Hook 的 Config 介面
    setResults(result.data || []);
    setLoading(false);
  }, []);

  return { results, loading, search };
}