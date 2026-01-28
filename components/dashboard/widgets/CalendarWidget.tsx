import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import { CALENDAR_EVENTS } from '@/data/dashboardData';

// Define interface for a calendar event to clarify the data structure
interface CalendarEvent {
  id: string | number;
  title: string;
  date: string;
  company: string;
  pax: number;
}

// Assert the type of CALENDAR_EVENTS for better type safety within this component
const typedCalendarEvents: CalendarEvent[] = CALENDAR_EVENTS as CalendarEvent[];

export default function CalendarWidget({ widget }: { widget: Widget }) {
  // The 'widget' prop is provided as a standard parameter for dashboard widgets,
  // but it is not directly used in the current logic of this CalendarWidget.

  return (
    <div className="space-y-3">
      {typedCalendarEvents.length > 0 ? (
        typedCalendarEvents.map((event) => (
          <div
            key={event.id}
            className="p-3 rounded-lg bg-primary-50 border-l-4 border-primary-500 cursor-pointer
                       hover:bg-primary-100
                       focus:ring-2 focus:ring-primary-300 focus:outline-none
                       active:bg-primary-200 transition-colors duration-150 ease-in-out"
            tabIndex={0} // Make the div focusable
            role="button" // Indicate it's an interactive element
          >
            <div className="text-sm font-semibold text-primary-800">{event.title}</div>
            <div className="text-sm text-primary-600">
              {event.date} · {event.company} · {event.pax} pax
            </div>
          </div>
        ))
      ) : (
        <div className="p-3 text-sm text-center text-primary-600 bg-primary-50 rounded-lg">
          No upcoming events.
        </div>
      )}
    </div>
  );
}