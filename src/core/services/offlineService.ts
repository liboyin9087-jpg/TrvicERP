// Simple UUID v4 implementation (crypto-based, no external dependency needed)
const generateUUID = (): string => {
  // Implementation for generating UUID v4 without external dependency
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const uuidv4 = generateUUID;

/**
 * 環境變數或配置檔讀取的預設配置
 */
export const DEFAULT_OFFLINE_SERVICE_CONFIG = {
  DB_NAME: 'TravelMaster_OfflineDB',
  DB_VERSION: 2, // 增加版本號以觸發onupgradeneeded
  MAX_RETRIES: 5, // 資料庫操作重試次數
  RETRY_DELAY_MS: 200, // 資料庫操作重試初始延遲（指數退避）
  SYNC_MAX_RETRIES: 10, // 同步佇列項目重試次數
  SYNC_RETRY_DELAY_MS: 1000, // 同步佇列項目重試初始延遲
  SYNC_BATCH_SIZE: 5, // 每次同步處理的項目數量
  SYNC_INTERVAL_MS: 60000, // 同步間隔
};

/**
 * 資料表名稱
 */
export const STORES = {
  ORDERS: 'orders',
  QUOTATIONS: 'quotations',
  SESSIONS: 'sessions',
  CUSTOMERS: 'customers',
  ITINERARIES: 'itineraries',
  SYNC_QUEUE: 'sync_queue', // 同步佇列
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

/**
 * 資料庫結構定義
 * 包含每個Object Store的配置和索引
 */
export const STORE_SCHEMA = {
  [STORES.ORDERS]: {
    options: { keyPath: 'id' },
    indexes: [
      { name: 'sessionId', keyPath: 'sessionId', options: { unique: false } },
      { name: 'customerId', keyPath: 'customerId', options: { unique: false } },
      { name: 'status', keyPath: 'status', options: { unique: false } },
    ],
  },
  [STORES.QUOTATIONS]: {
    options: { keyPath: 'id' },
    indexes: [
      { name: 'customerId', keyPath: 'customerId', options: { unique: false } },
      { name: 'status', keyPath: 'status', options: { unique: false } },
    ],
  },
  [STORES.SESSIONS]: { options: { keyPath: 'id' }, indexes: [] },
  [STORES.CUSTOMERS]: { options: { keyPath: 'id' }, indexes: [] },
  [STORES.ITINERARIES]: { options: { keyPath: 'id' }, indexes: [] },
  [STORES.SYNC_QUEUE]: {
    options: { keyPath: 'queueId' }, // 佇列項目使用 queueId 作為唯一主鍵
    indexes: [
      { name: 'status', keyPath: 'status', options: { unique: false } },
      { name: 'timestamp', keyPath: 'timestamp', options: { unique: false } },
    ],
  },
} satisfies {
  [key in StoreName]: {
    options: IDBObjectStoreParameters;
    indexes: { name: string; keyPath: string | string[]; options: IDBIndexParameters }[];
  }
};

/**
 * 離線服務配置接口
 */
export interface OfflineServiceConfig {
  dbName: string;
  dbVersion: number;
  maxRetries: number;
  retryDelayMs: number;
  syncMaxRetries: number;
  syncRetryDelayMs: number;
  syncBatchSize: number;
  syncIntervalMs: number;
  stores: typeof STORES; // 應從配置中獲取而非硬編碼
  storeSchema: typeof STORE_SCHEMA; // 應從配置中獲取而非硬編碼
}

/**
 * 同步狀態
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

/**
 * 基礎實體介面，所有可儲存的資料都應該實現此介面
 */
export interface StorableEntity {
  id: string; // 業務實體的唯一ID
  [key: string]: any; // 允許額外屬性
}

// 示例：具體業務實體類型
export interface Order extends StorableEntity {
  sessionId: string;
  customerId: string;
  status: string;
  amount: number;
  // ... 其他訂單相關屬性
}

export interface Quotation extends StorableEntity {
  customerId: string;
  status: string;
  totalPrice: number;
  // ... 其他報價相關屬性
}

// 其他實體...
export interface Session extends StorableEntity { }
export interface Customer extends StorableEntity { }
export interface Itinerary extends StorableEntity { }

/**
 * 同步佇列項目
 */
export interface SyncQueueItem<T extends StorableEntity = StorableEntity> {
  queueId: string; // 佇列項目的唯一ID，與業務實體ID不同
  table: StoreName;
  operation: 'create' | 'update' | 'delete';
  data: T; // 業務實體數據，必須包含其id
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
  error?: string;
  lastAttemptTimestamp?: number; // 上次嘗試同步的時間
}

/**
 * 自定義錯誤類別
 */
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: DOMException | Event | Error) {
    super(message);
    this.name = 'DatabaseError';
    console.error('DatabaseError:', message, originalError);
  }
}

export class TransactionError extends DatabaseError {
  constructor(message: string, public originalError?: DOMException | Event | Error) {
    super(message, originalError);
    this.name = 'TransactionError';
  }
}

export class DataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataValidationError';
  }
}

/**
 * 帶有指數退避的重試機制
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  initialDelayMs: number,
  context: string = 'operation'
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error(`Max retries (${maxRetries}) exceeded for ${context}.`, error);
        throw error;
      }
      const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 100); // 增加隨機抖動
      console.warn(
        `Attempt ${attempt} failed for ${context}, retrying in ${delay}ms...`,
        (error as Error).message || error
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  // This line should ideally not be reached
  throw new Error(`withRetry: Failed to complete ${context} after ${maxRetries} attempts.`);
}

/**
 * IndexedDB 連線管理器
 * 負責 IndexedDB 的初始化、連線管理和升級邏輯
 */
class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private config: OfflineServiceConfig;
  private connectPromise: Promise<IDBDatabase> | null = null;
  private isConnecting: boolean = false;

  constructor(config: OfflineServiceConfig) {
    this.config = config;
    this.initializeConnection(); // 在建構時嘗試初始化連接
  }

  /**
   * 內部方法：初始化或重新建立資料庫連線
   */
  private async initializeConnection(): Promise<IDBDatabase> {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    if (this.isConnecting && !this.db) {
      // Already trying to connect, wait for the existing promise
      return new Promise<IDBDatabase>((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (this.db) {
            clearInterval(checkConnection);
            resolve(this.db);
          } else if (!this.isConnecting) { // If connection attempt failed
            clearInterval(checkConnection);
            reject(new DatabaseError('Connection attempt failed.'));
          }
        }, 100); // Check every 100ms
      });
    }

    this.isConnecting = true;
    this.connectPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = (event) => {
        this.db = null;
        this.connectPromise = null;
        this.isConnecting = false;
        reject(new DatabaseError('Failed to open IndexedDB', event.target?.error));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.db.onversionchange = (e) => {
          console.warn('IndexedDB version change detected, closing connection.', e);
          this.db?.close();
          this.db = null; // Mark as closed
          this.connectPromise = null;
          this.isConnecting = false;
          // You might want to notify the user or trigger a full refresh
          alert('Database schema updated. Please refresh the application.');
        };
        this.db.onclose = () => {
          console.warn('IndexedDB connection closed unexpectedly.');
          this.db = null;
          this.connectPromise = null;
          this.isConnecting = false;
        };
        this.isConnecting = false;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;
        console.log(`IndexedDB upgrading from version ${oldVersion} to ${newVersion}`);

        // 遍歷所有在配置中定義的資料表並建立或更新它們
        for (const storeName of Object.values(this.config.stores)) {
          const storeConfig = this.config.storeSchema[storeName as StoreName];
          if (!storeConfig) {
            console.warn(`Schema for store "${storeName}" not found in config.`);
            continue;
          }

          let store: IDBObjectStore;
          if (!db.objectStoreNames.contains(storeName)) {
            // 如果資料表不存在，則建立它
            store = db.createObjectStore(storeName, storeConfig.options);
            console.log(`ObjectStore '${storeName}' created.`);
          } else {
            // 如果資料表已存在，但配置有更新（例如，需要新的索引），則獲取它
            store = request.transaction!.objectStore(storeName);
            console.log(`ObjectStore '${storeName}' already exists.`);
          }

          // 檢查並建立/更新索引
          storeConfig.indexes.forEach((indexConfig) => {
            if (!store.indexNames.contains(indexConfig.name)) {
              store.createIndex(
                indexConfig.name,
                indexConfig.keyPath,
                indexConfig.options
              );
              console.log(`Index '${indexConfig.name}' created for store '${storeName}'.`);
            }
          });
        }
      };
    }).finally(() => {
      this.isConnecting = false; // Reset connecting flag after promise settles
    });
    return this.connectPromise;
  }

  /**
   * 獲取 IndexedDB 資料庫實例
   * 如果尚未連線，則等待連線建立
   */
  async getDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeConnection();
    }
    if (!this.db) {
      throw new DatabaseError('IndexedDB connection is not available.');
    }
    return this.db;
  }

  /**
   * 關閉資料庫連線
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.connectPromise = null;
      console.log('IndexedDB connection closed.');
    }
  }

  /**
   * 檢查資料庫連線狀態
   */
  isConnected(): boolean {
    return this.db !== null && this.connectPromise !== null;
  }
}

/**
 * 離線資料庫操作層
 * 負責所有對 IndexedDB 的 CRUD 操作，並提供交易和錯誤處理
 */
class OfflineDB {
  private indexedDBManager: IndexedDBManager;
  private config: OfflineServiceConfig;

  constructor(indexedDBManager: IndexedDBManager, config: OfflineServiceConfig) {
    this.indexedDBManager = indexedDBManager;
    this.config = config;
  }

  /**
   * 在交易中執行操作，並帶有重試機制
   */
  async runTransaction<T>(
    storeNames: StoreName[],
    mode: IDBTransactionMode,
    callback: (transaction: IDBTransaction, stores: { [key in StoreName]?: IDBObjectStore }) => Promise<T>
  ): Promise<T> {
    return withRetry(
      async () => {
        const db = await this.indexedDBManager.getDb();
        const transaction = db.transaction(storeNames, mode);
        const storeMap: { [key in StoreName]?: IDBObjectStore } = {};
        for (const name of storeNames) {
          storeMap[name] = transaction.objectStore(name);
        }

        return new Promise<T>((resolve, reject) => {
          transaction.oncomplete = () => {
            // Transaction completed successfully, result is already propagated by the callback promise
            // if it resolves before transaction.oncomplete.
            // Or, if callback doesn't explicitly resolve/reject via a promise,
            // we rely on the transaction completion to signal success for simple ops.
          };
          transaction.onerror = (event) => {
            reject(new TransactionError(`Transaction failed: ${event.target?.error?.message}`, event.target?.error));
          };
          transaction.onabort = (event) => {
            reject(new TransactionError(`Transaction aborted: ${event.target?.error?.message}`, event.target?.error));
          };

          // Execute the callback and catch its potential errors
          callback(transaction, storeMap)
            .then(resolve)
            .catch(error => {
              // Abort the transaction if the callback encounters an error
              try {
                transaction.abort();
              } catch (abortError) {
                console.error("Failed to abort transaction after callback error:", abortError);
              }
              reject(error);
            });
        });
      },
      this.config.maxRetries,
      this.config.retryDelayMs,
      `IndexedDB transaction for stores: ${storeNames.join(', ')}`
    );
  }

  /**
   * 對資料進行基本驗證
   * 可擴展為使用 Joi, Yup 等驗證庫
   */
  private validateData<T extends StorableEntity>(table: StoreName, data: T): void {
    if (!data || typeof data !== 'object') {
      throw new DataValidationError(`Invalid data for table ${table}: must be an object.`);
    }
    if (!data.id || typeof data.id !== 'string') {
      throw new DataValidationError(`Invalid data for table ${table}: 'id' is required and must be a string.`);
    }
    // TODO: 可在此處添加更多基於 schema 的驗證邏輯
  }

  /**
   * 儲存或更新資料到 IndexedDB
   */
  async save<T extends StorableEntity>(table: StoreName, data: T): Promise<void> {
    this.validateData(table, data);
    await this.runTransaction(
      [table],
      'readwrite',
      async (tx, stores) => {
        const store = stores[table]!;
        return new Promise<void>((resolve, reject) => {
          const request = store.put(data);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 從 IndexedDB 讀取單筆資料
   */
  async get<T extends StorableEntity>(table: StoreName, id: string): Promise<T | null> {
    return this.runTransaction(
      [table],
      'readonly',
      async (tx, stores) => {
        const store = stores[table]!;
        return new Promise<T | null>((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 從 IndexedDB 讀取所有資料
   */
  async getAll<T extends StorableEntity>(table: StoreName): Promise<T[]> {
    return this.runTransaction(
      [table],
      'readonly',
      async (tx, stores) => {
        const store = stores[table]!;
        return new Promise<T[]>((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 從 IndexedDB 刪除資料
   */
  async delete(table: StoreName, id: string): Promise<void> {
    await this.runTransaction(
      [table],
      'readwrite',
      async (tx, stores) => {
        const store = stores[table]!;
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 透過索引查詢資料
   */
  async queryByIndex<T extends StorableEntity>(
    table: StoreName,
    indexName: string,
    query: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    return this.runTransaction(
      [table],
      'readonly',
      async (tx, stores) => {
        const store = stores[table]!;
        return new Promise<T[]>((resolve, reject) => {
          if (!store.indexNames.contains(indexName)) {
            return reject(new DatabaseError(`Index '${indexName}' not found in store '${table}'.`));
          }
          const index = store.index(indexName);
          const request = index.getAll(query);
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      }
    );
  }
}

/**
 * 離線服務（IndexedDB + 雙向同步）
 * 負責業務邏輯層面的資料持久化、同步佇列管理和連線狀態監聽
 */
export class OfflineService {
  private config: OfflineServiceConfig;
  private indexedDBManager: IndexedDBManager;
  private offlineDB: OfflineDB;
  private syncIntervalId: number | null = null;
  private isSyncing: boolean = false;

  constructor(config: OfflineServiceConfig) {
    this.config = { ...DEFAULT_OFFLINE_SERVICE_CONFIG, ...config };
    this.indexedDBManager = new IndexedDBManager(this.config);
    this.offlineDB = new OfflineDB(this.indexedDBManager, this.config);

    // 當應用程式上線時觸發一次同步
    window.addEventListener('online', this.triggerImmediateSync);
  }

  /**
   * 初始化資料庫連線
   */
  async init(): Promise<void> {
    try {
      await this.indexedDBManager.getDb();
      console.log('OfflineService: IndexedDB initialized and connected.');
      this.startSyncScheduler(); // 連線成功後啟動同步排程
    } catch (error) {
      console.error('OfflineService: Failed to initialize IndexedDB.', error);
      throw error;
    }
  }

  /**
   * 啟動定期同步排程器
   */
  private startSyncScheduler(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
    this.syncIntervalId = window.setInterval(() => {
      if (this.isOnline()) {
        this.processSyncQueue().catch(err =>
          console.error('Error during scheduled sync:', err)
        );
      } else {
        console.log('Offline: Skipping scheduled sync.');
      }
    }, this.config.syncIntervalMs);
    console.log(`OfflineService: Sync scheduler started with interval ${this.config.syncIntervalMs}ms.`);
  }

  /**
   * 停止定期同步排程器
   */
  stopSyncScheduler(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('OfflineService: Sync scheduler stopped.');
    }
  }

  /**
   * 觸發立即同步（通常在線上狀態恢復時）
   */
  private triggerImmediateSync = async (): Promise<void> => {
    if (this.isOnline() && !this.isSyncing) {
      console.log('Online status detected, triggering immediate sync...');
      await this.processSyncQueue().catch(err =>
        console.error('Error during immediate sync:', err)
      );
    }
  };

  /**
   * 儲存或更新業務實體並加入同步佇列
   * 此操作具備交易性：資料寫入本地DB和加入同步佇列是原子操作
   */
  async upsertEntityAndQueueSync<T extends StorableEntity>(table: StoreName, data: T, operation: 'create' | 'update'): Promise<void> {
    this.offlineDB.validateData(table, data); // 執行資料驗證

    // 確保 data.id 存在，如果操作是 'create' 且 id 不存在，則自動生成一個
    if (operation === 'create' && !data.id) {
      data.id = uuidv4();
    }

    const queueItemDraft: Omit<SyncQueueItem<T>, 'queueId' | 'timestamp' | 'status' | 'retryCount'> = {
      table,
      operation,
      data,
    };

    await this.offlineDB.runTransaction(
      [table, this.config.stores.SYNC_QUEUE],
      'readwrite',
      async (tx, stores) => {
        const dataStore = stores[table]!;
        const syncQueueStore = stores[this.config.stores.SYNC_QUEUE]!;

        // 1. 儲存/更新實際業務數據
        await new Promise<void>((resolve, reject) => {
          const req = dataStore.put(data);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });

        // 2. 加入同步佇列
        const syncItem: SyncQueueItem<T> = {
          ...queueItemDraft,
          queueId: uuidv4(), // 佇列項目使用獨立的 queueId
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
        };
        await new Promise<void>((resolve, reject) => {
          // 使用 add 確保每個佇列項目是唯一的，如果存在相同的 queueId 會失敗 (但uuidv4保證唯一性)
          const req = syncQueueStore.add(syncItem);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
    );
    console.log(`Entity ${data.id} saved to ${table} and added to sync queue.`);
  }

  /**
   * 刪除業務實體並加入同步佇列
   * 此操作具備交易性
   */
  async deleteEntityAndQueueSync(table: StoreName, id: string): Promise<void> {
    if (!id) {
      throw new DataValidationError('ID is required for deletion.');
    }

    // 獲取要刪除的實體數據，以便在同步佇列中包含完整的數據 (如果需要，例如用於恢復)
    const dataToDelete = await this.offlineDB.get(table, id);
    if (!dataToDelete) {
      console.warn(`Entity with ID ${id} not found in ${table}, skipping local delete and sync queue add.`);
      return;
    }

    const queueItemDraft: Omit<SyncQueueItem, 'queueId' | 'timestamp' | 'status' | 'retryCount'> = {
      table,
      operation: 'delete',
      data: dataToDelete, // 包含完整的數據以便後端處理
    };

    await this.offlineDB.runTransaction(
      [table, this.config.stores.SYNC_QUEUE],
      'readwrite',
      async (tx, stores) => {
        const dataStore = stores[table]!;
        const syncQueueStore = stores[this.config.stores.SYNC_QUEUE]!;

        // 1. 從本地資料庫刪除實體
        await new Promise<void>((resolve, reject) => {
          const req = dataStore.delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });

        // 2. 加入同步佇列
        const syncItem: SyncQueueItem = {
          ...queueItemDraft,
          queueId: uuidv4(),
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
        };
        await new Promise<void>((resolve, reject) => {
          const req = syncQueueStore.add(syncItem);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
    );
    console.log(`Entity ${id} deleted from ${table} and added to sync queue.`);
  }

  /**
   * 從 IndexedDB 讀取資料
   */
  async get<T extends StorableEntity>(table: StoreName, id: string): Promise<T | null> {
    return this.offlineDB.get<T>(table, id);
  }

  /**
   * 從 IndexedDB 讀取所有資料
   */
  async getAll<T extends StorableEntity>(table: StoreName): Promise<T[]> {
    return this.offlineDB.getAll<T>(table);
  }

  /**
   * 處理同步佇列，將待同步項目發送到後端
   */
  async processSyncQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline()) {
      console.log('Sync in progress or offline, skipping queue processing.');
      return;
    }

    this.isSyncing = true;
    console.log('Processing sync queue...');

    try {
      const pendingItems = await this.offlineDB.queryByIndex<SyncQueueItem>(
        this.config.stores.SYNC_QUEUE,
        'status',
        'pending'
      );
      // 按時間排序，確保先入先出 (FIFO)
      pendingItems.sort((a, b) => a.timestamp - b.timestamp);

      // 篩選出可重試的項目 (達到最大重試次數的跳過)
      const itemsToProcess = pendingItems.filter(
        item => item.retryCount < this.config.syncMaxRetries
      );

      if (itemsToProcess.length === 0) {
        console.log('Sync queue is empty.');
        return;
      }

      console.log(`Found ${itemsToProcess.length} pending items to sync.`);

      // 批次處理
      const batch = itemsToProcess.slice(0, this.config.syncBatchSize);

      for (const item of batch) {
        await this.updateSyncItemStatus(item.queueId, 'syncing'); // 更新狀態為正在同步

        try {
          // 模擬發送資料到後端 API
          // TODO: 替換為實際的 API 呼叫，例如 axios.post('/api/sync', item.data)
          const backendResponse = await this.sendToBackend(item);

          // 檢查後端響應是否表示成功處理 (冪等性處理應在後端完成)
          if (backendResponse.success) {
            await this.updateSyncItemStatus(item.queueId, 'synced'); // 同步成功
            console.log(`SyncQueueItem ${item.queueId} synced successfully.`);
          } else {
            throw new Error(backendResponse.message || 'Backend reported failure.');
          }
        } catch (error) {
          const errorMessage = (error as Error).message || String(error);
          console.error(`Failed to sync item ${item.queueId}: ${errorMessage}`);
          await this.updateSyncItemStatus(item.queueId, 'error', errorMessage); // 同步失敗
        }
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.isSyncing = false;
      console.log('Sync queue processing finished.');
      // 如果還有待同步項目，可以考慮再次觸發同步
      const remainingItems = await this.offlineDB.queryByIndex<SyncQueueItem>(
        this.config.stores.SYNC_QUEUE,
        'status',
        'pending'
      );
      if (remainingItems.length > 0) {
        console.log(`There are still ${remainingItems.length} pending items. Will retry on next scheduled interval or network event.`);
      }
    }
  }

  /**
   * 發送同步資料到後端 API
   * 根據操作類型 (create/update/delete) 對應至 HTTP 方法 (POST/PUT/DELETE)
   */
  private async sendToBackend(item: SyncQueueItem): Promise<{ success: boolean; message?: string }> {
    const baseUrl = this.getApiBaseUrl();
    const endpoint = `${baseUrl}/api/v1/${item.table}`;

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let response: Response;

      switch (item.operation) {
        case 'create':
          response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(item.data),
          });
          break;
        case 'update':
          response = await fetch(`${endpoint}/${item.data.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(item.data),
          });
          break;
        case 'delete':
          response = await fetch(`${endpoint}/${item.data.id}`, {
            method: 'DELETE',
            headers,
          });
          break;
        default:
          return { success: false, message: `Unknown operation: ${item.operation}` };
      }

      if (response.ok) {
        return { success: true, message: `${item.operation} on ${item.table}/${item.data.id} succeeded` };
      }

      const errorBody = await response.text().catch(() => '');
      return {
        success: false,
        message: `HTTP ${response.status}: ${errorBody || response.statusText}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Network error: ${message}` };
    }
  }

  /**
   * 取得 API 的 base URL，可從環境變數或預設值獲取
   */
  private getApiBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // 嘗試從 meta tag 或環境中取得，否則使用預設值
      const metaTag = document.querySelector<HTMLMetaElement>('meta[name="api-base-url"]');
      if (metaTag?.content) return metaTag.content;
    }
    return 'http://localhost:4000';
  }

  /**
   * 更新同步項目狀態
   */
  async updateSyncItemStatus(
    queueId: string,
    status: SyncStatus,
    error?: string
  ): Promise<void> {
    const item = await this.offlineDB.get<SyncQueueItem>(this.config.stores.SYNC_QUEUE, queueId);
    if (!item) {
      console.warn(`SyncQueueItem with queueId ${queueId} not found.`);
      return;
    }

    item.status = status;
    item.lastAttemptTimestamp = Date.now();
    if (status === 'error' || error) {
      item.error = error;
      item.retryCount += 1;
    } else {
      delete item.error;
    }

    await this.offlineDB.save(this.config.stores.SYNC_QUEUE, item);
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
    const handleOnline = () => {
      console.log('Network status: Online');
      callback(true);
      this.triggerImmediateSync(); // 線上時觸發同步
    };
    const handleOffline = () => {
      console.log('Network status: Offline');
      callback(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 返回清理函數
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * 清理所有資源
   */
  destroy(): void {
    this.stopSyncScheduler();
    this.indexedDBManager.close();
    window.removeEventListener('online', this.triggerImmediateSync);
    console.log('OfflineService destroyed.');
  }
}

// 匯出單例，預設配置可以被覆寫
export const offlineService = new OfflineService({
  dbName: DEFAULT_OFFLINE_SERVICE_CONFIG.DB_NAME,
  dbVersion: DEFAULT_OFFLINE_SERVICE_CONFIG.DB_VERSION,
  maxRetries: DEFAULT_OFFLINE_SERVICE_CONFIG.MAX_RETRIES,
  retryDelayMs: DEFAULT_OFFLINE_SERVICE_CONFIG.RETRY_DELAY_MS,
  syncMaxRetries: DEFAULT_OFFLINE_SERVICE_CONFIG.SYNC_MAX_RETRIES,
  syncRetryDelayMs: DEFAULT_OFFLINE_SERVICE_CONFIG.SYNC_RETRY_DELAY_MS,
  syncBatchSize: DEFAULT_OFFLINE_SERVICE_CONFIG.SYNC_BATCH_SIZE,
  syncIntervalMs: DEFAULT_OFFLINE_SERVICE_CONFIG.SYNC_INTERVAL_MS,
  stores: STORES,
  storeSchema: STORE_SCHEMA,
});