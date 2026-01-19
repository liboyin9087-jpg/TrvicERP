import { Order, Quotation, Session, Customer, Itinerary } from '../types';

/**
 * IndexedDB 資料庫名稱
 */
const DB_NAME = 'TrvicERPDB';
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
  SYNC_QUEUE: 'sync_queue',
  CONFLICTS: 'conflicts'
} as const;

type StoreKey = keyof typeof STORES;
type StoreName = typeof STORES[StoreKey];

/**
 * 同步狀態
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

/**
 * 同步佇列項目
 */
export interface SyncQueueItem<T = unknown> {
  id: string;
  table: StoreName;
  operation: 'create' | 'update' | 'delete';
  data: T;
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
  error?: string;
  localVersion?: number;
  serverVersion?: number;
}

/**
 * 衝突解決策略
 */
export type ConflictResolutionStrategy = 
  | 'local-wins'
  | 'server-wins'
  | 'merge'
  | 'manual';

/**
 * 衝突資訊
 */
export interface ConflictInfo<T = unknown> {
  id: string;
  table: StoreName;
  localData: T;
  serverData: T;
  localVersion: number;
  serverVersion: number;
  timestamp: string;
}

export class OfflineService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          const ordersStore = db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
          ordersStore.createIndex('sessionId', 'sessionId', { unique: false });
          ordersStore.createIndex('customerId', 'customerId', { unique: false });
          ordersStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.QUOTATIONS)) {
          const quotationsStore = db.createObjectStore(STORES.QUOTATIONS, { keyPath: 'id' });
          quotationsStore.createIndex('customerId', 'customerId', { unique: false });
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
          const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          syncQueueStore.createIndex('status', 'status', { unique: false });
          syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.CONFLICTS)) {
          db.createObjectStore(STORES.CONFLICTS, { keyPath: 'id' });
        }
      };
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  async save<T>(table: StoreName, data: T & { id: string }): Promise<void> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(table: StoreName, id: string): Promise<T | null> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(table: StoreName): Promise<T[]> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(table: StoreName, id: string): Promise<void> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addToSyncQueue<T>(item: Omit<SyncQueueItem<T>, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<void> {
    const syncItem: SyncQueueItem<T> = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await this.save(STORES.SYNC_QUEUE, syncItem);
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        const items = request.result as SyncQueueItem[];
        items.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncItemStatus(
    id: string,
    status: SyncStatus,
    error?: string
  ): Promise<void> {
    const item = await this.get<SyncQueueItem>(STORES.SYNC_QUEUE, id);
    if (!item) return;

    const updatedItem: SyncQueueItem = {
      ...item,
      status,
      retryCount: error ? item.retryCount + 1 : item.retryCount,
      ...(error && { error })
    };

    await this.save(STORES.SYNC_QUEUE, updatedItem);
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  async resolveConflict<T>(
    conflict: ConflictInfo<T>,
    strategy: ConflictResolutionStrategy,
    mergeFunction?: (local: T, server: T) => T
  ): Promise<T> {
    switch (strategy) {
      case 'local-wins':
        return conflict.localData;
      case 'server-wins':
        return conflict.serverData;
      case 'merge':
        if (mergeFunction) {
          return mergeFunction(conflict.localData, conflict.serverData);
        }
        return { ...conflict.serverData, ...conflict.localData };
      case 'manual':
        throw new Error('Manual conflict resolution required');
      default:
        return conflict.serverData;
    }
  }

  hasConflict(localVersion: number, serverVersion: number): boolean {
    return localVersion !== serverVersion;
  }

  async saveConflict<T>(conflict: ConflictInfo<T>): Promise<void> {
    await this.save(STORES.CONFLICTS, conflict);
  }

  async getConflicts<T>(): Promise<ConflictInfo<T>[]> {
    return this.getAll<ConflictInfo<T>>(STORES.CONFLICTS);
  }

  async clearConflict(id: string): Promise<void> {
    await this.delete(STORES.CONFLICTS, id);
  }
}

export const offlineService = new OfflineService();