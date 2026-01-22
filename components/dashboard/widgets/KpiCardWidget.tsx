import React from 'react';
import { BarChart3, DollarSign, Star, Users } from 'lucide-react';
import type { Widget } from '@/core/types/dashboard';
import { KPI_DATA } from '@/data/dashboardData';
import { formatCurrency, formatDecimal, formatNumber } from '@/lib/formatters';

const KPI_META = {
  revenue: { icon: DollarSign, format: 'currency' },
  orders: { icon: BarChart3, format: 'count' },
  customers: { icon: Users, format: 'count' },
  satisfaction: { icon: Star, format: 'score' },
};

export default function KpiCardWidget({ widget }: { widget: Widget }) {
  const kpiType = widget.config.kpiType || 'revenue';
  const data = KPI_DATA[kpiType];
  const meta = KPI_META[kpiType];
  const Icon = meta?.icon || BarChart3;
  const trend = data?.trend ?? 0;
  const isPositive = trend >= 0;

  const formattedValue = (() => {
    if (!data) return 'N/A';
    switch (meta?.format) {
      case 'currency':
        return formatCurrency(data.value);
      case 'score':
        return formatDecimal(data.value, 1);
      case 'count':
      default:
        return formatNumber(data.value);
    }
  })();

  return (
    <div className="h-full flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">KPI</p>
          <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <Icon size={18} className="text-brand-600" />
        </div>
      </div>
      {widget.config.showTrend !== false && (
        <div className="flex items-center gap-2 text-sm">
          <span className={`font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}
            {formatDecimal(trend, 1)}%
          </span>
          <span className="text-gray-400">vs last period</span>
        </div>
      )}
    </div>
  );
}
