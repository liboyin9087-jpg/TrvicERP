import { useState, useEffect, useCallback } from 'react';
import { SessionService } from '../services/sessionService';
import type {
  Session,
  SessionQuery,
  CreateSessionData,
  UpdateSessionData,
} from '../../../core/types/session';
import { useToast } from '../../../store/useToastStore';
import { AuthService } from '../../../core/services/authService';

// Note: Status transition validation is handled in SessionService
// which has access to the full session data including business rules

/**
 * Error type for API responses
 */
interface ApiError {
  code?: string;
  message: string;
  details?: unknown;
}

export function useSessions(query?: SessionQuery) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const toast = useToast();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await SessionService.getSessions(query);
      if (result.error) {
        throw result.error;
      }
      setSessions(result.data || []);
    } catch (err) {
      setError(err);
      toast.error('取得團次列表失敗');
      // Error logged via toast notification
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refetch: fetchSessions };
}

export function useSession(id: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const toast = useToast();

  const fetchSession = useCallback(async () => {
    if (!id) {
      setSession(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await SessionService.getSession(id);
      if (result.error) {
        throw result.error;
      }
      setSession(result.data);
    } catch (err) {
      setError(err as ApiError);
      toast.error('取得團次失敗');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { session, loading, error, refetch: fetchSession };
}

export function useCreateSession() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const createSession = useCallback(
    async (data: CreateSessionData) => {
      setLoading(true);
      try {
        const result = await SessionService.createSession(data);
        if (result.error) {
          throw result.error;
        }
        toast.success('團次建立成功');
        return { success: true, data: result.data };
      } catch (err) {
        toast.error('建立團次失敗');
        return { success: false, error: err };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { createSession, loading };
}

export function useUpdateSession() {
  const [loading, setLoading] = useState(false);
  const [optimisticData, setOptimisticData] = useState<Partial<UpdateSessionData>>({});
  const toast = useToast();

  const updateSession = useCallback(
    async (id: string, data: UpdateSessionData) => {
      // Note: Status transition validation is handled in SessionService.updateSession
      // which has access to the current session data including currentPax and minPax

      setLoading(true);
      setOptimisticData(data);

      try {
        // Get current user ID for audit logging
        const currentUser = AuthService.getCurrentUser();
        const userId = currentUser?.id || 'system';

        const result = await SessionService.updateSession(id, data, userId);
        if (result.error) {
          throw result.error;
        }
        toast.success('團次更新成功');
        return { success: true, data: result.data };
      } catch (err) {
        toast.error('更新團次失敗');
        return { success: false, error: err };
      } finally {
        setLoading(false);
        setOptimisticData({});
      }
    },
    [toast]
  );

  return { updateSession, loading, optimisticData };
}

export function useDeleteSession() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const deleteSession = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const result = await SessionService.deleteSession(id);
        if (result.error) {
          throw result.error;
        }
        toast.success('團次已刪除');
        return { success: true };
      } catch (err) {
        toast.error('刪除團次失敗');
        return { success: false, error: err };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { deleteSession, loading };
}