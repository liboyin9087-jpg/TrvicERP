import { useState, useEffect, useCallback } from 'react';
import { SessionService } from '../services/sessionService';
import type {
  Session,
  SessionQuery,
  CreateSessionData,
  UpdateSessionData,
} from '../../../core/types/session';

/**
 * 通用的 Hook 錯誤介面
 * 假設錯誤物件會包含一個 message 屬性
 */
interface HookError {
  message: string;
  statusCode?: number;
  // 根據實際後端錯誤格式可擴展其他屬性
  [key: string]: any;
}

/**
 * 處理 Hook 內部錯誤的通用函數
 * 統一錯誤訊息處理和錯誤回呼調用
 */
function processHookError(
  error: any,
  defaultMessage: string,
  onError?: (err: HookError) => void
) {
  const hookError: HookError = {
    message: error?.message || defaultMessage,
    statusCode: error?.statusCode,
    ...(error && typeof error === 'object' ? error : {}), // 合併原始錯誤物件的其他屬性
  };
  onError?.(hookError);
  return hookError; // 返回處理後的錯誤，以便內部狀態更新
}

/**
 * 取得團次列表 Hook 的設定介面
 */
export interface UseSessionsConfig {
  query?: SessionQuery;
  onSuccess?: (sessions: Session[]) => void;
  onError?: (error: HookError) => void;
}

/**
 * 取得團次列表 Hook
 */
export function useSessions(config?: UseSessionsConfig) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<HookError | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await SessionService.getSessions(config?.query);
    if (result.error) {
      const processedError = processHookError(
        result.error,
        '取得團次列表失敗',
        config?.onError
      );
      setError(processedError);
    } else {
      const data = result.data || [];
      setSessions(data);
      config?.onSuccess?.(data);
    }
    setLoading(false);
  }, [config?.query, config?.onError, config?.onSuccess]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refetch: fetchSessions };
}

/**
 * 取得單一團次 Hook 的設定介面
 */
export interface UseSessionConfig {
  id: string | null;
  onSuccess?: (session: Session | null) => void;
  onError?: (error: HookError) => void;
}

/**
 * 取得單一團次 Hook
 */
export function useSession(config: UseSessionConfig) {
  const { id, onSuccess, onError } = config;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<HookError | null>(null);

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
      const processedError = processHookError(
        result.error,
        '取得團次失敗',
        onError
      );
      setError(processedError);
    } else {
      const data = result.data || null;
      setSession(data);
      onSuccess?.(data);
    }
    setLoading(false);
  }, [id, onSuccess, onError]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { session, loading, error, refetch: fetchSession };
}

/**
 * 建立團次 Hook 的設定介面
 */
export interface UseCreateSessionConfig {
  onSuccess?: (data: Session) => void;
  onError?: (error: HookError) => void;
}

/**
 * 建立團次 Hook
 */
export function useCreateSession(config?: UseCreateSessionConfig) {
  const [loading, setLoading] = useState(false);

  const createSession = useCallback(
    async (data: CreateSessionData) => {
      setLoading(true);
      const result = await SessionService.createSession(data);
      setLoading(false);

      if (result.error) {
        const processedError = processHookError(
          result.error,
          '建立團次失敗',
          config?.onError
        );
        return { success: false, error: processedError };
      }

      const createdSession = result.data!;
      config?.onSuccess?.(createdSession);
      return { success: true, data: createdSession };
    },
    [config?.onSuccess, config?.onError]
  );

  return { createSession, loading };
}

/**
 * 更新團次 Hook 的設定介面
 */
export interface UseUpdateSessionConfig {
  onSuccess?: (data: Session) => void;
  onError?: (error: HookError) => void;
}

/**
 * 更新團次 Hook
 */
export function useUpdateSession(config?: UseUpdateSessionConfig) {
  const [loading, setLoading] = useState(false);

  const updateSession = useCallback(
    async (id: string, data: UpdateSessionData) => {
      setLoading(true);
      const result = await SessionService.updateSession(id, data);
      setLoading(false);

      if (result.error) {
        const processedError = processHookError(
          result.error,
          '更新團次失敗',
          config?.onError
        );
        return { success: false, error: processedError };
      }

      const updatedSession = result.data!;
      config?.onSuccess?.(updatedSession);
      return { success: true, data: updatedSession };
    },
    [config?.onSuccess, config?.onError]
  );

  return { updateSession, loading };
}

/**
 * 刪除團次 Hook 的設定介面
 */
export interface UseDeleteSessionConfig {
  onSuccess?: () => void;
  onError?: (error: HookError) => void;
}

/**
 * 刪除團次 Hook
 */
export function useDeleteSession(config?: UseDeleteSessionConfig) {
  const [loading, setLoading] = useState(false);

  const deleteSession = useCallback(
    async (id: string) => {
      setLoading(true);
      const result = await SessionService.deleteSession(id);
      setLoading(false);

      if (result.error) {
        const processedError = processHookError(
          result.error,
          '刪除團次失敗',
          config?.onError
        );
        return { success: false, error: processedError };
      }

      config?.onSuccess?.();
      return { success: true };
    },
    [config?.onSuccess, config?.onError]
  );

  return { deleteSession, loading };
}