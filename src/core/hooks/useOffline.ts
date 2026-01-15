/**
 * 離線功能 Hooks
 * Offline Functionality Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineService, type SyncQueueItem } from '../services/offlineService';

/**
 * 離線狀態 Hook
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  useEffect(() => {
    // 初始化離線服務
    offlineService.init().catch(console.error);

    // 監聽線上/離線狀態
    const cleanup = offlineService.onOnlineStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        // 上線時自動同步
        syncPendingItems();
      }
    });

    // 載入同步佇列
    loadSyncQueue();

    return cleanup;
  }, []);

  const loadSyncQueue = useCallback(async () => {
    try {
      const items = await offlineService.getPendingSyncItems();
      setSyncQueue(items);
    } catch (error) {
      console.error('載入同步佇列失敗:', error);
    }
  }, []);

  const syncPendingItems = useCallback(async () => {
    if (!isOnline) return;

    try {
      const items = await offlineService.getPendingSyncItems();
      
      for (const item of items) {
        try {
          // 這裡應該呼叫對應的 API
          // 簡化版本：標記為同步中
          await offlineService.updateSyncItemStatus(item.id, 'syncing');

          // 模擬 API 呼叫
          await new Promise(resolve => setTimeout(resolve, 500));

          // 標記為已同步
          await offlineService.updateSyncItemStatus(item.id, 'synced');
        } catch (error) {
          await offlineService.updateSyncItemStatus(
            item.id,
            'error',
            error instanceof Error ? error.message : '同步失敗'
          );
        }
      }

      // 重新載入佇列
      await loadSyncQueue();
    } catch (error) {
      console.error('同步失敗:', error);
    }
  }, [isOnline, loadSyncQueue]);

  return {
    isOnline,
    syncQueue,
    syncPendingItems,
    refreshQueue: loadSyncQueue,
  };
}
