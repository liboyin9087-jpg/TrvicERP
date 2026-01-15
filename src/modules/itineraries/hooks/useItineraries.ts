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
import { useToast } from '../../../store/useToastStore';

/**
 * 取得行程安排 Hook
 */
export function useItinerary(sessionId: string | null) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

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
      // 不顯示錯誤訊息，因為可能是尚未建立行程
      if (result.error.code !== 'NOT_FOUND') {
        toast.error(result.error.message || '取得行程安排失敗');
      }
    } else {
      setItinerary(result.data);
    }
    setLoading(false);
  }, [sessionId, toast]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  return { itinerary, loading, error, refetch: fetchItinerary };
}

/**
 * 建立行程安排 Hook
 */
export function useCreateItinerary() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const createItinerary = useCallback(
    async (
      sessionId: string,
      data: Omit<Itinerary, 'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt' | 'createdBy'>
    ) => {
      setLoading(true);
      const result = await ItineraryService.createItinerary(sessionId, data);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '建立行程安排失敗');
        return { success: false, error: result.error };
      }

      toast.success('行程安排建立成功');
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { createItinerary, loading };
}

/**
 * 更新行程安排 Hook
 */
export function useUpdateItinerary() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const updateItinerary = useCallback(
    async (
      sessionId: string,
      data: Partial<Omit<Itinerary, 'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt'>>
    ) => {
      setLoading(true);
      const result = await ItineraryService.updateItinerary(sessionId, data);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '更新行程安排失敗');
        return { success: false, error: result.error };
      }

      toast.success('行程安排更新成功');
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { updateItinerary, loading };
}

/**
 * 更新單日行程 Hook
 */
export function useUpdateDayItinerary() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const updateDay = useCallback(
    async (sessionId: string, day: number, data: Omit<DayItinerary, 'day'>) => {
      setLoading(true);
      const result = await ItineraryService.updateDayItinerary(sessionId, day, data);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '更新單日行程失敗');
        return { success: false, error: result.error };
      }

      toast.success('單日行程更新成功');
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { updateDay, loading };
}

/**
 * 取得行程版本歷史 Hook
 */
export function useItineraryVersions(sessionId: string | null) {
  const [versions, setVersions] = useState<
    Array<{ version: number; createdAt: string; createdBy: string; changes: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

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
      toast.error(result.error.message || '取得版本歷史失敗');
    } else {
      setVersions(result.data || []);
    }
    setLoading(false);
  }, [sessionId, toast]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return { versions, loading, error, refetch: fetchVersions };
}

/**
 * 還原行程版本 Hook
 */
export function useRevertItinerary() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const revert = useCallback(
    async (sessionId: string, version: number) => {
      setLoading(true);
      const result = await ItineraryService.revertToVersion(sessionId, version);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '還原版本失敗');
        return { success: false, error: result.error };
      }

      toast.success(`已還原到版本 ${version}`);
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { revert, loading };
}

/**
 * 複製行程安排 Hook
 */
export function useCloneItinerary() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const clone = useCallback(
    async (fromSessionId: string, toSessionId: string) => {
      setLoading(true);
      const result = await ItineraryService.cloneItinerary(fromSessionId, toSessionId);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '複製行程安排失敗');
        return { success: false, error: result.error };
      }

      toast.success('行程安排複製成功');
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { clone, loading };
}
