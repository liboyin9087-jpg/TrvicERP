import React from 'react';
import type { Widget } from '@/core/types/dashboard'; // Assuming Widget is a generic type, e.g., Widget<TConfig>

// Define the type for notification levels for better type safety
type NotificationLevel = 'info' | 'warning' | 'success';

// Define the type for an individual notification item
export type NotificationItem = {
  id: string;
  title: string;
  time: string; // Consider using Date or a more specific timestamp type if possible for future formatting
  level: NotificationLevel;
};

// Define the configuration specific to the NotificationsWidget.
// This interface fulfills the 'interface {file_path_name}Config' requirement.
export interface NotificationsWidgetConfig {
  notifications: NotificationItem[];
  title?: string; // Allow widget title to be configurable
}

// Define the props for the NotificationsWidget component.
// We assume the generic `Widget` type from '@/core/types/dashboard' can be specialized
// to include our specific configuration type.
export interface NotificationsWidgetProps {
  widget: Widget<NotificationsWidgetConfig>;
}

// Style mapping for notification levels using Tailwind tokens.
// This separates presentation concerns.
const LEVEL_STYLE: Record<NotificationLevel, string> = {
  info: 'bg-primary-500',
  warning: 'bg-amber-500',
  success: 'bg-success-500',
};

export default function NotificationsWidget({ widget }: NotificationsWidgetProps) {
  // Extract data from the widget's configuration props, enhancing type safety and Kintone independence.
  const { notifications, title = 'Notifications' } = widget.config;

  // Handle cases where notifications data might be missing or empty.
  // This provides a clear message to the user within the widget's standard structure.
  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
        {/* Widget Header with drag-handle for standard Dashtail UI */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 drag-handle">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        {/* Content area for empty state message */}
        <div className="flex-grow flex items-center justify-center p-4 text-center text-sm text-gray-500">
          No new notifications.
        </div>
      </div>
    );
  }

  return (
    // Standard Dashtail UI Card structure for widgets
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Widget Header with `.drag-handle` class for drag-and-drop functionality */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 drag-handle">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {/* Placeholder for potential widget controls (e.g., settings icon) */}
      </div>

      {/* Widget Content Area: Scrollable list of notifications */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3">
        {notifications.map((note) => {
          // Ensure `note.level` is a valid key for `LEVEL_STYLE`.
          // This adds robustness against malformed data, defaulting to 'info' if invalid.
          const currentLevel: NotificationLevel = Object.keys(LEVEL_STYLE).includes(note.level)
            ? note.level
            : 'info';

          const levelStyleClass = LEVEL_STYLE[currentLevel];

          return (
            <div
              key={note.id}
              className="flex items-start gap-3 p-2 rounded-lg cursor-pointer
                         hover:bg-gray-50 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
              tabIndex={0} // Makes the item focusable via keyboard for accessibility
              role="listitem" // Provides semantic role for screen readers
              aria-label={`Notification: ${note.title} at ${note.time}, level ${currentLevel}`} // More descriptive label
            >
              {/* Decorative element indicating notification level, hidden from screen readers */}
              <span
                className={`mt-1 w-2.5 h-2.5 rounded-full ${levelStyleClass}`}
                aria-hidden="true"
              />
              <div>
                <div className="text-sm text-gray-800">{note.title}</div>
                {/* Adjusted time font size slightly for better hierarchy */}
                <div className="text-xs text-gray-500">{note.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}