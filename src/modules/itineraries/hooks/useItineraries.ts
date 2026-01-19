import { useState, useEffect, useCallback } from 'react';
import { ItineraryService } from '../services/itineraryService';
import type {
  Itinerary,
  DayItinerary,
  ItineraryVersion,
  ServiceError,
  ServiceResponse,
} from '../../../core/types/itinerary';
import { useToast } from '../../../store/useToastStore';

export function useItinerary(sessionId: string | null) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ServiceError | null>(null);
  const toast = useToast();

  const fetchItinerary = useCallback(async (): Promise<void> => {
    if (!sessionId) {
      setItinerary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ItineraryService.getItinerary(sessionId);
      if (result.error) {
        setError(result.error);
        if (result.error.code !== 'NOT_FOUND') {
          toast.error(result.error.message || '取得行程安排失敗');
        }
      } else {
        setItinerary(result.data);
      }
    } catch (err) {
      setError({ message: '發生未知錯誤', code: 'UNKNOWN_ERROR' });
      toast.error('取得行程安排時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, [sessionId, toast]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  return { itinerary, loading, error, refetch: fetchItinerary };
}

export function useCreateItinerary() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const createItinerary = useCallback(
    async (
      sessionId: string,
      data: Omit<Itinerary, 'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt' | 'createdBy'>
    ): Promise<ServiceResponse<Itinerary>> => {
      setLoading(true);
      try {
        const result = await ItineraryService.createItinerary(sessionId, data);
        if (result.error) {
          toast.error(result.error.message || '建立行程安排失敗');
          return { success: false, error: result.error };
        }
        toast.success('行程安排建立成功');
        return { success: true, data: result.data };
      } catch (err) {
        toast.error('建立行程安排時發生錯誤');
        return { success: false, error: { message: '發生未知錯誤', code: 'UNKNOWN_ERROR' } };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { createItinerary, loading };
}

export function useUpdateItinerary() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const updateItinerary = useCallback(
    async (
      sessionId: string,
      data: Partial<Omit<Itinerary, 'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt'>>
    ): Promise<ServiceResponse<Itinerary>> => {
      setLoading(true);
      try {
        const result = await ItineraryService.updateItinerary(sessionId, data);
        if (result.error) {
          toast.error(result.error.message || '更新行程安排失敗');
          return { success: false, error: result.error };
        }
        toast.success('行程安排更新成功');
        return { success: true, data: result.data };
      } catch (err) {
        toast.error('更新行程安排時發生錯誤');
        return { success: false, error: { message: '發生未知錯誤', code: 'UNKNOWN_ERROR' } };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { updateItinerary, loading };
}

export function useUpdateDayItinerary() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const updateDay = useCallback(
    async (
      sessionId: string,
      day: number,
      data: Omit<DayItinerary, 'day'>
    ): Promise<ServiceResponse<DayItinerary>> => {
      setLoading(true);
      try {
        const result = await ItineraryService.updateDayItinerary(sessionId, day, data);
        if (result.error) {
          toast.error(result.error.message || '更新單日行程失敗');
          return { success: false, error: result.error };
        }
        toast.success('單日行程更新成功');
        return { success: true, data: result.data };
      } catch (err) {
        toast.error('更新單日行程時發生錯誤');
        return { success: false, error: { message: '發生未知錯誤', code: 'UNKNOWN_ERROR' } };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { updateDay, loading };
}

export function useItineraryVersions(sessionId: string | null) {
  const [versions, setVersions] = useState<ItineraryVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ServiceError | null>(null);
  const toast = useToast();

  const fetchVersions = useCallback(async (): Promise<void> => {
    if (!sessionId) {
      setVersions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ItineraryService.getItineraryVersions(sessionId);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得版本歷史失敗');
      } else {
        setVersions(result.data || []);
      }
    } catch (err) {
      setError({ message: '發生未知錯誤', code: 'UNKNOWN_ERROR' });
      toast.error('取得版本歷史時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, [sessionId, toast]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return { versions, loading, error, refetch: fetchVersions };
}

export function useRevertItinerary() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const revert = useCallback(
    async (sessionId: string, version: number): Promise<ServiceResponse<Itinerary>> => {
      setLoading(true);
      try {
        const result = await ItineraryService.revertToVersion(sessionId, version);
        if (result.error) {
          toast.error(result.error.message || '還原版本失敗');
          return { success: false, error: result.error };
        }
        toast.success(`已還原到版本 ${version}`);
        return { success: true, data: result.data };
      } catch (err) {
        toast.error('還原版本時發生錯誤');
        return { success: false, error: { message: '發生未知錯誤', code: 'UNKNOWN_ERROR' } };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { revert, loading };
}

export function useCloneItinerary() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const clone = useCallback(
    async (fromSessionId: string, toSessionId: string): Promise<ServiceResponse<Itinerary>> => {
      setLoading(true);
      try {
        const result = await ItineraryService.cloneItinerary(fromSessionId, toSessionId);
        if (result.error) {
          toast.error(result.error.message || '複製行程安排失敗');
          return { success: false, error: result.error };
        }
        toast.success('行程安排複製成功');
        return { success: true, data: result.data };
      } catch (err) {
        toast.error('複製行程安排時發生錯誤');
        return { success: false, error: { message: '發生未知錯誤', code: 'UNKNOWN_ERROR' } };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { clone, loading };
}