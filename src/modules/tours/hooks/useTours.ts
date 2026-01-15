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
import { useToast } from '../../../store/useToastStore';

/**
 * 取得行程列表 Hook
 */
export function useTours(query?: TourQuery) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await TourService.getTours(query);
    if (result.error) {
      setError(result.error);
      toast.error(result.error.message || '取得行程列表失敗');
    } else {
      setTours(result.data || []);
    }
    setLoading(false);
  }, [query, toast]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  return { tours, loading, error, refetch: fetchTours };
}

/**
 * 取得單一行程 Hook
 */
export function useTour(id: string | null) {
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

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
      setError(result.error);
      toast.error(result.error.message || '取得行程失敗');
    } else {
      setTour(result.data);
    }
    setLoading(false);
  }, [id, toast]);

  useEffect(() => {
    fetchTour();
  }, [fetchTour]);

  return { tour, loading, error, refetch: fetchTour };
}

/**
 * 建立行程 Hook
 */
export function useCreateTour() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const createTour = useCallback(
    async (data: CreateTourData) => {
      setLoading(true);
      const result = await TourService.createTour(data);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '建立行程失敗');
        return { success: false, error: result.error };
      }

      toast.success('行程建立成功');
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { createTour, loading };
}

/**
 * 更新行程 Hook
 */
export function useUpdateTour() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const updateTour = useCallback(
    async (id: string, data: UpdateTourData) => {
      setLoading(true);
      const result = await TourService.updateTour(id, data);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '更新行程失敗');
        return { success: false, error: result.error };
      }

      toast.success('行程更新成功');
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { updateTour, loading };
}

/**
 * 刪除行程 Hook
 */
export function useDeleteTour() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const deleteTour = useCallback(
    async (id: string) => {
      setLoading(true);
      const result = await TourService.deleteTour(id);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '刪除行程失敗');
        return { success: false, error: result.error };
      }

      toast.success('行程已刪除');
      return { success: true };
    },
    [toast]
  );

  return { deleteTour, loading };
}

/**
 * 複製行程 Hook
 */
export function useCloneTour() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const cloneTour = useCallback(
    async (id: string, newCode?: string) => {
      setLoading(true);
      const result = await TourService.cloneTour(id, newCode);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '複製行程失敗');
        return { success: false, error: result.error };
      }

      toast.success('行程複製成功');
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { cloneTour, loading };
}

/**
 * 搜尋行程 Hook
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
    setResults(result.data || []);
    setLoading(false);
  }, []);

  return { results, loading, search };
}
