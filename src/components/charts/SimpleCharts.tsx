import React from 'react';
import { cn } from '@/lib/utils'; // Assuming cn utility is correctly defined and available

// ============================================
// Constants & Utilities
// ============================================

/**
 * 預設圖表顏色系列 (Tailwind class names)
 * Using a common set of Tailwind color classes for default palettes.
 * These should ideally be theme-aware (e.g., using 'primary', 'success' aliases)
 * if defined in the Tailwind config. For this exercise, standard `blue-500` etc. are used.
 */
const DEFAULT_COLOR_PALETTE = [
  'blue-500',
  'green-500',
  'yellow-500',
  'red-500',
  'purple-500',
  'teal-500',
];

/**
 * Utility to derive specific Tailwind color classes from a base color string (e.g., "blue-500").
 * This helps in consistently applying colors for different SVG attributes or HTML elements.
 */
const deriveTailwindColorClasses = (baseColor: string) => {
  if (!baseColor || typeof baseColor !== 'string') {
    // Fallback to a default if baseColor is invalid or not provided
    baseColor = DEFAULT_COLOR_PALETTE[0];
  }
  return {
    bg: `bg-${baseColor}`,
    text: `text-${baseColor}`,
    stroke: `stroke-${baseColor}`,
    fill: `fill-${baseColor}`,
    // For area charts, a lighter shade might be desired.
    // Example: `bg-${color}-100` could be derived if needed, but not directly supported by this simple util.
    // For `fillOpacity`, the raw color needs to be parsed, which is complex for Tailwind class strings.
    // So, for fillOpacity, we will use a fixed opacity value with the primary color fill class.
  };
};

// ============================================
// Shared Chart Component Logic Extraction
// ============================================

// Helper to calculate max value for bar charts
const calculateMaxValue = (data: Array<{ value: number }>): number => {
  return Math.max(...data.map(d => d.value), 1);
};

// Helper for Line Chart calculations
interface LineChartCalculations {
  points: Array<{ x: number; y: number; label: string; value: number }>;
  linePath: string;
  areaPath: string;
  minValue: number;
  maxValue: number;
  valueRange: number;
}

const calculateLineChartPaths = (
  data: LineChartData[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number }
): LineChartCalculations => {
  if (data.length === 0) {
    return {
      points: [],
      linePath: '',
      areaPath: '',
      minValue: 0,
      maxValue: 0,
      valueRange: 1,
    };
  }

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const valueRange = maxValue - minValue || 1;

  const points = data.map((item, index) => ({
    x: padding.left + (index / (data.length - 1 || 1)) * chartWidth,
    y: padding.top + chartHeight - ((item.value - minValue) / valueRange) * chartHeight,
    ...item,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padding.top + chartHeight}` +
    ` L ${points[0].x} ${padding.top + chartHeight} Z`;

  return { points, linePath, areaPath, minValue, maxValue, valueRange };
};

// Helper for Pie Chart calculations
interface PieChartSegment extends PieChartData {
  pathData: string;
  percentage: number;
}

const calculatePieChartSegments = (
  data: PieChartData[],
  size: number
): { segments: PieChartSegment[]; total: number; centerX: number; centerY: number; radius: number } => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -90; // Start from top

  const segments: PieChartSegment[] = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return {
      ...item,
      pathData,
      percentage: Math.round((item.value / total) * 100),
      // Ensure color is a Tailwind fill class string, or fall back to default
      color: item.color || deriveTailwindColorClasses(DEFAULT_COLOR_PALETTE[index % DEFAULT_COLOR_PALETTE.length]).fill,
    };
  });

  return { segments, total, centerX, centerY, radius };
};

// Helper for Donut Chart calculations
interface DonutChartCalculations {
  radius: number;
  circumference: number;
  percentage: number;
  strokeDashoffset: number;
}

const calculateDonutChartMetrics = (
  value: number,
  maxValue: number,
  size: number,
  strokeWidth: number
): DonutChartCalculations => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / maxValue, 1);
  const strokeDashoffset = circumference * (1 - percentage);

  return { radius, circumference, percentage, strokeDashoffset };
};

// Helper for Sparkline calculations
const calculateSparklinePoints = (
  data: number[],
  width: number,
  height: number
): string => {
  if (data.length < 2) return '';

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const valueRange = maxValue - minValue || 1;

  return data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / valueRange) * height;
      return `${x},${y}`;
    })
    .join(' ');
};

// ============================================
// Types - Renamed for Kintone Config Style
// ============================================

export interface BarChartData {
  label: string;
  value: number;
  color?: string; // Expected to be a Tailwind bg-class string, e.g., 'bg-blue-500'
}

export interface PieChartData {
  label: string;
  value: number;
  color?: string; // Expected to be a Tailwind fill-class string, e.g., 'fill-blue-500'
}

export interface LineChartData {
  label: string;
  value: number;
}

// ============================================
// Chart Config Interfaces
// ============================================

export interface BarChartConfig {
  data: BarChartData[];
  height?: number;
  showValues?: boolean;
  className?: string;
}

export interface HorizontalBarChartConfig {
  data: BarChartData[];
  showPercentage?: boolean;
  className?: string;
}

export interface PieChartConfig {
  data: PieChartData[];
  size?: number;
  showLegend?: boolean;
  className?: string;
}

export interface LineChartConfig {
  data: LineChartData[];
  height?: number;
  colorClass?: string; // Expected to be a base Tailwind color string, e.g., 'blue-500'
  showDots?: boolean;
  showArea?: boolean;
  className?: string;
}

export interface DonutChartConfig {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string; // Expected to be a base Tailwind color string, e.g., 'blue-500'
  label?: string;
  className?: string;
}

export interface SparklineConfig {
  data: number[];
  width?: number;
  height?: number;
  colorClass?: string; // Expected to be a base Tailwind color string, e.g., 'blue-500'
  className?: string;
}

// ============================================
// Chart Card Wrapper (Internal)
// ============================================
// This component acts as the standard card wrapper for all charts/widgets.
interface ChartCardProps {
  children: React.ReactNode;
  className?: string;
  height?: number; // Optional height for consistent card sizing if needed
}

const ChartCard: React.FC<ChartCardProps> = ({ children, className, height }) => {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm p-4',
        height ? `h-[${height}px]` : '', // Apply height if provided, using bracket notation for arbitrary values
        className
      )}
    >
      {/* The drag-handle structure as specified */}
      <div className="drag-handle absolute inset-0 top-0 left-0 h-8 w-full cursor-grab" />
      <div className="relative z-10 flex flex-col h-full pt-4">{children}</div> {/* Offset content below drag handle */}
    </div>
  );
};

// ============================================
// Bar Chart Component
// ============================================

export function BarChart({
  data,
  height = 200,
  showValues = true,
  className,
}: BarChartConfig) {
  const maxValue = calculateMaxValue(data);

  return (
    <ChartCard className={cn('w-full', className)} height={height}>
      <div className="flex items-end gap-2 h-full">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          const defaultColor = deriveTailwindColorClasses(
            DEFAULT_COLOR_PALETTE[index % DEFAULT_COLOR_PALETTE.length]
          ).bg;
          const barColorClass = item.color || defaultColor;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full">
              <div
                className="w-full flex flex-col items-center justify-end flex-grow"
                style={{ maxHeight: `calc(100% - 30px)` }} // Adjust max height to leave space for label
              >
                {showValues && (
                  <span className="text-sm font-medium text-gray-700 mb-1">
                    {item.value}
                  </span>
                )}
                <div
                  className={cn(
                    'w-full max-w-12 rounded-t-lg transition-all duration-500 ease-out',
                    barColorClass
                  )}
                  style={{
                    height: `${barHeight}%`,
                    minHeight: item.value > 0 ? 4 : 0, // Keep dynamic minHeight
                  }}
                />
              </div>
              <span className="text-sm text-gray-500 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// ============================================
// Horizontal Bar Chart Component
// ============================================

export function HorizontalBarChart({
  data,
  showPercentage = true,
  className,
}: HorizontalBarChartConfig) {
  const maxValue = calculateMaxValue(data);

  return (
    <ChartCard className={cn('w-full space-y-3', className)}>
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const defaultColor = deriveTailwindColorClasses(
          DEFAULT_COLOR_PALETTE[index % DEFAULT_COLOR_PALETTE.length]
        ).bg;
        const barColorClass = item.color || defaultColor;

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">{item.label}</span>
              <span className="text-gray-500">
                {showPercentage ? `${Math.round(percentage)}%` : item.value}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  barColorClass
                )}
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </ChartCard>
  );
}

// ============================================
// Pie Chart Component (SVG)
// ============================================

export function PieChart({
  data,
  size = 160,
  showLegend = true,
  className,
}: PieChartConfig) {
  const { segments, total, centerX, centerY, radius } = calculatePieChartSegments(data, size);

  return (
    <ChartCard className={cn('flex items-center gap-6', className)}>
      <svg width={size} height={size} className="shrink-0">
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.pathData}
            className={cn(
              'transition-all duration-300 hover:opacity-80',
              segment.color // Assumes segment.color is a Tailwind fill class like 'fill-blue-500'
            )}
          />
        ))}
        {/* Center circle (donut effect) */}
        <circle cx={centerX} cy={centerY} r={radius * 0.5} fill="white" />
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-lg font-bold fill-gray-900" // Using fill-gray for SVG text
        >
          {total}
        </text>
      </svg>

      {showLegend && (
        <div className="space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-3 h-3 rounded-full shrink-0',
                  segment.color?.replace('fill-', 'bg-') // Convert fill class to bg class for HTML div
                )}
              />
              <span className="text-sm text-gray-600">
                {segment.label} ({segment.percentage}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

// ============================================
// Line Chart Component (SVG)
// ============================================

export function LineChart({
  data,
  height = 200,
  colorClass = DEFAULT_COLOR_PALETTE[0], // Default to 'blue-500'
  showDots = true,
  showArea = true,
  className,
}: LineChartConfig) {
  if (data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 400; // Fixed SVG viewBox width for consistent scaling

  const { points, linePath, areaPath, minValue, maxValue, valueRange } = calculateLineChartPaths(
    data,
    width,
    height,
    padding
  );

  const { stroke: lineColorClass, fill: areaFillClass } = deriveTailwindColorClasses(colorClass);

  return (
    <ChartCard className={cn('w-full', className)} height={height}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + (height - padding.top - padding.bottom) * ratio}
            x2={width - padding.right}
            y2={padding.top + (height - padding.top - padding.bottom) * ratio}
            stroke="#e5e7eb" // Use standard gray-200 hex or class if available
            strokeDasharray="4 4"
          />
        ))}

        {/* Area fill */}
        {showArea && (
          <path d={areaPath} className={cn(areaFillClass, 'opacity-10')} />
        )}

        {/* Line */}
        <path d={linePath} fill="none" className={cn('stroke-2', lineColorClass)} />

        {/* Data points */}
        {showDots &&
          points.map((point, index) => (
            <g key={index}>
              <circle cx={point.x} cy={point.y} r={4} className={lineColorClass} />
              <circle cx={point.x} cy={point.y} r={6} className={cn(lineColorClass, 'opacity-20')} />
            </g>
          ))}

        {/* X-axis labels */}
        {points.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={height - 8}
            textAnchor="middle"
            className="text-sm fill-gray-500"
          >
            {point.label}
          </text>
        ))}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={padding.top + (height - padding.top - padding.bottom) * (1 - ratio)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-sm fill-gray-500"
          >
            {Math.round(minValue + valueRange * ratio)}
          </text>
        ))}
      </svg>
    </ChartCard>
  );
}

// ============================================
// Donut Chart Component
// ============================================

export function DonutChart({
  value,
  maxValue = 100,
  size = 120,
  strokeWidth = 12,
  colorClass = DEFAULT_COLOR_PALETTE[0], // Default to 'blue-500'
  label,
  className,
}: DonutChartConfig) {
  const { radius, circumference, percentage, strokeDashoffset } = calculateDonutChartMetrics(
    value,
    maxValue,
    size,
    strokeWidth
  );

  const { stroke: progressStrokeClass, text: textColorClass } = deriveTailwindColorClasses(colorClass);

  return (
    <ChartCard className={cn('inline-flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb" // Tailwind gray-200
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={cn('stroke-[var(--chart-color)] transition-all duration-500 ease-out', progressStrokeClass)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className={cn('text-2xl font-bold', textColorClass)}>
            {Math.round(percentage * 100)}%
          </span>
          {label && <span className="text-sm text-gray-500">{label}</span>}
        </div>
      </div>
    </ChartCard>
  );
}

// ============================================
// Sparkline Component
// ============================================

export function Sparkline({
  data,
  width = 100,
  height = 30,
  colorClass = DEFAULT_COLOR_PALETTE[0], // Default to 'blue-500'
  className,
}: SparklineConfig) {
  if (data.length < 2) return null;

  const points = calculateSparklinePoints(data, width, height);
  const { stroke: sparklineStrokeClass } = deriveTailwindColorClasses(colorClass);

  return (
    <ChartCard className={cn('w-fit', className)}>
      <svg
        width={width}
        height={height}
        className={cn('overflow-visible', className)}
      >
        <polyline
          points={points}
          fill="none"
          className={cn('stroke-[1.5] stroke-linecap-round stroke-linejoin-round', sparklineStrokeClass)}
        />
      </svg>
    </ChartCard>
  );
}