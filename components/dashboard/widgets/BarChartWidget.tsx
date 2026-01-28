import React from 'react';
import type { Widget as CoreWidget } from '@/core/types/dashboard';
import { BAR_CHART_DATA } from '@/data/dashboardData';

// Define the specific configuration for BarChartWidget
interface BarChartWidgetConfig {
  chartDataSource?: string;
  // Add other widget-specific configurations here if needed
}

// Extend the core Widget type with the specific config for this widget
interface Widget extends CoreWidget {
  config: BarChartWidgetConfig & CoreWidget['config']; // Merge with existing CoreWidget config
}

export default function BarChartWidget({ widget }: { widget: Widget }) {
  // Ensure max is at least 1 to prevent division by zero if all values are 0
  const max = Math.max(...BAR_CHART_DATA.map((item) => item.value), 1);

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="text-sm text-gray-400">
        Source: {widget.config.chartDataSource || 'orders'}
      </div>
      <div className="flex items-end gap-3 h-28">
        {BAR_CHART_DATA.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 flex-1">
            {/* Removed focus:ring and active:bg as these divs are not interactive buttons */}
            <div className="w-full h-20 bg-primary-100 rounded-lg overflow-hidden flex items-end">
              <div
                className="bg-primary-500 rounded-lg transition-all"
                style={{ height: `${(item.value / max) * 100}%` }}
              />
            </div>
            {/* Changed font size from text-[10px] to text-sm */}
            <span className="text-sm text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}