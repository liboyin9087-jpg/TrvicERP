import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import { RECENT_ORDERS } from '@/data/dashboardData';
import { formatCurrency } from '@/lib/formatters';
import StatusBadge from '../ui/StatusBadge';

export default function RecentOrdersWidget({ widget }: { widget: Widget }) {
  const limit = widget.config.tableRowLimit || 5;
  const rows = RECENT_ORDERS.slice(0, limit);

  return (
    <div className="space-y-2">
      {rows.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 text-sm truncate">{order.company}</div>
            <div className="text-sm text-gray-500 truncate">{order.trip}</div>
          </div>
          <div className="text-right ml-3">
            <div className="font-semibold text-gray-900 text-sm">{formatCurrency(order.amount)}</div>
            <StatusBadge status={order.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
