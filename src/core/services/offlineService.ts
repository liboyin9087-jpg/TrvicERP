/**
 * 離線服務（IndexedDB + 雙向同步）
 * Offline Service (IndexedDB + Bidirectional Sync)
 */

/**
 * IndexedDB 資料庫名稱
 */
const DB_NAME = 'TravelMasterDB';
const DB_VERSION = 1;

/**
 * 資料表名稱
 */
const STORES = {
  ORDERS: 'orders',
  QUOTATIONS: 'quotations',
  SESSIONS: 'sessions',
  CUSTOMERS: 'customers',
  ITINERARIES: 'itineraries',
  SYNC_QUEUE: 'sync_queue', // 同步佇列
} as const;

/**
 * 同步狀態
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

/**
 * 同步佇列項目
 */
export interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
  error?: string;
}

/**
 * 離線服務
 */
export class OfflineService {
  private db: IDBDatabase | null = null;

  /**
   * 初始化資料庫
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('無法開啟 IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 建立資料表
        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          const ordersStore = db.createObjectStore(STORES.ORDERS, {
            keyPath: 'id',
          });
          ordersStore.createIndex('sessionId', 'sessionId', { unique: false });
          ordersStore.createIndex('customerId', 'customerId', { unique: false });
          ordersStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.QUOTATIONS)) {
          const quotationsStore = db.createObjectStore(STORES.QUOTATIONS, {
            keyPath: 'id',
          });
          quotationsStore.createIndex('customerId', 'customerId', {
            unique: false,
          });
          quotationsStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
          db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.ITINERARIES)) {
          db.createObjectStore(STORES.ITINERARIES, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: 'id',
          });
          syncQueueStore.createIndex('status', 'status', { unique: false });
          syncQueueStore.createIndex('timestamp', 'timestamp', {
            unique: false,
          });
        }
      };
    });
  }

  /**
   * 儲存資料到 IndexedDB
   */
  async save<T>(table: string, data: T): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 從 IndexedDB 讀取資料
   */
  async get<T>(table: string, id: string): Promise<T | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 從 IndexedDB 讀取所有資料
   */
  async getAll<T>(table: string): Promise<T[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 從 IndexedDB 刪除資料
   */
  async delete(table: string, id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 加入同步佇列
   */
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<void> {
    const syncItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await this.save(STORES.SYNC_QUEUE, syncItem);
  }

  /**
   * 取得待同步項目
   */
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        const items = request.result as SyncQueueItem[];
        // 按時間排序
        items.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 更新同步項目狀態
   */
  async updateSyncItemStatus(
    id: string,
    status: SyncStatus,
    error?: string
  ): Promise<void> {
    const item = await this.get<SyncQueueItem>(STORES.SYNC_QUEUE, id);
    if (!item) return;

    item.status = status;
    if (error) {
      item.error = error;
      item.retryCount += 1;
    }

    await this.save(STORES.SYNC_QUEUE, item);
  }

  /**
   * 檢查是否在線
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * 監聽線上/離線狀態
   */
  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 返回清理函數
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// 匯出單例
export const offlineService = new OfflineService();
