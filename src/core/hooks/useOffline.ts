import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 離線同步佇列項目介面
 * Interface for an offline sync queue item
 */
export interface SyncQueueItem {
  id: string;
  payload: any; // 實際要同步的資料
  status: 'pending' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  createdAt: number;
  attempts?: number; // 同步嘗試次數
  lastAttemptedAt?: number; // 上次嘗試同步時間
}

/**
 * 離線服務介面
 * Interface for the offline service, allowing dependency injection.
 */
export interface OfflineService {
  /**
   * 初始化離線服務（例如：連接 IndexedDB）。
   * Initializes the offline service (e.g., connects to IndexedDB).
   */
  init(): Promise<void>;

  /**
   * 註冊線上狀態變更監聽器。
   * Registers a listener for online status changes.
   * @param callback 當線上狀態改變時呼叫的回調函數
   * @returns 取消監聽的函數
   */
  onOnlineStatusChange(callback: (online: boolean) => void): () => void;

  /**
   * 獲取所有待同步或同步失敗的項目。
   * Retrieves all pending or failed sync items.
   */
  getPendingSyncItems(): Promise<SyncQueueItem[]>;

  /**
   * 更新同步項目的狀態和錯誤訊息。
   * Updates the status and error message of a sync item.
   * @param id 項目ID
   * @param status 新狀態
   * @param errorMessage 錯誤訊息 (如果狀態為 'error')
   */
  updateSyncItemStatus(id: string, status: SyncQueueItem['status'], errorMessage?: string): Promise<void>;

  /**
   * 獲取當前網路是否在線。
   * Gets the current online status.
   */
  isOnline(): boolean;
}

/**
 * useOffline Hooks 的配置介面
 * Configuration interface for the useOffline hook.
 */
export interface UseOfflineConfig {
  /**
   * 注入的離線服務實例。
   * The injected instance of the offline service.
   * (Architectural fix: Dependency Injection instead of global state)
   */
  offlineService: OfflineService;

  /**
   * 用於執行單個同步項目的回調函數。
   * This callback should contain the actual API call logic.
   * (Architectural fix: Clearer responsibility boundary for API calls)
   * @param item 要同步的佇列項目
   * @param signal AbortSignal 用於取消同步操作
   */
  syncItemCallback: (item: SyncQueueItem, signal: AbortSignal) => Promise<void>;

  /**
   * 當網路狀態從離線變為在線時，自動觸發同步的防抖延遲時間 (毫秒)。
   * Debounce delay in milliseconds for automatically triggering sync when network comes online.
   * (Design fix: Debounce mechanism)
   * 預設為 2000 毫秒 (2秒)。
   */
  debounceSyncMs?: number;

  /**
   * 同步開始時的回調函數。
   * Callback fired when a sync operation starts.
   * (Design fix: Provides sync progress/status)
   */
  onSyncStart?: () => void;

  /**
   * 同步結束時的回調函數。
   * Callback fired when a sync operation ends.
   * (Design fix: Provides sync progress/status)
   * @param success 同步是否成功 (所有項目都成功或沒有待同步項目)
   * @param error 如果有總體錯誤，則為錯誤對象
   */
  onSyncEnd?: (success: boolean, error?: Error) => void;

  /**
   * 單個同步項目成功時的回調函數。
   * Callback fired when a single sync item succeeds.
   */
  onSyncItemSuccess?: (item: SyncQueueItem) => void;

  /**
   * 單個同步項目失敗時的回調函數。
   * Callback fired when a single sync item fails.
   */
  onSyncItemError?: (item: SyncQueueItem, error: Error) => void;

  /**
   * 初始化時是否立即觸發一次同步。
   * Whether to trigger a sync immediately on initialization if online.
   * Default is true.
   */
  syncOnMount?: boolean;
}

/**
 * 離線功能 Hooks
 * Offline Functionality Hooks
 *
 * @param config 配置對象，包含注入的 OfflineService 和同步回調函數。
 */
export function useOffline(config: UseOfflineConfig) {
  const {
    offlineService,
    syncItemCallback,
    debounceSyncMs = 2000,
    onSyncStart,
    onSyncEnd,
    onSyncItemSuccess,
    onSyncItemError,
    syncOnMount = true,
  } = config;

  const [isOnline, setIsOnline] = useState(offlineService.isOnline());
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ completed: 0, total: 0 });
  const [lastSyncError, setLastSyncError] = useState<Error | null>(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);

  // 用於取消當前同步操作的 AbortController
  const abortControllerRef = useRef<AbortController | null>(null);
  // 用於防抖定時器
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 載入同步佇列
   */
  const loadSyncQueue = useCallback(async () => {
    try {
      const items = await offlineService.getPendingSyncItems();
      setSyncQueue(items);
      setSyncProgress(prev => ({ ...prev, total: items.length })); // 更新總數，完成數在同步時更新
      return items;
    } catch (error) {
      console.error('載入同步佇列失敗:', error);
      setLastSyncError(error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }, [offlineService]);

  /**
   * 取消任何正在進行的同步操作
   */
  const cancelSync = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      console.log('當前同步操作已取消。');
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setIsSyncing(false);
    setSyncProgress({ completed: 0, total: 0 }); // 重置進度
  }, []);

  /**
   * 執行待同步項目
   * (Architectural fix: Cancellation mechanism, clearer responsibility, enhanced error handling, progress tracking)
   * (Design fix: Progress status)
   */
  const syncPendingItems = useCallback(async () => {
    if (!isOnline) {
      console.log('離線狀態，無法同步。');
      return;
    }
    if (isSyncing) {
      console.log('同步操作已在進行中，跳過本次請求。');
      return;
    }

    // 取消之前的同步操作
    cancelSync();

    const currentController = new AbortController();
    abortControllerRef.current = currentController;
    const { signal } = currentController;

    setIsSyncing(true);
    setLastSyncError(null);
    onSyncStart?.(); // 通知同步開始

    let overallSuccess = true;
    let overallError: Error | undefined;

    try {
      let itemsToSync = await loadSyncQueue(); // 重新載入，確保拿到最新狀態
      // 只同步 pending 或 error 的項目，並排除已經在同步中的項目 (如果有競爭)
      itemsToSync = itemsToSync.filter(item => item.status === 'pending' || item.status === 'error');

      if (itemsToSync.length === 0) {
        console.log('沒有待同步項目。');
        setIsSyncing(false);
        setLastSyncTimestamp(Date.now());
        onSyncEnd?.(true);
        return;
      }

      setSyncProgress({ completed: 0, total: itemsToSync.length });

      for (let i = 0; i < itemsToSync.length; i++) {
        if (signal.aborted) {
          console.log('同步操作被取消。');
          overallSuccess = false;
          overallError = new Error('Sync operation aborted.');
          break;
        }

        const item = itemsToSync[i];
        let itemErrorMessage: string | undefined;

        try {
          await offlineService.updateSyncItemStatus(item.id, 'syncing');
          setSyncQueue(prev => prev.map(qItem => qItem.id === item.id ? { ...qItem, status: 'syncing' } : qItem));

          await syncItemCallback(item, signal); // 執行實際的 API 呼叫

          await offlineService.updateSyncItemStatus(item.id, 'synced');
          setSyncQueue(prev => prev.map(qItem => qItem.id === item.id ? { ...qItem, status: 'synced', errorMessage: undefined } : qItem));
          onSyncItemSuccess?.(item);

        } catch (error) {
          if (signal.aborted) { // 再次檢查，因為 syncItemCallback 可能會拋出 AbortError
            overallSuccess = false;
            overallError = new Error('Sync operation aborted during item processing.');
            break;
          }
          console.error(`同步項目 ${item.id} 失敗:`, error);
          itemErrorMessage = error instanceof Error ? error.message : '未知同步失敗';
          overallSuccess = false; // 只要有一個失敗，整體就不是完全成功
          overallError = overallError || (error instanceof Error ? error : new Error(String(error))); // 記錄第一個遇到的錯誤

          await offlineService.updateSyncItemStatus(
            item.id,
            'error',
            itemErrorMessage
          );
          setSyncQueue(prev => prev.map(qItem =>
            qItem.id === item.id ? { ...qItem, status: 'error', errorMessage: itemErrorMessage, attempts: (qItem.attempts || 0) + 1, lastAttemptedAt: Date.now() } : qItem
          ));
          onSyncItemError?.(item, error instanceof Error ? error : new Error(String(error)));
        } finally {
          setSyncProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
        }
      }

      // 最終更新佇列狀態，確保反映所有更改 (例如已同步的項目會從 pending 列表中移除)
      await loadSyncQueue();

    } catch (error) {
      if (signal.aborted) {
        console.log('同步操作在頂層邏輯中被取消。');
      } else {
        console.error('整體同步過程失敗:', error);
        overallSuccess = false;
        overallError = error instanceof Error ? error : new Error(String(error));
        setLastSyncError(overallError);
      }
    } finally {
      abortControllerRef.current = null; // 清除 AbortController
      setIsSyncing(false);
      setLastSyncTimestamp(Date.now());
      onSyncEnd?.(overallSuccess, overallError); // 通知同步結束
    }
  }, [isOnline, loadSyncQueue, syncItemCallback, cancelSync, onSyncStart, onSyncEnd, onSyncItemSuccess, onSyncItemError, offlineService, isSyncing]);


  // Effect for initialization and online status listening
  useEffect(() => {
    // 初始載入同步佇列
    const initialLoadAndSync = async () => {
      await loadSyncQueue();
      if (syncOnMount && offlineService.isOnline()) {
        // 如果在線且配置了掛載時同步，則觸發一次同步 (防抖處理)
        debounceTimerRef.current = setTimeout(() => {
          syncPendingItems();
        }, debounceSyncMs);
      }
    };
    initialLoadAndSync();

    // 監聽線上/離線狀態
    const cleanupOnlineStatus = offlineService.onOnlineStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        // 上線時自動同步，加入防抖機制
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          syncPendingItems();
        }, debounceSyncMs);
      } else {
        // 離線時，取消任何正在進行的同步操作
        cancelSync();
      }
    });

    return () => {
      cleanupOnlineStatus(); // 清理線上狀態監聽
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      cancelSync(); // 在 Hook 卸載時取消所有進行中的同步
    };
  }, [offlineService, loadSyncQueue, syncPendingItems, cancelSync, debounceSyncMs, syncOnMount]); // Dependency array

  return {
    isOnline,
    syncQueue,
    isSyncing,
    syncProgress,
    lastSyncError,
    lastSyncTimestamp,
    triggerSync: syncPendingItems, // 更明確的名稱，手動觸發同步
    refreshQueue: loadSyncQueue, // 手動重新載入佇列
    cancelSync, // 暴露取消功能
  };
}