import { useState, useEffect, useCallback } from 'react';
import { offlineService, type SyncQueueItem, type SyncStatus } from '../services/offlineService';

type UseOfflineReturn = {
  isOnline: boolean;
  syncQueue: SyncQueueItem[];
  syncPendingItems: () => Promise<void>;
  refreshQueue: () => Promise<void>;
};

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  const loadSyncQueue = useCallback(async (): Promise<void> => {
    try {
      const items = await offlineService.getPendingSyncItems();
      setSyncQueue(items);
    } catch (error) {
      if (error instanceof Error) {
        console.error('載入同步佇列失敗:', error.message);
      } else {
        console.error('載入同步佇列失敗: 未知錯誤');
      }
    }
  }, []);

  const syncPendingItems = useCallback(async (): Promise<void> => {
    if (!isOnline) return;

    try {
      const items = await offlineService.getPendingSyncItems();
      
      for (const item of items) {
        try {
          await offlineService.updateSyncItemStatus(item.id, 'syncing');
          await new Promise<void>(resolve => setTimeout(resolve, 500));
          await offlineService.updateSyncItemStatus(item.id, 'synced');
        } catch (error) {
          const status: SyncStatus = 'error';
          const errorMessage = error instanceof Error ? error.message : '同步失敗';
          await offlineService.updateSyncItemStatus(item.id, status, errorMessage);
        }
      }

      await loadSyncQueue();
    } catch (error) {
      if (error instanceof Error) {
        console.error('同步失敗:', error.message);
      } else {
        console.error('同步失敗: 未知錯誤');
      }
    }
  }, [isOnline, loadSyncQueue]);

  useEffect(() => {
    const initializeOfflineService = async (): Promise<void> => {
      try {
        await offlineService.init();
      } catch (error) {
        if (error instanceof Error) {
          console.error('離線服務初始化失敗:', error.message);
        } else {
          console.error('離線服務初始化失敗: 未知錯誤');
        }
      }
    };

    initializeOfflineService();

    const cleanup = offlineService.onOnlineStatusChange((online: boolean) => {
      setIsOnline(online);
      if (online) {
        syncPendingItems();
      }
    });

    loadSyncQueue();

    return cleanup;
  }, [syncPendingItems, loadSyncQueue]);

  return {
    isOnline,
    syncQueue,
    syncPendingItems,
    refreshQueue: loadSyncQueue,
  };
}