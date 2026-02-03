import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import StatusBadge from '../ui/StatusBadge'; // Assuming StatusBadge handles different status strings

// --- ARCHITECT: Define explicit Props and data types for Kintone independence ---

/**
 * Defines the structure for a single recent order item.
 * This type should ideally be shared across your application (e.g., in '@/core/types/data').
 * For this example, it's defined here for self-containment.
 */
export interface RecentOrder {
  id: string;
  company: string;
  trip: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'shipped' | 'processing'; // Example statuses
  // Add other relevant fields for an order item as needed
}

/**
 * Defines the configuration options specific to the RecentOrdersWidget.
 * This replaces configuration previously obtained from a generic `Widget` type.
 */
interface RecentOrdersWidgetConfig {
  /**
   * Optional. Limits the number of order rows displayed in the widget.
   * Defaults to 5 if not provided.
   */
  tableRowLimit?: number;
}

/**
 * Defines the complete set of props for the RecentOrdersWidget component.
 * Ensures all necessary data and configuration are passed explicitly via props.
 */
interface RecentOrdersWidgetProps {
  /**
   * The title to be displayed at the top of the widget.
   * (DESIGNER: Addresses missing Widget title display)
   */
  title: string;
  /**
   * An array of recent order data to be displayed.
   * (ARCHITECT: Replaces direct dependency on global `RECENT_ORDERS` data)
   */
  orders: RecentOrder[];
  /**
   * Configuration options for the widget's behavior and display.
   * (ARCHITECT: Provides component configuration independently)
   */
  config: RecentOrdersWidgetConfig;
}

/**
 * RecentOrdersWidget component displays a list of recent orders.
 * It's designed to be a standalone widget, receiving all its data and configuration
 * through props, adhering to Dashtail UI and Kintone independence guidelines.
 */
export default function RecentOrdersWidget({ title, orders, config }: RecentOrdersWidgetProps) {
  // ARCHITECT: Data slicing logic remains within the component, but operates on prop data
  const limit = config.tableRowLimit || 5;
  const rows = orders.slice(0, limit);

  // DESIGNER: Determine if there are orders to display for empty state handling
  const hasOrders = rows.length > 0;

  return (
    // DESIGNER: Implement Dashtail UI規範 - Standard Widget Card Structure
    // - `rounded-lg shadow-md bg-white p-4`: Common card styling
    // - `flex flex-col h-full`: Ensures the card fills its container height and its content is laid out vertically
    <div className="rounded-lg shadow-md bg-white p-4 flex flex-col h-full">
      {/* DESIGNER: Implement Dashtail UI規範 - Drag-handle structure and Widget Title */}
      {/* - `drag-handle`: Required class for draggable widgets */}
      {/* - `h3`: Standard heading for widget titles */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 drag-handle">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {/* Optional: Add a settings button or an info icon here for widget configuration/details */}
      </div>

      {/* Main content area: `flex-grow` to take available vertical space, `overflow-y-auto` for scrollability */}
      <div className="flex-grow overflow-y-auto -mx-2"> {/* Negative margin to visually align content edges if inner padding is p-2 */}
        {hasOrders ? (
          // Renders the list of orders if available
          <div className="space-y-2">
            {rows.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-100"
                // DESIGNER: Colors using Tailwind Tokens:
                // - `focus:ring-primary-300`: Retained as it's a valid Tailwind token, not a hardcoded hex value.
                // - `active:bg-primary-100`: Changed from `primary-800` to `primary-100` for better visual consistency
                //   and contrast within a light (bg-white) card, aligning with common Dashtail UI interaction patterns.
              >
                <div className="flex-1 min-w-0 pr-2">
                  {/* DESIGNER: Apply correct Tailwind font and text spacing classes */}
                  <div className="font-medium text-sm text-gray-900 truncate">{order.company}</div>
                  <div className="text-xs text-gray-500 truncate">{order.trip}</div> {/* Smaller text for secondary info */}
                </div>
                <div className="text-right ml-3">
                  {/* DESIGNER: Apply correct Tailwind font and text spacing classes */}
                  <div className="font-semibold text-sm text-gray-900">{formatCurrency(order.amount)}</div>
                  <StatusBadge status={order.status} className="mt-1" /> {/* Added margin for spacing */}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // DESIGNER: Implement Dashtail UI規範 - Empty State Handling
          <div className="flex items-center justify-center h-full text-gray-500 text-sm p-4">
            <p>No recent orders to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}