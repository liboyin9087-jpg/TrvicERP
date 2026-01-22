import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import { CALENDAR_EVENTS } from '@/data/dashboardData';

export default function CalendarWidget(_: { widget: Widget }) {
  return (
    <div className="space-y-3">
      {CALENDAR_EVENTS.map((event) => (
        <div key={event.id} className="p-3 rounded-lg bg-brand-50 border-l-4 border-brand-500">
          <div className="text-sm font-semibold text-gray-800">{event.title}</div>
          <div className="text-xs text-gray-500">
            {event.date} · {event.company} · {event.pax} pax
          </div>
        </div>
      ))}
    </div>
  );
}
