import React from 'react';
import type { Widget as CoreWidget } from '@/core/types/dashboard';

// Define the structure for an individual bar item
interface BarDataItem {
  label: string;
  value: number;
}

// Define the specific configuration for BarChartWidget
interface BarChartWidgetConfig {
  chartDataSource?: string;
  chartData: BarDataItem[];
}

// Extend the core Widget type with the specific config for this widget
interface Widget extends CoreWidget {
  config: BarChartWidgetConfig & CoreWidget['config'];
}

export default function BarChartWidget({ widget }: { widget: Widget }) {
  const { chartData, chartDataSource } = widget.config;

  // Ensure max is at least 1 to prevent division by zero if all values are 0
  const max = Math.max(...chartData.map((item) => item.value), 1);

  return (
    <div className="h-full flex flex-col gap-3 drag-handle">
      <div className="text-sm text-gray-400">
        Source: {chartDataSource || 'orders'}
      </div>
      <div className="flex items-end gap-3 h-28">
        {chartData.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full h-20 bg-primary-100 rounded-lg overflow-hidden flex items-end">
              <div
                className="bg-primary-900 rounded-lg transition-all"
                style={{ height: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}