import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import { CUSTOMER_RANKING } from '@/data/dashboardData';
import { formatCurrency } from '@/lib/formatters';

export default function CustomerRankingWidget(_: { widget: Widget }) {
  return (
    <div className="space-y-4">
      {CUSTOMER_RANKING.map((customer, index) => (
        <div key={customer.id} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {index + 1}
            </span>
            <div>
              <div className="font-medium text-gray-800">{customer.name}</div>
              <div className="text-xs text-gray-500">{customer.orders} orders</div>
            </div>
          </div>
          <div className="font-semibold text-gray-900">{formatCurrency(customer.revenue)}</div>
        </div>
      ))}
    </div>
  );
}
