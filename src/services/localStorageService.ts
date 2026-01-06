/**
 * Local Storage Service - SQLite-like Local Persistence
 * 
 * Provides offline-first data persistence using IndexedDB
 * with SQLite-like API for mobile and web applications
 */

interface DatabaseSchema {
  version: number;
  stores: {
    [key: string]: {
      keyPath: string;
      autoIncrement?: boolean;
      indexes?: { name: string; keyPath: string; unique?: boolean }[];
    };
  };
}

interface SyncStatus {
  lastSync: number;
  pendingChanges: number;
  status: 'synced' | 'pending' | 'error';
}

// Database Schema Definition
const DB_NAME = 'TrvicERP_LocalDB';
const DB_VERSION = 1;

const SCHEMA: DatabaseSchema = {
  version: DB_VERSION,
  stores: {
    trips: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'userId', keyPath: 'userId', unique: false },
        { name: 'status', keyPath: 'status', unique: false },
        { name: 'updatedAt', keyPath: 'updatedAt', unique: false },
      ],
    },
    proposals: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'tripId', keyPath: 'tripId', unique: false },
        { name: 'createdAt', keyPath: 'createdAt', unique: false },
      ],
    },
    attractions: {
      keyPath: 'id',
      indexes: [
        { name: 'category', keyPath: 'category', unique: false },
        { name: 'region', keyPath: 'region', unique: false },
      ],
    },
    policies: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'category', keyPath: 'category', unique: false },
        { name: 'title', keyPath: 'title', unique: false },
      ],
    },
    syncQueue: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp', unique: false },
        { name: 'status', keyPath: 'status', unique: false },
      ],
    },
    cache: {
      keyPath: 'key',
      indexes: [
        { name: 'expiry', keyPath: 'expiry', unique: false },
      ],
    },
  },
};

class LocalStorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, SCHEMA.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        for (const [storeName, config] of Object.entries(SCHEMA.stores)) {
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, {
              keyPath: config.keyPath,
              autoIncrement: config.autoIncrement,
            });

            // Create indexes
            if (config.indexes) {
              for (const index of config.indexes) {
                objectStore.createIndex(index.name, index.keyPath, {
                  unique: index.unique || false,
                });
              }
            }
          }
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Insert or update data in a store
   */
  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get data by key from a store
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all data from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query data by index
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete data by key
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache data with expiry
   */
  async setCache<T>(key: string, data: T, ttlSeconds: number = 3600): Promise<void> {
    const expiry = Date.now() + ttlSeconds * 1000;
    await this.put('cache', { key, data, expiry });
  }

  /**
   * Get cached data
   */
  async getCache<T>(key: string): Promise<T | null> {
    const cached = await this.get<{ key: string; data: T; expiry: number }>('cache', key);
    if (!cached) return null;

    if (cached.expiry < Date.now()) {
      await this.delete('cache', key);
      return null;
    }

    return cached.data;
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(
    operation: 'create' | 'update' | 'delete',
    storeName: string,
    data: any
  ): Promise<void> {
    await this.put('syncQueue', {
      operation,
      storeName,
      data,
      timestamp: Date.now(),
      status: 'pending',
    });
  }

  /**
   * Get pending sync items
   */
  async getPendingSyncItems(): Promise<any[]> {
    return this.getByIndex('syncQueue', 'status', 'pending');
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    await this.clear('syncQueue');
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const pending = await this.getPendingSyncItems();
    const lastSyncData = await this.getCache<number>('lastSyncTimestamp');

    return {
      lastSync: lastSyncData || 0,
      pendingChanges: pending.length,
      status: pending.length > 0 ? 'pending' : 'synced',
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();

export default localStorageService;
