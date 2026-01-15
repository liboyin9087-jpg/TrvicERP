/**
 * 團次管理 Hooks
 * Session Management Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { SessionService } from '../services/sessionService';
import type {
  Session,
  SessionQuery,
  CreateSessionData,
  UpdateSessionData,
} from '../../../core/types/session';
import { useToast } from '../../../store/useToastStore';

/**
 * 取得團次列表 Hook
 */
export function useSessions(query?: SessionQuery) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await SessionService.getSessions(query);
    if (result.error) {
      setError(result.error);
      toast.error(result.error.message || '取得團次列表失敗');
    } else {
      setSessions(result.data || []);
    }
    setLoading(false);
  }, [query, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refetch: fetchSessions };
}

/**
 * 取得單一團次 Hook
 */
export function useSession(id: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const toast = useToast();

  const fetchSession = useCallback(async () => {
    if (!id) {
      setSession(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await SessionService.getSession(id);
    if (result.error) {
      setError(result.error);
      toast.error(result.error.message || '取得團次失敗');
    } else {
      setSession(result.data);
    }
    setLoading(false);
  }, [id, toast]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { session, loading, error, refetch: fetchSession };
}

/**
 * 建立團次 Hook
 */
export function useCreateSession() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const createSession = useCallback(
    async (data: CreateSessionData) => {
      setLoading(true);
      const result = await SessionService.createSession(data);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '建立團次失敗');
        return { success: false, error: result.error };
      }

      toast.success('團次建立成功');
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { createSession, loading };
}

/**
 * 更新團次 Hook
 */
export function useUpdateSession() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const updateSession = useCallback(
    async (id: string, data: UpdateSessionData) => {
      setLoading(true);
      const result = await SessionService.updateSession(id, data);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '更新團次失敗');
        return { success: false, error: result.error };
      }

      toast.success('團次更新成功');
      return { success: true, data: result.data };
    },
    [toast]
  );

  return { updateSession, loading };
}

/**
 * 刪除團次 Hook
 */
export function useDeleteSession() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const deleteSession = useCallback(
    async (id: string) => {
      setLoading(true);
      const result = await SessionService.deleteSession(id);
      setLoading(false);

      if (result.error) {
        toast.error(result.error.message || '刪除團次失敗');
        return { success: false, error: result.error };
      }

      toast.success('團次已刪除');
      return { success: true };
    },
    [toast]
  );

  return { deleteSession, loading };
}
