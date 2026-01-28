import React, { useMemo } from 'react';
import type { Widget } from '@/core/types/dashboard';
import { PIE_CHART_DATA } from '@/data/dashboardData'; // This data is assumed to be the source for the chart
import { formatDecimal } from '@/lib/formatters';

// Define the expected structure of a single item in the chart data
interface PieChartDataItem {
  label: string;
  value: number;
  // The 'color' property from PIE_CHART_DATA will be ignored for rendering
  // to enforce the use of token-based colors as per requirements.
  color?: string;
}

// Define a consistent palette using CSS colors derived from Tailwind tokens for the conic gradient.
// These are examples corresponding to primary, success, warning, info, error, indigo, pink, emerald 500.
// These hex values are retained as conic-gradient requires explicit color values, not Tailwind classes directly.
const GRADIENT_COLOR_PALETTE = [
  '#3B82F6', // primary-500
  '#22C55E', // success-500
  '#F59E0B', // warning-500
  '#0EA5E9', // info-500
  '#EF4444', // error-500
  '#6366F1', // indigo-500
  '#EC4899', // pink-500
  '#10B981', // emerald-500
];

// Define a consistent palette using Tailwind CSS classes for the legend items.
const LEGEND_COLOR_CLASSES = [
  'bg-primary-500',
  'bg-success-500',
  'bg-warning-500',
  'bg-info-500',
  'bg-error-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-emerald-500',
];

/**
 * Builds the CSS conic-gradient string based on the provided chart data.
 * @param data The array of pie chart data items.
 * @returns A CSS conic-gradient string.
 */
function buildConicGradient(data: PieChartDataItem[]) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let current = 0;
  const segments = data.map((item, index) => {
    const start = (current / total) * 360;
    const end = ((current + item.value) / total) * 360;
    current += item.value;
    // Use colors from the predefined palette, cycling if there are more data items than colors.
    const color = GRADIENT_COLOR_PALETTE[index % GRADIENT_COLOR_PALETTE.length];
    return `${color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${segments.join(', ')})`;
}

export default function PieChartWidget({ widget }: { widget: Widget }) {
  // Use PIE_CHART_DATA as the default/initial data source.
  // By explicitly assigning it to `chartData`, we prepare for a potential future where
  // `chartData` might come from props or state, making the component more dynamic.
  // For now, it uses the static data.
  const chartData: PieChartDataItem[] = PIE_CHART_DATA; // In a real scenario, this might come from `widget.config.data` or a data fetching hook.

  // The gradient is memoized and will recalculate only if `chartData` reference changes.
  const gradient = useMemo(() => buildConicGradient(chartData), [chartData]);

  // Calculate the total value, ensuring it's at least 1 to avoid division by zero.
  const total = chartData.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="flex flex-col h-full p-4"> {/* Added flex-col and padding for a structured layout */}
      {/* Widget Title - using widget.title prop */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {widget.title || 'Pie Chart'}
      </h3>

      {/* Main chart content area, now taking remaining height */}
      <div className="flex-1 flex items-center gap-6">
        <div className="relative w-28 h-28">
          <div
            className="w-28 h-28 rounded-full"
            style={{ backgroundImage: gradient }}
            aria-label={`Chart source: ${widget.config?.chartDataSource || 'status'}`}
          />
          {/* Inner circle with focus/hover states for accessibility and interactivity */}
          <div
            className="absolute inset-0 m-auto w-14 h-14 bg-white rounded-full shadow-inner flex items-center justify-center
                       text-sm font-semibold text-gray-600
                       focus:ring-2 focus:ring-primary-300 active:bg-primary-50 focus:outline-none cursor-pointer
                       transition-all duration-200 ease-in-out hover:shadow-md hover:bg-gray-50"
            tabIndex={0} // Make the div focusable
            role="button" // Indicate it's an interactive element
            aria-label="View chart details or total percentage"
          >
            <span>100%</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {chartData.map((item, index) => (
            // Each legend item with hover/focus states for interactivity
            <div
              key={item.label}
              className="flex items-center justify-between text-sm text-gray-600 p-1 rounded-md
                         hover:bg-gray-50 focus-within:ring-1 focus-within:ring-primary-200 transition-all duration-150 ease-in-out"
              tabIndex={0} // Make the div focusable
              role="listitem" // Indicate it's an item in a list
              aria-label={`${item.label}: ${formatDecimal((item.value / total) * 100, 0)}%`}
            >
              <div className="flex items-center gap-2">
                {/* Use token-based color classes for the legend indicators */}
                <span className={`w-3 h-3 rounded-full ${LEGEND_COLOR_CLASSES[index % LEGEND_COLOR_CLASSES.length]}`} />
                <span>{item.label}</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatDecimal((item.value / total) * 100, 0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}