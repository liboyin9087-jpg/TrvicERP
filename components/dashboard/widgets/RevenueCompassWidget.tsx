import React from 'react';
import { Compass, TrendingUp, DollarSign } from 'lucide-react';
import type { GenericWidget } from '@/core/types/dashboard';

/**
 * Revenue Compass Widget Configuration
 */
export interface RevenueCompassWidgetConfig {
  /** Show breakdown by category */
  showBreakdown?: boolean;
  /** Target revenue amount */
  targetRevenue?: number;
}

/**
 * Revenue breakdown structure
 */
interface RevenueBreakdown {
  domestic: number;
  international: number;
  corporate: number;
  individual: number;
}

interface RevenueCompassWidgetProps {
  widget: GenericWidget<RevenueCompassWidgetConfig>;
  currentRevenue?: number;
  targetRevenue?: number;
  breakdown?: RevenueBreakdown;
}

/**
 * Revenue Compass Widget - Circular Dashboard
 * 營收羅盤 Widget - 圓形儀表板
 */
export default function RevenueCompassWidget({ 
  widget,
  currentRevenue = 0,
  targetRevenue: propTargetRevenue = 0,
  breakdown
}: RevenueCompassWidgetProps) {
  const { showBreakdown = true, targetRevenue: configTargetRevenue = 10000000 } = widget.config;

  // Use prop target revenue if provided, otherwise use config
  const targetRevenue = propTargetRevenue || configTargetRevenue;
  
  // Use sample data if not provided
  const displayRevenue = currentRevenue || 7500000;
  const displayBreakdown = breakdown || {
    domestic: 2500000,
    international: 3000000,
    corporate: 1500000,
    individual: 500000,
  };

  const percentage = Math.min((displayRevenue / targetRevenue) * 100, 100);
  // Ensure needle stays within valid range (-135 to 135 degrees)
  const rotation = Math.max(-135, Math.min(135, (percentage / 100) * 270 - 135));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 90) return 'text-green-500';
    if (pct >= 70) return 'text-blue-500';
    if (pct >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const breakdownItems = [
    { key: 'domestic', label: 'Domestic', value: displayBreakdown.domestic, color: 'bg-blue-500' },
    { key: 'international', label: 'International', value: displayBreakdown.international, color: 'bg-cyan-500' },
    { key: 'corporate', label: 'Corporate', value: displayBreakdown.corporate, color: 'bg-purple-500' },
    { key: 'individual', label: 'Individual', value: displayBreakdown.individual, color: 'bg-orange-500' },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Revenue Compass</h3>
            <p className="text-xs text-slate-600">營收羅盤</p>
          </div>
        </div>
      </div>

      {/* Compass Visualization */}
      <div className="flex-1 flex items-center justify-center mb-6">
        <div className="relative w-64 h-64">
          {/* Compass Circle Background */}
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Background Circle */}
            <circle cx="100" cy="100" r="90" fill="white" stroke="#e2e8f0" strokeWidth="2" />
            
            {/* Degree Marks */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = ((angle - 90) * Math.PI) / 180;
              const x1 = 100 + 85 * Math.cos(rad);
              const y1 = 100 + 85 * Math.sin(rad);
              const x2 = 100 + 75 * Math.cos(rad);
              const y2 = 100 + 75 * Math.sin(rad);
              
              return (
                <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="2" />
              );
            })}

            {/* Progress Arc */}
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="#e0f2fe"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * 534} 534`}
              transform="rotate(-90 100 100)"
            />

            {/* Gradient Definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Compass Needle */}
            <g transform={`rotate(${rotation} 100 100)`}>
              <polygon points="100,30 105,100 100,110 95,100" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <circle cx="100" cy="100" r="8" fill="#dc2626" stroke="white" strokeWidth="2" />
            </g>

            {/* Cardinal Directions */}
            <text x="100" y="25" fontSize="12" fontWeight="bold" fill="#64748b" textAnchor="middle">N</text>
            <text x="175" y="105" fontSize="12" fontWeight="bold" fill="#64748b" textAnchor="middle">E</text>
            <text x="100" y="185" fontSize="12" fontWeight="bold" fill="#64748b" textAnchor="middle">S</text>
            <text x="25" y="105" fontSize="12" fontWeight="bold" fill="#64748b" textAnchor="middle">W</text>
          </svg>

          {/* Center Statistics */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-3xl font-bold ${getPercentageColor(percentage)}`}>
              {percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Target Achievement</p>
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="bg-white/80 rounded-xl p-4 shadow-inner mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Current Revenue</span>
          <span className="text-lg font-bold text-blue-600">{formatCurrency(displayRevenue)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Target Revenue</span>
          <span className="text-lg font-bold text-slate-700">{formatCurrency(targetRevenue)}</span>
        </div>
      </div>

      {/* Revenue Breakdown */}
      {showBreakdown && (
        <div className="bg-white/80 rounded-xl p-4 shadow-inner">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-bold text-slate-700">Revenue Breakdown</h4>
          </div>
          <div className="space-y-2">
            {breakdownItems.map((item) => {
  const itemPercentage = displayRevenue > 0 ? (item.value / displayRevenue) * 100 : 0;
              
              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${itemPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
