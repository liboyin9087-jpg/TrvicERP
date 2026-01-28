/**
 * 簡易圖表組件
 * Simple Chart Components (純 CSS + SVG 實作，無需外部依賴)
 */
import React from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartData {
  label: string;
  value: number;
  color: string;
}

export interface LineChartData {
  label: string;
  value: number;
}

// ============================================
// Bar Chart Component
// ============================================

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  showValues?: boolean;
  className?: string;
}

export function BarChart({
  data,
  height = 200,
  showValues = true,
  className,
}: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const defaultColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          const color = item.color || defaultColors[index % defaultColors.length];

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: height - 30 }}>
                {showValues && (
                  <span className="text-sm font-medium text-gray-600 mb-1">
                    {item.value}
                  </span>
                )}
                <div
                  className="w-full max-w-12 rounded-t-lg transition-all duration-500 ease-out"
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: color,
                    minHeight: item.value > 0 ? 4 : 0,
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
    </div>
  );
}

// ============================================
// Horizontal Bar Chart Component
// ============================================

interface HorizontalBarChartProps {
  data: BarChartData[];
  showPercentage?: boolean;
  className?: string;
}

export function HorizontalBarChart({
  data,
  showPercentage = true,
  className,
}: HorizontalBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const defaultColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className={cn('w-full space-y-3', className)}>
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const color = item.color || defaultColors[index % defaultColors.length];

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">{item.label}</span>
              <span className="text-gray-500">
                {showPercentage ? `${Math.round(percentage)}%` : item.value}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Pie Chart Component (SVG)
// ============================================

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  showLegend?: boolean;
  className?: string;
}

export function PieChart({
  data,
  size = 160,
  showLegend = true,
  className,
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -90; // 從頂部開始

  const segments = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // 計算弧形路徑
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
    };
  });

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <svg width={size} height={size} className="shrink-0">
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.pathData}
            fill={segment.color}
            className="transition-all duration-300 hover:opacity-80"
          />
        ))}
        {/* 中心圓 (甜甜圈效果) */}
        <circle cx={centerX} cy={centerY} r={radius * 0.5} fill="white" />
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-lg font-bold fill-gray-700"
        >
          {total}
        </text>
      </svg>

      {showLegend && (
        <div className="space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-gray-600">
                {segment.label} ({segment.percentage}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Line Chart Component (SVG)
// ============================================

interface LineChartProps {
  data: LineChartData[];
  height?: number;
  color?: string;
  showDots?: boolean;
  showArea?: boolean;
  className?: string;
}

export function LineChart({
  data,
  height = 200,
  color = '#3b82f6',
  showDots = true,
  showArea = true,
  className,
}: LineChartProps) {
  if (data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 400;
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

  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* 網格線 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + chartHeight * ratio}
            x2={width - padding.right}
            y2={padding.top + chartHeight * ratio}
            stroke="#e5e7eb"
            strokeDasharray="4 4"
          />
        ))}

        {/* 面積填充 */}
        {showArea && (
          <path d={areaPath} fill={color} fillOpacity={0.1} />
        )}

        {/* 線條 */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} />

        {/* 數據點 */}
        {showDots &&
          points.map((point, index) => (
            <g key={index}>
              <circle cx={point.x} cy={point.y} r={4} fill={color} />
              <circle cx={point.x} cy={point.y} r={6} fill={color} fillOpacity={0.2} />
            </g>
          ))}

        {/* X 軸標籤 */}
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

        {/* Y 軸標籤 */}
        {[0, 0.5, 1].map((ratio, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={padding.top + chartHeight * (1 - ratio)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-sm fill-gray-500"
          >
            {Math.round(minValue + valueRange * ratio)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ============================================
// Donut Chart Component
// ============================================

interface DonutChartProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  className?: string;
}

export function DonutChart({
  value,
  maxValue = 100,
  size = 120,
  strokeWidth = 12,
  color = '#3b82f6',
  label,
  className,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / maxValue, 1);
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 背景圓環 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* 進度圓環 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-2xl font-bold text-gray-900">
          {Math.round(percentage * 100)}%
        </span>
        {label && <span className="text-sm text-gray-500">{label}</span>}
      </div>
    </div>
  );
}

// ============================================
// Sparkline Component
// ============================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const valueRange = maxValue - minValue || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / valueRange) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
