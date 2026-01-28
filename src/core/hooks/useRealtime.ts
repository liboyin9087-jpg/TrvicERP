/**
 * 即時通訊 Hook
 * Real-time Communication Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RealtimeService,
  RealtimeNotification,
  LocationUpdate,
  ConnectionStatus,
  // NotificationPayload, // Not directly used in the hook's public interface, internal to service
  // LocationUpdatePayload, // Not directly used in the hook's public interface, internal to service
} from '../services/realtimeService'; // Assuming realtimeService.ts exports types

/**
 * 定義所有即時通訊 Hook 的基礎配置介面，確保可注入 RealtimeService 實例。
 */
interface BaseRealtimeHookConfig {
  realtimeService: RealtimeService;
}

/**
 * 即時連接 Hook 配置
 */
export interface UseRealtimeConnectionConfig extends BaseRealtimeHookConfig {}

/**
 * 即時連接 Hook
 * 管理與即時服務的連接狀態。
 */
export function useRealtimeConnection(config: UseRealtimeConnectionConfig) {
  const { realtimeService } = config;
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleStatusChange = ({ status: newStatus, error: statusError }: { status: ConnectionStatus, error?: string }) => {
      setStatus(newStatus);
      if (statusError) {
        setError(statusError);
      } else if (newStatus === 'connected') {
        setError(null); // Clear error on successful connection
      }
    };

    // 假設 realtimeService 有一個 'error' 事件用於一般的服務錯誤
    const handleError = (errorMessage: string) => {
      setError(errorMessage);
      console.error('Realtime Service Error:', errorMessage);
    };

    realtimeService.on('status_change', handleStatusChange);
    realtimeService.on('error', handleError); // 訂閱通用服務錯誤

    // 自動連接
    realtimeService.connect().catch((err) => {
      setError(err.message || '無法連接到即時服務');
      setStatus('disconnected'); // 確保狀態反映失敗
    });

    return () => {
      realtimeService.off('status_change', handleStatusChange);
      realtimeService.off('error', handleError);
      // 取消掛載時斷開連接以清理資源，但通常連接狀態由應用程式級別的 Provider 管理。
      // realtimeService.disconnect(); // 取決於所需的應用程式行為
    };
  }, [realtimeService]); // 依賴 realtimeService 以便在其改變時重新執行 (儘管對於單例實例不太可能)

  const connect = useCallback(() => {
    setError(null); // 在嘗試連接前清除先前的錯誤
    realtimeService.connect().catch((err) => {
      setError(err.message || '連接失敗');
    });
  }, [realtimeService]);

  const disconnect = useCallback(() => {
    realtimeService.disconnect();
    setError(null); // 斷開連接時清除錯誤
  }, [realtimeService]);

  return { status, error, connect, disconnect };
}

/**
 * 接收團次即時通知 Hook 配置
 */
export interface UseSessionNotificationsConfig extends BaseRealtimeHookConfig {
  sessionId: string | null;
  maxNotifications?: number; // 限制通知數量
}

/**
 * 接收團次即時通知 Hook
 * 專責處理單一團次的通知接收。
 */
export function useSessionNotifications(config: UseSessionNotificationsConfig) {
  const { realtimeService, sessionId, maxNotifications = 50 } = config;
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      if (isSubscribed.current) {
        // 如果 sessionId 變為 null 且之前已訂閱，則取消訂閱
        realtimeService.unsubscribeFromSession(sessionId!); // 使用 ! 因為我們已檢查 isSubscribed.current
        isSubscribed.current = false;
      }
      setNotifications([]); // 清空通知
      setError(null);
      return;
    }

    const handleNotification = (notification: RealtimeNotification) => {
      if (notification.sessionId === sessionId) {
        setNotifications((prev) => [notification, ...prev].slice(0, maxNotifications));
      }
    };

    realtimeService.on('notification', handleNotification);

    // 訂閱團次 (如果尚未訂閱)
    if (!isSubscribed.current) {
      realtimeService.subscribeToSession(sessionId)
        .then(() => {
          isSubscribed.current = true;
          setError(null);
        })
        .catch((err) => {
          setError(`訂閱團次 ${sessionId} 通知失敗: ${err.message || err}`);
          isSubscribed.current = false;
        });
    }

    return () => {
      realtimeService.off('notification', handleNotification);
      if (isSubscribed.current) {
        realtimeService.unsubscribeFromSession(sessionId);
        isSubscribed.current = false;
      }
    };
  }, [realtimeService, sessionId, maxNotifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, error, clearNotifications };
}

/**
 * 接收團次位置更新 Hook 配置
 */
export interface UseSessionLocationsConfig extends BaseRealtimeHookConfig {
  sessionId: string | null;
}

/**
 * 接收團次位置更新 Hook
 * 專責處理單一團次的位置更新接收。
 */
export function useSessionLocations(config: UseSessionLocationsConfig) {
  const { realtimeService, sessionId } = config;
  const [locations, setLocations] = useState<Map<string, LocationUpdate>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      if (isSubscribed.current) {
        realtimeService.unsubscribeFromSession(sessionId!);
        isSubscribed.current = false;
      }
      setLocations(new Map()); // 清空位置資料
      setError(null);
      return;
    }

    const handleLocationUpdate = (location: LocationUpdate) => {
      if (location.sessionId === sessionId) {
        setLocations((prev) => {
          const newMap = new Map(prev);
          newMap.set(location.userId, location);
          return newMap;
        });
      }
    };

    realtimeService.on('location_update', handleLocationUpdate);

    // 訂閱團次 (如果尚未訂閱)
    if (!isSubscribed.current) {
      realtimeService.subscribeToSession(sessionId)
        .then(() => {
          isSubscribed.current = true;
          setError(null);
        })
        .catch((err) => {
          setError(`訂閱團次 ${sessionId} 位置更新失敗: ${err.message || err}`);
          isSubscribed.current = false;
        });
    }

    return () => {
      realtimeService.off('location_update', handleLocationUpdate);
      if (isSubscribed.current) {
        realtimeService.unsubscribeFromSession(sessionId);
        isSubscribed.current = false;
      }
    };
  }, [realtimeService, sessionId]);

  return { locations: Array.from(locations.values()), error };
}

/**
 * 團次即時動作發送 Hook 配置
 */
export interface UseSessionRealtimeActionsConfig extends BaseRealtimeHookConfig {
  sessionId: string | null;
}

/**
 * 團次即時動作發送 Hook
 * 專責提供發送各種即時訊息的方法。
 */
export function useSessionRealtimeActions(config: UseSessionRealtimeActionsConfig) {
  const { realtimeService, sessionId } = config;
  const [lastError, setLastError] = useState<string | null>(null);

  const safeCall = useCallback(async (action: () => Promise<void>) => {
    if (!sessionId) {
      setLastError('Session ID 不存在，無法發送訊息。');
      return;
    }
    setLastError(null); // 嘗試發送前清除錯誤
    try {
      await action();
    } catch (err: any) {
      setLastError(err.message || '發送失敗');
      console.error('Realtime action failed:', err);
    }
  }, [realtimeService, sessionId]); // 依賴 realtimeService 如果它可能改變的話

  const sendNotification = useCallback(
    async (
      type: RealtimeNotification['type'],
      title: string,
      message: string,
      severity: RealtimeNotification['severity'] = 'info'
    ) => {
      await safeCall(() =>
        realtimeService.sendNotification({
          type,
          sessionId: sessionId!, // 確保 sessionId 不為 null (由 safeCall 處理)
          title,
          message,
          severity,
        })
      );
    },
    [sessionId, realtimeService, safeCall]
  );

  const sendEmergency = useCallback(
    async (message: string) => {
      await safeCall(() => realtimeService.sendEmergency(sessionId!, message));
    },
    [sessionId, realtimeService, safeCall]
  );

  const sendAnnouncement = useCallback(
    async (title: string, message: string) => {
      await safeCall(() => realtimeService.sendAnnouncement(sessionId!, title, message));
    },
    [sessionId, realtimeService, safeCall]
  );

  return {
    sendNotification,
    sendEmergency,
    sendAnnouncement,
    lastError,
  };
}

/**
 * 團次即時更新 Hook (組合了上述職責) 配置
 */
export interface UseSessionRealtimeConfig extends BaseRealtimeHookConfig {
  sessionId: string | null;
  maxNotifications?: number;
}

/**
 * 團次即時更新 Hook (組合了職責更小的 Hooks)
 * 這是一個組合 Hook，提供團次即時通訊的完整功能。
 */
export function useSessionRealtime(config: UseSessionRealtimeConfig) {
  const { realtimeService, sessionId, maxNotifications } = config;

  const { notifications, error: notificationsError, clearNotifications } = useSessionNotifications({ realtimeService, sessionId, maxNotifications });
  const { locations, error: locationsError } = useSessionLocations({ realtimeService, sessionId });
  const { sendNotification, sendEmergency, sendAnnouncement, lastError: actionsError } = useSessionRealtimeActions({ realtimeService, sessionId });

  // 將所有子 Hook 的錯誤合併
  const combinedError = notificationsError || locationsError || actionsError;

  return {
    notifications,
    locations, // locations 已由 useSessionLocations 處理為 Array.from(Map.values())
    sendNotification,
    sendEmergency,
    sendAnnouncement,
    clearNotifications,
    error: combinedError,
  };
}

/**
 * 領隊位置追蹤 Hook 配置
 */
export interface UseLeaderLocationConfig extends BaseRealtimeHookConfig {
  sessionId: string | null;
  userId: string;
  userName: string;
}

/**
 * 領隊位置追蹤 Hook
 */
export function useLeaderLocation(config: UseLeaderLocationConfig) {
  const { realtimeService, sessionId, userId, userName } = config;
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTracking = useCallback(() => {
    if (!sessionId) {
      setError('需要 Session ID 才能開始追蹤。');
      return;
    }
    if (!navigator.geolocation) {
      setError('瀏覽器不支援地理位置功能。');
      return;
    }

    setError(null); // 清除先前的錯誤

    const id = navigator.geolocation.watchPosition(
      (position) => {
        realtimeService.sendLocationUpdate({
          sessionId,
          userId,
          userName,
          role: 'leader',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(), // 添加時間戳以提高數據完整性
        });
        setError(null); // 成功發送位置後清除錯誤
      },
      (err) => {
        setError(`地理位置追蹤失敗: ${err.message}`);
        setIsTracking(false); // 出錯時停止追蹤
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // 增加超時時間以提高健壯性
        maximumAge: 10000, // 稍微增加最大緩存時間
      }
    );

    setWatchId(id);
    setIsTracking(true);
  }, [realtimeService, sessionId, userId, userName, watchId]); // watchId 納入依賴以避免過時閉包 for clearWatch

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    setError(null); // 停止時清除錯誤
  }, [watchId]);

  useEffect(() => {
    // 在組件卸載或 sessionId/realtimeService 改變且正在追蹤時清理
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null); // 清除 watchId 狀態
        setIsTracking(false); // 更新追蹤狀態
      }
    };
  }, [watchId]); // 僅依賴 watchId 用於清理邏輯

  return { isTracking, error, startTracking, stopTracking };
}

// 根據 Kintone widget 獨立性原則，移除單一預設導出。
// 如果需要一個預設導出，它應該是一個高階元件或一個組合性的 Hook 負責整個即時系統的初始化。
// export default useRealtimeConnection; // 已移除預設導出