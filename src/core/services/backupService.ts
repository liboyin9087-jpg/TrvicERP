import { offlineService } from './offlineService';

export interface TableData<T = unknown> {
  id: string;
  [key: string]: unknown;
}

export interface BackupTables {
  orders?: TableData[];
  quotations?: TableData[];
  sessions?: TableData[];
  customers?: TableData[];
  itineraries?: TableData[];
}

export interface BackupData {
  version: string;
  timestamp: string;
  tables: BackupTables;
  metadata: {
    recordCount: number;
    totalSize: number;
  };
}

export class BackupService {
  private static readonly MAX_LOCAL_BACKUPS = 10;
  private static readonly BACKUP_STORAGE_KEY = 'backups';

  async createBackup(): Promise<BackupData> {
    const tables: BackupTables = {
      orders: await offlineService.getAll('orders'),
      quotations: await offlineService.getAll('quotations'),
      sessions: await offlineService.getAll('sessions'),
      customers: await offlineService.getAll('customers'),
      itineraries: await offlineService.getAll('itineraries'),
    };

    const recordCount = Object.values(tables).reduce(
      (sum, records) => sum + (records?.length || 0),
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

    this.saveBackupToLocal(backup);
    return backup;
  }

  private saveBackupToLocal(backup: BackupData): void {
    try {
      const backups = this.getLocalBackups();
      backups.push(backup);

      if (backups.length > BackupService.MAX_LOCAL_BACKUPS) {
        backups.shift();
      }

      localStorage.setItem(BackupService.BACKUP_STORAGE_KEY, JSON.stringify(backups));
    } catch (error) {
      console.error('Failed to save backup:', error);
      throw new Error('Failed to save backup to local storage');
    }
  }

  getLocalBackups(): BackupData[] {
    try {
      const stored = localStorage.getItem(BackupService.BACKUP_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as BackupData[]) : [];
    } catch (error) {
      console.error('Failed to get local backups:', error);
      return [];
    }
  }

  async restoreBackup(backup: BackupData): Promise<void> {
    try {
      const restorePromises: Promise<void>[] = [];

      for (const [tableName, records] of Object.entries(backup.tables)) {
        if (records && records.length > 0) {
          for (const record of records) {
            restorePromises.push(offlineService.save(tableName, record));
          }
        }
      }

      await Promise.all(restorePromises);
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw new Error('Failed to restore backup');
    }
  }

  async exportBackup(backup: BackupData): Promise<void> {
    try {
      const jsonContent = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${backup.timestamp.replace(/[:.]/g, '-')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export backup:', error);
      throw new Error('Failed to export backup');
    }
  }

  async importBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result !== 'string') {
            throw new Error('Invalid file content');
          }
          const backup = JSON.parse(result) as BackupData;
          if (!backup.version || !backup.timestamp || !backup.tables) {
            throw new Error('Invalid backup format');
          }
          resolve(backup);
        } catch (error) {
          console.error('Failed to parse backup file:', error);
          reject(new Error('Invalid backup file format'));
        }
      };
      reader.onerror = () => {
        console.error('Failed to read backup file');
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }

  deleteBackup(timestamp: string): void {
    try {
      const backups = this.getLocalBackups();
      const filtered = backups.filter((b) => b.timestamp !== timestamp);
      localStorage.setItem(BackupService.BACKUP_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw new Error('Failed to delete backup');
    }
  }
}

export const backupService = new BackupService();