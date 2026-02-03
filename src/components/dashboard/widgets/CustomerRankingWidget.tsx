import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import { formatCurrency } from '@/lib/formatters';

// Define data structure for a single customer ranking item
interface CustomerRankingItem {
  id: string;
  name: string;
  orders: number;
  revenue: number;
}

// Define props for the CustomerRankingWidget component
// Adheres to Kintone independence by receiving data via props
interface CustomerRankingWidgetProps {
  widget: Widget; // Contains widget configuration like title
  customerRankingData: CustomerRankingItem[]; // Data passed from a parent/container
  maxItems?: number; // Optional prop to limit the number of displayed items for layout control
}

// --- 常數定義以提高可讀性、維護性並避免魔法數字 ---
const BADGE_SIZE_CLASSES = 'w-6 h-6';
const RANK_BADGE_FONT_CLASSES = 'text-sm font-bold';

// 使用設計系統的 token 顏色 (例如 primary-500)
const TOP_RANK_BADGE_BG = 'bg-primary-500';
const TOP_RANK_BADGE_TEXT = 'text-white';

const OTHER_RANK_BADGE_BG = 'bg-gray-100';
const OTHER_RANK_BADGE_TEXT = 'text-gray-500';

const WIDGET_TITLE_CLASSES = 'text-lg font-semibold text-gray-800'; // Class for the widget title

export default function CustomerRankingWidget({ widget, customerRankingData, maxItems }: CustomerRankingWidgetProps) {
  // Apply maxItems limit if provided to handle extreme data length cases
  const displayData = maxItems ? customerRankingData.slice(0, maxItems) : customerRankingData;

  // Render the widget within a standard card structure as per Dashtail UI norms
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Widget Header with Title and Drag Handle structure */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        {/* Widget Title - uses widget.title or a default */}
        <h3 className={WIDGET_TITLE_CLASSES}>{widget.title || '客戶排名'}</h3>
        {/* Drag Handle - required for draggable widgets */}
        <div className="drag-handle w-6 h-6 cursor-grab text-gray-400 hover:text-gray-600 flex items-center justify-center">
          {/* Example SVG for a drag handle icon - replace with actual icon if available in design system */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
      </div>

      {/* Widget Content Area */}
      <div className="p-4">
        {displayData.length === 0 ? (
          // Handle empty data state
          <div className="flex items-center justify-center text-gray-500 text-sm h-full p-4">
            目前沒有客戶排名資料。
          </div>
        ) : (
          <div className="space-y-2">
            {displayData.map((customer, index) => (
              <div
                key={customer.id} // Ensure each item has a unique key
                className="flex items-center justify-between text-sm p-2 rounded-md transition-colors duration-200 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary-300 focus-within:ring-offset-1" // Consistent hover/focus styles
                tabIndex={0} // Make each item focusable via keyboard
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`${BADGE_SIZE_CLASSES} rounded-lg flex items-center justify-center ${RANK_BADGE_FONT_CLASSES} ${
                      index === 0
                        ? `${TOP_RANK_BADGE_BG} ${TOP_RANK_BADGE_TEXT}`
                        : `${OTHER_RANK_BADGE_BG} ${OTHER_RANK_BADGE_TEXT}`
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    {/* Handle potential undefined customer name and extreme length */}
                    <div className="font-medium text-gray-800 truncate max-w-[120px]">{customer.name ?? '未知客戶'}</div>
                    {/* Handle potential undefined orders */}
                    <div className="text-sm text-gray-500">{`${customer.orders ?? 0} orders`}</div>
                  </div>
                </div>
                {/* Handle potential undefined revenue */}
                <div className="font-semibold text-gray-900">{formatCurrency(customer.revenue ?? 0)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}