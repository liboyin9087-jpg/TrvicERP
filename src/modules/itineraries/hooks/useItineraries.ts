/**
 * 行程安排管理 Hooks
 * Itinerary Management Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { ItineraryService } from '../services/itineraryService';
import type {
  Itinerary,
  DayItinerary,
} from '../../../core/types/itinerary';
// 移除對全域 Store (useToast) 的直接依賴，改為透過 Config Props 傳遞

/**
 * 針對本檔案所有 Hooks 提供的設定介面
 * 允許外部注入訊息提示機制，而非直接依賴全域 Store。
 * 符合 Kintone 獨立性原則，使 Hooks 更具可移植性和可配置性。
 * 命名規範為 {file_path_name}Config，此處為 UseItinerariesConfig。
 */
export interface UseItinerariesConfig {
  /**
   * 成功訊息提示的回調函數
   * 當操作成功時被呼叫，傳遞提示訊息內容。
   */
  onSuccess?: (message: string) => void;
  /**
   * 錯誤訊息提示的回調函數
   * 當操作失敗時被呼叫，傳遞錯誤訊息內容和原始錯誤物件 (可選)。
   */
  onError?: (message: string, error?: any) => void;
}

/**
 * 取得行程安排 Hook
 * 符合 Single Responsibility 原則，專注於獲取行程資料。
 * 不包含任何 UI/樣式相關程式碼。
 */
export function useItinerary(sessionId: string | null, config?: UseItinerariesConfig) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchItinerary = useCallback(async () => {
    if (!sessionId) {
      setItinerary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await ItineraryService.getItinerary(sessionId);
    if (result.error) {
      setError(result.error);
      // 不顯示錯誤訊息，因為可能是尚未建立行程 (特定錯誤碼 'NOT_FOUND')
      // 如果是其他錯誤，則透過 config.onError 傳遞給調用者處理
      if (result.error.code !== 'NOT_FOUND') {
        config?.onError?.(result.error.message || '取得行程安排失敗', result.error);
      }
    } else {
      setItinerary(result.data);
    }
    setLoading(false);
  }, [sessionId, config]); // 將 config 加入依賴，確保其更新時 useCallback 能重新生成

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  return { itinerary, loading, error, refetch: fetchItinerary };
}

/**
 * 建立行程安排 Hook
 * 符合 Single Responsibility 原則，專注於建立行程資料。
 * 不包含任何 UI/樣式相關程式碼。
 */
export function useCreateItinerary(config?: UseItinerariesConfig) {
  const [loading, setLoading] = useState(false);

  const createItinerary = useCallback(
    async (
      sessionId: string,
      data: Omit<Itinerary, 'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt' | 'createdBy'>
    ) => {
      setLoading(true);
      const result = await ItineraryService.createItinerary(sessionId, data);
      setLoading(false);

      if (result.error) {
        config?.onError?.(result.error.message || '建立行程安排失敗', result.error);
        return { success: false, error: result.error };
      }

      config?.onSuccess?.('行程安排建立成功');
      return { success: true, data: result.data };
    },
    [config] // 將 config 加入依賴，確保其更新時 useCallback 能重新生成
  );

  return { createItinerary, loading };
}

/**
 * 更新行程安排 Hook
 * 符合 Single Responsibility 原則，專注於更新行程資料。
 * 不包含任何 UI/樣式相關程式碼。
 */
export function useUpdateItinerary(config?: UseItinerariesConfig) {
  const [loading, setLoading] = useState(false);

  const updateItinerary = useCallback(
    async (
      sessionId: string,
      data: Partial<Omit<Itinerary, 'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt'>>
    ) => {
      setLoading(true);
      const result = await ItineraryService.updateItinerary(sessionId, data);
      setLoading(false);

      if (result.error) {
        config?.onError?.(result.error.message || '更新行程安排失敗', result.error);
        return { success: false, error: result.error };
      }

      config?.onSuccess?.('行程安排更新成功');
      return { success: true, data: result.data };
    },
    [config] // 將 config 加入依賴，確保其更新時 useCallback 能重新生成
  );

  return { updateItinerary, loading };
}

/**
 * 更新單日行程 Hook
 * 符合 Single Responsibility 原則，專注於更新單日行程資料。
 * 不包含任何 UI/樣式相關程式碼。
 */
export function useUpdateDayItinerary(config?: UseItinerariesConfig) {
  const [loading, setLoading] = useState(false);

  const updateDay = useCallback(
    async (sessionId: string, day: number, data: Omit<DayItinerary, 'day'>) => {
      setLoading(true);
      const result = await ItineraryService.updateDayItinerary(sessionId, day, data);
      setLoading(false);

      if (result.error) {
        config?.onError?.(result.error.message || '更新單日行程失敗', result.error);
        return { success: false, error: result.error };
      }

      config?.onSuccess?.('單日行程更新成功');
      return { success: true, data: result.data };
    },
    [config] // 將 config 加入依賴，確保其更新時 useCallback 能重新生成
  );

  return { updateDay, loading };
}

/**
 * 取得行程版本歷史 Hook
 * 符合 Single Responsibility 原則，專注於獲取行程版本資料。
 * 不包含任何 UI/樣式相關程式碼。
 */
export function useItineraryVersions(sessionId: string | null, config?: UseItinerariesConfig) {
  const [versions, setVersions] = useState<
    Array<{ version: number; createdAt: string; createdBy: string; changes: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchVersions = useCallback(async () => {
    if (!sessionId) {
      setVersions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await ItineraryService.getItineraryVersions(sessionId);
    if (result.error) {
      setError(result.error);
      config?.onError?.(result.error.message || '取得版本歷史失敗', result.error);
    } else {
      setVersions(result.data || []);
    }
    setLoading(false);
  }, [sessionId, config]); // 將 config 加入依賴，確保其更新時 useCallback 能重新生成

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return { versions, loading, error, refetch: fetchVersions };
}

/**
 * 還原行程版本 Hook
 * 符合 Single Responsibility 原則，專注於還原行程版本。
 * 不包含任何 UI/樣式相關程式碼。
 */
export function useRevertItinerary(config?: UseItinerariesConfig) {
  const [loading, setLoading] = useState(false);

  const revert = useCallback(
    async (sessionId: string, version: number) => {
      setLoading(true);
      const result = await ItineraryService.revertToVersion(sessionId, version);
      setLoading(false);

      if (result.error) {
        config?.onError?.(result.error.message || '還原版本失敗', result.error);
        return { success: false, error: result.error };
      }

      config?.onSuccess?.(`已還原到版本 ${version}`);
      return { success: true, data: result.data };
    },
    [config] // 將 config 加入依賴，確保其更新時 useCallback 能重新生成
  );

  return { revert, loading };
}

/**
 * 複製行程安排 Hook
 * 符合 Single Responsibility 原則，專注於複製行程安排。
 * 不包含任何 UI/樣式相關程式碼。
 */
export function useCloneItinerary(config?: UseItinerariesConfig) {
  const [loading, setLoading] = useState(false);

  const clone = useCallback(
    async (fromSessionId: string, toSessionId: string) => {
      setLoading(true);
      const result = await ItineraryService.cloneItinerary(fromSessionId, toSessionId);
      setLoading(false);

      if (result.error) {
        config?.onError?.(result.error.message || '複製行程安排失敗', result.error);
        return { success: false, error: result.error };
      }

      config?.onSuccess?.('行程安排複製成功');
      return { success: true, data: result.data };
    },
    [config] // 將 config 加入依賴，確保其更新時 useCallback 能重新生成
  );

  return { clone, loading };
}