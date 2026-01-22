import React, { useMemo } from 'react';
import type { Widget } from '@/core/types/dashboard';
import { PIE_CHART_DATA } from '@/data/dashboardData';
import { formatDecimal } from '@/lib/formatters';

function buildConicGradient() {
  const total = PIE_CHART_DATA.reduce((sum, item) => sum + item.value, 0) || 1;
  let current = 0;
  const segments = PIE_CHART_DATA.map((item) => {
    const start = (current / total) * 360;
    const end = ((current + item.value) / total) * 360;
    current += item.value;
    return `${item.color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${segments.join(', ')})`;
}

export default function PieChartWidget({ widget }: { widget: Widget }) {
  const gradient = useMemo(() => buildConicGradient(), []);
  const total = PIE_CHART_DATA.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="h-full flex items-center gap-6">
      <div className="relative w-28 h-28">
        <div
          className="w-28 h-28 rounded-full"
          style={{ backgroundImage: gradient }}
          aria-label={`Chart source: ${widget.config.chartDataSource || 'status'}`}
        />
        <div className="absolute inset-0 m-auto w-14 h-14 bg-white rounded-full shadow-inner flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-600">100%</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {PIE_CHART_DATA.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
            <span className="font-semibold text-gray-900">
              {formatDecimal((item.value / total) * 100, 0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
