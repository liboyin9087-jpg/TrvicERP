import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import { NOTIFICATIONS } from '@/data/dashboardData';

// Define the type for notification levels for better type safety
type NotificationLevel = 'info' | 'warning' | 'success';

const LEVEL_STYLE: Record<NotificationLevel, string> = {
  info: 'bg-primary-500',   // Changed from 'bg-brand-500' to use 'primary' token
  warning: 'bg-amber-500',  // Kept 'bg-amber-500', common for warnings
  success: 'bg-success-500',// Changed from 'bg-emerald-500' to use 'success' token
};

export default function NotificationsWidget({ widget }: { widget: Widget }) {
  // 3. 錯誤處理：檢查 NOTIFICATIONS 是否存在或為空
  if (!NOTIFICATIONS || NOTIFICATIONS.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No new notifications.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {NOTIFICATIONS.map((note) => {
        // 2. note.level 的類型檢查：確保 level 是有效鍵，否則使用預設值
        const currentLevel: NotificationLevel = Object.keys(LEVEL_STYLE).includes(note.level as string)
          ? (note.level as NotificationLevel)
          : 'info'; // 如果 note.level 不在 LEVEL_STYLE 的鍵中，則預設為 'info'

        const levelStyleClass = LEVEL_STYLE[currentLevel];

        return (
          <div
            key={note.id}
            className="flex items-start gap-3 p-2 rounded-lg cursor-pointer
                       hover:bg-gray-50 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
            tabIndex={0} // 使元素可被鍵盤導航聚焦
            role="listitem" // 提供語義化的角色
          >
            <span className={`mt-1 w-2.5 h-2.5 rounded-full ${levelStyleClass}`} />
            <div>
              <div className="text-sm text-gray-800">{note.title}</div>
              <div className="text-sm text-gray-500">{note.time}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}