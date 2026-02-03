import React from 'react';
import { Check, Plus, RefreshCcw, X } from 'lucide-react';

/**
 * Configuration props for the WidgetToolbar component.
 * Adheres to Kintone independence by receiving all necessary data via props.
 */
interface WidgetToolbarConfig {
  onAdd: () => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  lastSavedAt?: string | null;
  /** Optional locale string for date localization, e.g., 'en-US', 'zh-TW' */
  locale?: string;
}

// Common Tailwind CSS classes for default action buttons
const defaultActionButtonClasses =
  "px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 focus:ring-2 focus:ring-primary-300 active:bg-gray-200";

// Tailwind CSS classes for the primary save action button
const primaryActionButtonClasses =
  "px-4 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg transition-colors flex items-center gap-1 focus:ring-2 focus:ring-primary-300";

export default function WidgetToolbar({
  onAdd,
  onSave,
  onCancel,
  onReset,
  lastSavedAt,
  locale = 'en-US', // Default locale for date localization
}: WidgetToolbarConfig) {
  // Function to format the last saved time, considering localization
  const formatLastSavedTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Use Intl.DateTimeFormat for more robust localization options if needed,
      // but toLocaleTimeString is a good start for user's preferred time format.
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (error) {
      console.error("Error formatting date:", error);
      return ''; // Return empty string on error
    }
  };

  return (
    // Main toolbar container with drag-handle support and Dashtail UI compliant styling
    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-lg border border-gray-200 drag-handle">
      <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
        {/* Animated indicator with Dashtail UI compliant primary color token */}
        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        <span className="text-sm font-medium text-gray-700">Edit mode</span>
      </div>
      {lastSavedAt && (
        // Localized time display
        <span className="text-sm text-gray-400">Saved {formatLastSavedTime(lastSavedAt)}</span>
      )}
      <button
        onClick={onAdd}
        className={defaultActionButtonClasses}
      >
        <Plus size={14} />
        Add widget
      </button>
      <button
        onClick={onReset}
        className={defaultActionButtonClasses}
      >
        <RefreshCcw size={14} />
        Reset
      </button>
      <button
        onClick={onCancel}
        className={defaultActionButtonClasses}
      >
        <X size={14} />
        Cancel
      </button>
      <button
        onClick={onSave}
        className={primaryActionButtonClasses} // Using specific classes for primary action
      >
        <Check size={16} />
        Save layout
      </button>
    </div>
  );
}