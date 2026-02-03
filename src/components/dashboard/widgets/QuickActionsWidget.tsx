import React from 'react';
import { DollarSign, Download, Plus, Users } from 'lucide-react';

// Define a type for the allowed icon keys to enhance type safety for ICON_MAP
type ActionIconKey = 'new-tour' | 'new-quote' | 'manage-customers' | 'export-report';

// Explicitly type ICON_MAP to ensure all keys map to a React component type
const ICON_MAP: Record<ActionIconKey, React.ElementType> = {
  'new-tour': Plus,
  'new-quote': DollarSign,
  'manage-customers': Users,
  'export-report': Download,
};

// Define the structure for a single quick action item, including a Tailwind color class
interface QuickActionItem {
  id: string; // Unique identifier for the action
  label: string; // Text label for the action
  icon: ActionIconKey; // Key that maps to an icon component in ICON_MAP
  colorClass: string; // Tailwind CSS class for the background color (e.g., 'bg-primary-500')
}

// Define the configuration props for the QuickActionsWidget
// This interface makes the component independent and configurable via props.
export interface QuickActionsWidgetConfig {
  title?: string; // Optional title for the widget, defaults to '快速操作'
  actions: QuickActionItem[]; // Array of quick action items to display
  onActionClick?: (actionId: string) => void; // Optional callback for when an action button is clicked
}

// QuickActionsWidget component, now fully configured via props
export default function QuickActionsWidget({ title = '快速操作', actions, onActionClick }: QuickActionsWidgetConfig) {
  return (
    // Standard Dashtail UI Card structure for widgets
    <div className="bg-white p-4 shadow-sm rounded-lg flex flex-col h-full">
      {/* Drag handle structure for widget reordering */}
      <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-grow">
        {actions.map((action) => {
          // Retrieve the icon component using the action.icon key
          // Type safety is ensured by ActionIconKey
          const Icon = ICON_MAP[action.icon];
          return (
            <button
              key={action.id}
              onClick={() => onActionClick?.(action.id)} // Use optional chaining for onActionClick
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Use dynamic Tailwind color class from action.colorClass */}
              <div className={`w-10 h-10 rounded-lg ${action.colorClass} flex items-center justify-center`}>
                <Icon size={18} className="text-white" />
              </div>
              {/* Ensure proper Tailwind typography and spacing classes */}
              <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}