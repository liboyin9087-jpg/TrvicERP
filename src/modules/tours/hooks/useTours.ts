import { useState, useEffect, useCallback } from 'react';
import { TourService } from '../services/tourService';
import type {
  Tour,
  TourQuery,
  CreateTourData,
  UpdateTourData,
  ServiceResult,
} from '../../../core/types/tour';
import { useToast } from '../../../store/useToastStore';
import { ApiError } from '../../../core/types/api';

export function useTours(query?: TourQuery) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const toast = useToast();

  const fetchTours = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result: ServiceResult<Tour[]> = await TourService.getTours(query);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得行程列表失敗');
      } else {
        setTours(result.data || []);
      }
    } catch (err) {
      const error = err as ApiError;
      setError(error);
      toast.error('取得行程列表時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  return { tours, loading, error, refetch: fetchTours };
}

export function useTour(id: string | null) {
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const toast = useToast();

  const fetchTour = useCallback(async (): Promise<void> => {
    if (!id) {
      setTour(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result: ServiceResult<Tour> = await TourService.getTour(id);
      if (result.error) {
        setError(result.error);
        toast.error(result.error.message || '取得行程失敗');
      } else {
        setTour(result.data);
      }
    } catch (err) {
      const error = err as ApiError;
      setError(error);
      toast.error('取得行程時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchTour();
  }, [fetchTour]);

  return { tour, loading, error, refetch: fetchTour };
}

export function useCreateTour() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const createTour = useCallback(
    async (data: CreateTourData): Promise<ServiceResult<Tour>> => {
      setLoading(true);
      try {
        const result = await TourService.createTour(data);
        if (result.error) {
          toast.error(result.error.message || '建立行程失敗');
          return { success: false, error: result.error };
        }

        toast.success('行程建立成功');
        return { success: true, data: result.data };
      } catch (err) {
        const error = err as ApiError;
        toast.error('建立行程時發生錯誤');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { createTour, loading };
}

export function useUpdateTour() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const updateTour = useCallback(
    async (id: string, data: UpdateTourData): Promise<ServiceResult<Tour>> => {
      setLoading(true);
      try {
        const result = await TourService.updateTour(id, data);
        if (result.error) {
          toast.error(result.error.message || '更新行程失敗');
          return { success: false, error: result.error };
        }

        toast.success('行程更新成功');
        return { success: true, data: result.data };
      } catch (err) {
        const error = err as ApiError;
        toast.error('更新行程時發生錯誤');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { updateTour, loading };
}

export function useDeleteTour() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const deleteTour = useCallback(
    async (id: string): Promise<ServiceResult<void>> => {
      setLoading(true);
      try {
        const result = await TourService.deleteTour(id);
        if (result.error) {
          toast.error(result.error.message || '刪除行程失敗');
          return { success: false, error: result.error };
        }

        toast.success('行程已刪除');
        return { success: true };
      } catch (err) {
        const error = err as ApiError;
        toast.error('刪除行程時發生錯誤');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { deleteTour, loading };
}

export function useCloneTour() {
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const cloneTour = useCallback(
    async (id: string, newCode?: string): Promise<ServiceResult<Tour>> => {
      setLoading(true);
      try {
        const result = await TourService.cloneTour(id, newCode);
        if (result.error) {
          toast.error(result.error.message || '複製行程失敗');
          return { success: false, error: result.error };
        }

        toast.success('行程複製成功');
        return { success: true, data: result.data };
      } catch (err) {
        const error = err as ApiError;
        toast.error('複製行程時發生錯誤');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { cloneTour, loading };
}

export function useTourSearch() {
  const [results, setResults] = useState<Tour[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const search = useCallback(async (keyword: string): Promise<void> => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const result = await TourService.searchTours(keyword);
      setResults(result.data || []);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
}