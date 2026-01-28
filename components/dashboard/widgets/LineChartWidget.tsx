import React, { useMemo } from 'react';
import type { Widget } from '@/core/types/dashboard';

export interface LineChartWidgetConfig {
  data: number[];
  labels: string[];
  title: string;
  chartDataSource?: string;
  chartPeriod?: number;
  chartSvgWidth?: number;
  chartSvgHeight?: number;
}

function buildPath(data: number[], width: number, height: number): string {
  if (data.length === 0) {
    return '';
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

export default function LineChartWidget({ widget }: { widget: Widget<LineChartWidgetConfig> }) {
  const {
    data: rawData,
    labels,
    title,
    chartDataSource,
    chartPeriod,
    chartSvgWidth = 120,
    chartSvgHeight = 60,
  } = widget.config;

  const data = useMemo(() => {
    if (chartPeriod && rawData.length > chartPeriod) {
      return rawData.slice(0, chartPeriod);
    }
    return rawData;
  }, [rawData, chartPeriod]);

  const path = useMemo(() => buildPath(data, chartSvgWidth, chartSvgHeight), [data, chartSvgWidth, chartSvgHeight]);

  return (
    <div className="h-full flex flex-col p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between text-base font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-3 drag-handle">
        <span>{title}</span>
      </div>

      <div className="flex flex-col flex-grow gap-3">
        <div className="text-sm text-gray-400">
          Source: {chartDataSource || 'revenue'}
        </div>

        <svg
          className="w-full h-28 text-primary-900"
          viewBox={`0 0 ${chartSvgWidth} ${chartSvgHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L${chartSvgWidth},${chartSvgHeight} L0,${chartSvgHeight} Z`} fill="url(#line-gradient)" />
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>

        <div className="flex items-center justify-between text-sm text-gray-400 mt-auto">
          {labels.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}