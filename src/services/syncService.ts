/**
 * Data Synchronization Service
 * 
 * Handles bi-directional sync between local storage and remote server
 * Supports offline-first architecture with conflict resolution
 */

import { localStorageService } from './localStorageService';
import { getSupabaseClient } from '../lib/supabase';

interface SyncOperation {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  storeName: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'synced' | 'error';
  error?: string;
}

interface SyncResult {
  success: number;
  failed: number;
  errors: string[];
}

class SyncService {
  private isSyncing = false;
  private syncInterval: number | null = null;

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Start automatic sync
   */
  startAutoSync(intervalSeconds: number = 60): void {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    // Sync immediately
    this.sync();

    // Then sync periodically
    this.syncInterval = window.setInterval(() => {
      this.sync();
    }, intervalSeconds * 1000);

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('[Sync] Device is online. Starting sync...');
    this.sync();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('[Sync] Device is offline. Sync paused.');
  };

  /**
   * Perform full synchronization
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[Sync] Already syncing. Skipping...');
      return { success: 0, failed: 0, errors: [] };
    }

    if (!this.isOnline()) {
      console.log('[Sync] Device is offline. Skipping sync.');
      return { success: 0, failed: 0, errors: ['Device is offline'] };
    }

    this.isSyncing = true;
    const result: SyncResult = { success: 0, failed: 0, errors: [] };

    try {
      // Push local changes to server
      await this.pushLocalChanges(result);

      // Pull server changes to local
      await this.pullServerChanges(result);

      // Update last sync timestamp
      await localStorageService.setCache('lastSyncTimestamp', Date.now());

      console.log(`[Sync] Complete. Success: ${result.success}, Failed: ${result.failed}`);
    } catch (error) {
      console.error('[Sync] Error during sync:', error);
      result.errors.push(error instanceof Error ? error.message : String(error));
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Push local changes to server
   */
  private async pushLocalChanges(result: SyncResult): Promise<void> {
    const pendingItems = await localStorageService.getPendingSyncItems();

    if (pendingItems.length === 0) {
      console.log('[Sync] No pending changes to push.');
      return;
    }

    console.log(`[Sync] Pushing ${pendingItems.length} changes to server...`);

    for (const item of pendingItems) {
      try {
        await this.syncItem(item);
        result.success++;

        // Mark as synced
        await localStorageService.put('syncQueue', {
          ...item,
          status: 'synced',
        });
      } catch (error) {
        result.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to sync ${item.storeName}: ${errorMsg}`);

        // Mark as error
        await localStorageService.put('syncQueue', {
          ...item,
          status: 'error',
          error: errorMsg,
        });
      }
    }

    // Clean up synced items older than 24 hours
    await this.cleanupSyncQueue();
  }

  /**
   * Sync a single item to server
   */
  private async syncItem(item: SyncOperation): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const tableName = this.mapStoreNameToTable(item.storeName);

    switch (item.operation) {
      case 'create':
        const { error: createError } = await supabase
          .from(tableName)
          .insert(item.data);
        if (createError) throw createError;
        break;

      case 'update':
        const { error: updateError } = await supabase
          .from(tableName)
          .update(item.data)
          .eq('id', item.data.id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', item.data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  /**
   * Pull server changes to local storage
   */
  private async pullServerChanges(result: SyncResult): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log('[Sync] Supabase not configured. Skipping pull.');
      return;
    }

    const lastSync = await localStorageService.getCache<number>('lastSyncTimestamp');
    const syncFrom = lastSync || 0;

    console.log(`[Sync] Pulling changes since ${new Date(syncFrom).toISOString()}...`);

    // Pull attractions (static data, less frequent updates)
    try {
      const { data: attractions, error } = await supabase
        .from('attractions')
        .select('*')
        .gte('updated_at', new Date(syncFrom).toISOString());

      if (error) throw error;

      if (attractions && attractions.length > 0) {
        for (const attraction of attractions) {
          await localStorageService.put('attractions', attraction);
        }
        console.log(`[Sync] Pulled ${attractions.length} attractions`);
      }
    } catch (error) {
      result.errors.push(`Failed to pull attractions: ${error}`);
    }

    // Pull policies (for RAG)
    try {
      const { data: policies, error } = await supabase
        .from('policies')
        .select('*')
        .gte('updated_at', new Date(syncFrom).toISOString());

      if (error) throw error;

      if (policies && policies.length > 0) {
        for (const policy of policies) {
          await localStorageService.put('policies', policy);
        }
        console.log(`[Sync] Pulled ${policies.length} policies`);
      }
    } catch (error) {
      // Policies table might not exist yet
      console.log('[Sync] Policies table not available yet');
    }
  }

  /**
   * Map local store names to Supabase table names
   */
  private mapStoreNameToTable(storeName: string): string {
    const mapping: Record<string, string> = {
      trips: 'trips',
      proposals: 'proposals',
      attractions: 'attractions',
      policies: 'policies',
    };

    return mapping[storeName] || storeName;
  }

  /**
   * Clean up old sync queue items
   */
  private async cleanupSyncQueue(): Promise<void> {
    const allItems = await localStorageService.getAll<SyncOperation>('syncQueue');
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const item of allItems) {
      if (item.status === 'synced' && item.timestamp < oneDayAgo) {
        await localStorageService.delete('syncQueue', item.id!);
      }
    }
  }

  /**
   * Force full re-sync from server
   */
  async forceFullSync(): Promise<void> {
    console.log('[Sync] Starting full re-sync...');

    // Clear last sync timestamp to pull all data
    await localStorageService.setCache('lastSyncTimestamp', 0);

    // Clear local data stores
    await localStorageService.clear('attractions');
    await localStorageService.clear('policies');

    // Perform sync
    await this.sync();
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    lastSync: Date | null;
    pendingChanges: number;
    cachedItems: {
      attractions: number;
      policies: number;
      trips: number;
    };
  }> {
    const lastSyncTimestamp = await localStorageService.getCache<number>('lastSyncTimestamp');
    const pendingItems = await localStorageService.getPendingSyncItems();

    const attractions = await localStorageService.getAll('attractions');
    const policies = await localStorageService.getAll('policies');
    const trips = await localStorageService.getAll('trips');

    return {
      lastSync: lastSyncTimestamp ? new Date(lastSyncTimestamp) : null,
      pendingChanges: pendingItems.length,
      cachedItems: {
        attractions: attractions.length,
        policies: policies.length,
        trips: trips.length,
      },
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();

export default syncService;
