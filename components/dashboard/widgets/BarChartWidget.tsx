import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import { BAR_CHART_DATA } from '@/data/dashboardData';

export default function BarChartWidget({ widget }: { widget: Widget }) {
  const max = Math.max(...BAR_CHART_DATA.map((item) => item.value), 1);

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="text-xs text-gray-400">
        Source: {widget.config.chartDataSource || 'orders'}
      </div>
      <div className="flex items-end gap-3 h-28">
        {BAR_CHART_DATA.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full h-20 bg-blue-100 rounded-lg overflow-hidden flex items-end">
              <div
                className="bg-blue-500 rounded-lg transition-all"
                style={{ height: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
