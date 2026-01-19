/**
 * 備份與恢復服務
 * Backup and Restore Service
 */

import { offlineService } from './offlineService';

/**
 * 備份數據結構
 */
export interface BackupData {
  version: string;
  timestamp: string;
  tables: {
    orders?: any[];
    quotations?: any[];
    sessions?: any[];
    customers?: any[];
    itineraries?: any[];
  };
  metadata: {
    recordCount: number;
    totalSize: number;
  };
}

/**
 * 備份服務
 */
export class BackupService {
  /**
   * 建立備份
   */
  async createBackup(): Promise<BackupData> {
    const tables = {
      orders: await offlineService.getAll('orders'),
      quotations: await offlineService.getAll('quotations'),
      sessions: await offlineService.getAll('sessions'),
      customers: await offlineService.getAll('customers'),
      itineraries: await offlineService.getAll('itineraries'),
    };

    const recordCount = Object.values(tables).reduce(
      (sum, records) => sum + records.length,
      0
    );

    const backup: BackupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tables,
      metadata: {
        recordCount,
        totalSize: JSON.stringify(tables).length,
      },
    };

    // 保存到本地存儲
    this.saveBackupToLocal(backup);

    return backup;
  }

  /**
   * 保存備份到本地存儲
   */
  private saveBackupToLocal(backup: BackupData): void {
    try {
      const backups = this.getLocalBackups();
      backups.push(backup);

      // 只保留最近 10 個備份
      if (backups.length > 10) {
        backups.shift();
      }

      localStorage.setItem('backups', JSON.stringify(backups));
    } catch (error) {
      console.error('Failed to save backup:', error);
    }
  }

  /**
   * 取得本地備份列表
   */
  getLocalBackups(): BackupData[] {
    try {
      const stored = localStorage.getItem('backups');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * 恢復備份
   */
  async restoreBackup(backup: BackupData): Promise<void> {
    // 恢復各個表的數據
    if (backup.tables.orders) {
      for (const order of backup.tables.orders) {
        await offlineService.save('orders', order);
      }
    }

    if (backup.tables.quotations) {
      for (const quotation of backup.tables.quotations) {
        await offlineService.save('quotations', quotation);
      }
    }

    if (backup.tables.sessions) {
      for (const session of backup.tables.sessions) {
        await offlineService.save('sessions', session);
      }
    }

    if (backup.tables.customers) {
      for (const customer of backup.tables.customers) {
        await offlineService.save('customers', customer);
      }
    }

    if (backup.tables.itineraries) {
      for (const itinerary of backup.tables.itineraries) {
        await offlineService.save('itineraries', itinerary);
      }
    }
  }

  /**
   * 導出備份為 JSON 文件
   */
  async exportBackup(backup: BackupData): Promise<void> {
    const jsonContent = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${backup.timestamp.replace(/[:.]/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 從 JSON 文件導入備份
   */
  async importBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string) as BackupData;
          resolve(backup);
        } catch (error) {
          reject(new Error('Invalid backup file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * 刪除備份
   */
  deleteBackup(timestamp: string): void {
    const backups = this.getLocalBackups();
    const filtered = backups.filter((b) => b.timestamp !== timestamp);
    localStorage.setItem('backups', JSON.stringify(filtered));
  }
}

// 單例實例
export const backupService = new BackupService();
