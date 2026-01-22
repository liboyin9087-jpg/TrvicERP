import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import { NOTIFICATIONS } from '@/data/dashboardData';

const LEVEL_STYLE = {
  info: 'bg-brand-500',
  warning: 'bg-amber-500',
  success: 'bg-emerald-500',
};

export default function NotificationsWidget(_: { widget: Widget }) {
  return (
    <div className="space-y-3">
      {NOTIFICATIONS.map((note) => (
        <div key={note.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
          <span className={`mt-1 w-2.5 h-2.5 rounded-full ${LEVEL_STYLE[note.level as keyof typeof LEVEL_STYLE]}`} />
          <div>
            <div className="text-sm text-gray-800">{note.title}</div>
            <div className="text-xs text-gray-500">{note.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
