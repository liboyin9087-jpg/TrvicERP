/**
 * Sync Status Indicator Component
 * 
 * Displays offline/online status and data synchronization state
 */

import React, { useState, useEffect } from 'react';
import { syncService } from '../../services';

export const SyncStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStats, setSyncStats] = useState({
    lastSync: null as Date | null,
    pendingChanges: 0,
    cachedItems: {
      attractions: 0,
      policies: 0,
      trips: 0,
    },
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load sync stats
    const loadStats = async () => {
      const stats = await syncService.getSyncStats();
      setSyncStats(stats);
    };

    loadStats();

    // Refresh stats periodically
    const interval = setInterval(loadStats, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncService.sync();
      const stats = await syncService.getSyncStats();
      setSyncStats(stats);
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (syncStats.pendingChanges > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return '離線';
    if (isSyncing) return '同步中...';
    if (syncStats.pendingChanges > 0) return `待同步 (${syncStats.pendingChanges})`;
    return '已同步';
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isSyncing ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
      </div>

      {/* Sync button */}
      {isOnline && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          title="手動同步"
        >
          <svg
            className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      )}

      {/* Stats tooltip */}
      <div className="relative group">
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap">
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">上次同步:</span>
                <span>
                  {syncStats.lastSync
                    ? new Date(syncStats.lastSync).toLocaleString('zh-TW')
                    : '從未同步'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">景點資料:</span>
                <span>{syncStats.cachedItems.attractions}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">政策文件:</span>
                <span>{syncStats.cachedItems.policies}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">旅程資料:</span>
                <span>{syncStats.cachedItems.trips}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncStatusIndicator;
