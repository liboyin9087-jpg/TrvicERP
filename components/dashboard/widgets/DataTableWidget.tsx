import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import { RECENT_ORDERS } from '@/data/dashboardData';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import StatusBadge from '../ui/StatusBadge';

export default function DataTableWidget({ widget }: { widget: Widget }) {
  const limit = widget.config.tableRowLimit || 5;
  const rows = RECENT_ORDERS.slice(0, limit);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th className="px-3 py-2 text-left">Company</th>
            <th className="px-3 py-2 text-left">Trip</th>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-right">Pax</th>
            <th className="px-3 py-2 text-right">Amount</th>
            <th className="px-3 py-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium text-gray-900">{order.company}</td>
              <td className="px-3 py-2 text-gray-600">{order.trip}</td>
              <td className="px-3 py-2 text-gray-500">{order.date}</td>
              <td className="px-3 py-2 text-right text-gray-600">{formatNumber(order.pax)}</td>
              <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(order.amount)}</td>
              <td className="px-3 py-2 text-center">
                <StatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
