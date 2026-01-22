import React, { useMemo } from 'react';
import type { Widget } from '@/core/types/dashboard';
import { LINE_CHART_DATA } from '@/data/dashboardData';

function buildPath(data: number[], width: number, height: number) {
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

export default function LineChartWidget({ widget }: { widget: Widget }) {
  const data = LINE_CHART_DATA.slice(0, widget.config.chartPeriod || LINE_CHART_DATA.length);
  const path = useMemo(() => buildPath(data, 120, 60), [data]);

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="text-xs text-gray-400">
        Source: {widget.config.chartDataSource || 'revenue'}
      </div>
      <svg className="w-full h-28" viewBox="0 0 120 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L120,60 L0,60 Z`} fill="url(#line-gradient)" />
        <path d={path} fill="none" stroke="#3B82F6" strokeWidth="2" />
      </svg>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Jan</span>
        <span>Apr</span>
        <span>Jul</span>
        <span>Oct</span>
        <span>Dec</span>
      </div>
    </div>
  );
}
