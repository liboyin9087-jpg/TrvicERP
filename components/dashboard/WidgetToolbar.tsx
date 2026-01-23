import React from 'react';
import { Check, Plus, RefreshCcw, X } from 'lucide-react';

interface WidgetToolbarProps {
  onAdd: () => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  lastSavedAt?: string | null;
}

export default function WidgetToolbar({
  onAdd,
  onSave,
  onCancel,
  onReset,
  lastSavedAt,
}: WidgetToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
        <span className="text-sm font-medium text-gray-700">Edit mode</span>
      </div>
      {lastSavedAt && (
        <span className="text-xs text-gray-400">Saved {new Date(lastSavedAt).toLocaleTimeString()}</span>
      )}
      <button
        onClick={onAdd}
        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
      >
        <Plus size={14} />
        Add widget
      </button>
      <button
        onClick={onReset}
        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
      >
        <RefreshCcw size={14} />
        Reset
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
      >
        <X size={14} />
        Cancel
      </button>
      <button
        onClick={onSave}
        className="px-4 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors flex items-center gap-1"
      >
        <Check size={16} />
        Save layout
      </button>
    </div>
  );
}
