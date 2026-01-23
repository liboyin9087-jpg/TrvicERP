import React from 'react';
import { Plus, X } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import type { WidgetType } from '@/core/types/dashboard';

interface AddWidgetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: WidgetType) => void;
}

export default function AddWidgetPanel({ isOpen, onClose, onAdd }: AddWidgetPanelProps) {
  const availableWidgets = useDashboardStore((state) => state.availableWidgets);

  if (!isOpen) return null;

  return (
    <div className="fixed right-6 top-20 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800">Widget library</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-200 transition-colors">
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      <div className="p-3 max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {availableWidgets.map((widget) => (
            <button
              key={widget.type}
              onClick={() => onAdd(widget.type)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-200 hover:bg-brand-50 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                <Plus size={20} className="text-brand-600" />
              </div>
              <div>
                <div className="font-medium text-gray-800 text-sm">{widget.title}</div>
                <div className="text-xs text-gray-500">{widget.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
