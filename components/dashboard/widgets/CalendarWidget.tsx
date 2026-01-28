import React from 'react';
import type { Widget } from '@/core/types/dashboard';

// Define interface for a calendar event to clarify the data structure
interface CalendarEvent {
  id: string | number;
  title: string;
  date: string;
  company: string;
  pax: number;
}

// Define the full Props interface for CalendarWidget
// This centralizes all configurable aspects of the widget
interface CalendarWidgetConfig {
  widget: Widget; // Standard widget metadata (e.g., id, title, position)
  events: CalendarEvent[]; // The data to be displayed in the calendar
  onEventClick?: (event: CalendarEvent) => void; // Optional handler for event clicks
}

export default function CalendarWidget({ widget, events, onEventClick }: CalendarWidgetConfig) {
  // Use widget.title for the card header if available, otherwise a default
  const widgetTitle = widget.title || 'Upcoming Events';

  return (
    // Standard Dashtail UI Card Structure
    <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      {/* Drag handle for moving the widget */}
      <div className="drag-handle px-4 pt-4 pb-2 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{widgetTitle}</h3>
      </div>

      {/* Main content area, scrollable if needed */}
      <div className="flex-grow p-4 space-y-3 overflow-y-auto">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event.id}
              className="p-3 rounded-lg bg-primary-50 border-l-4 border-primary-500
                         hover:bg-primary-100
                         focus-within:ring-2 focus-within:ring-primary-300 focus-within:outline-none
                         active:bg-primary-200 transition-colors duration-150 ease-in-out"
              tabIndex={0} // Make the div focusable
              role="button" // Indicate it's an interactive element
              onClick={() => onEventClick?.(event)} // Call the optional click handler
              onKeyPress={(e) => { // Enhance accessibility for keyboard users
                if (e.key === 'Enter' || e.key === ' ') {
                  onEventClick?.(event);
                }
              }}
            >
              <div className="text-sm font-semibold text-primary-800">{event.title}</div>
              <div className="text-xs text-primary-600">
                {event.date} · {event.company} · {event.pax} pax
              </div>
            </div>
          ))
        ) : (
          // Empty state handling
          <div className="p-3 text-sm text-center text-gray-600 bg-gray-50 rounded-lg">
            No upcoming events.
          </div>
        )}
      </div>
    </div>
  );
}