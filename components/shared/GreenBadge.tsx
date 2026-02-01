import React from 'react';
import { cn } from '@/lib/utils';
import { Leaf, TreePine, Bike, Droplets, Recycle, Wind } from 'lucide-react';

// ============================================================
// Green Badge Component
// Displays green tourism certifications, eco-scores, and
// sustainability indicators on itineraries and spot cards.
// ============================================================

export type GreenBadgeVariant =
  | 'certified'       // 綠色認證
  | 'eco-score'       // 環保分數
  | 'low-carbon'      // 低碳標章
  | 'organic'         // 有機認證
  | 'community'       // 社區永續
  | 'eco-education'   // 生態教育
  | 'carbon-neutral'; // 碳中和

interface GreenBadgeProps {
  variant: GreenBadgeVariant;
  label?: string;
  score?: number;        // for eco-score variant (0-100)
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BADGE_CONFIG: Record<GreenBadgeVariant, {
  icon: React.ElementType;
  defaultLabel: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  certified: {
    icon: Leaf,
    defaultLabel: '綠色認證',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
  },
  'eco-score': {
    icon: TreePine,
    defaultLabel: '環保分數',
    bgClass: 'bg-green-50',
    textClass: 'text-green-700',
    borderClass: 'border-green-200',
  },
  'low-carbon': {
    icon: Bike,
    defaultLabel: '低碳行程',
    bgClass: 'bg-teal-50',
    textClass: 'text-teal-700',
    borderClass: 'border-teal-200',
  },
  organic: {
    icon: Droplets,
    defaultLabel: '有機認證',
    bgClass: 'bg-lime-50',
    textClass: 'text-lime-700',
    borderClass: 'border-lime-200',
  },
  community: {
    icon: Recycle,
    defaultLabel: '社區永續',
    bgClass: 'bg-cyan-50',
    textClass: 'text-cyan-700',
    borderClass: 'border-cyan-200',
  },
  'eco-education': {
    icon: TreePine,
    defaultLabel: '生態教育',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-200',
  },
  'carbon-neutral': {
    icon: Wind,
    defaultLabel: '碳中和',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200',
  },
};

const SIZE_CONFIG = {
  sm: {
    containerClass: 'px-1.5 py-0.5 text-xs gap-1',
    iconSize: 'w-3 h-3',
  },
  md: {
    containerClass: 'px-2 py-1 text-sm gap-1.5',
    iconSize: 'w-4 h-4',
  },
  lg: {
    containerClass: 'px-3 py-1.5 text-base gap-2',
    iconSize: 'w-5 h-5',
  },
};

export default function GreenBadge({
  variant,
  label,
  score,
  size = 'md',
  className,
}: GreenBadgeProps) {
  const config = BADGE_CONFIG[variant];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
        config.bgClass,
        config.textClass,
        config.borderClass,
        sizeConfig.containerClass,
        className
      )}
    >
      <Icon className={sizeConfig.iconSize} />
      <span>{displayLabel}</span>
      {variant === 'eco-score' && score !== undefined && (
        <span className="font-bold ml-0.5">{score}/100</span>
      )}
    </span>
  );
}

// ============================================================
// Green Score Bar Component
// A horizontal progress bar showing the green score with color coding.
// ============================================================

interface GreenScoreBarProps {
  score: number; // 0-100
  showLabel?: boolean;
  className?: string;
}

export function GreenScoreBar({ score, showLabel = true, className }: GreenScoreBarProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  const getColorClass = (s: number) => {
    if (s >= 80) return 'bg-emerald-500';
    if (s >= 60) return 'bg-green-500';
    if (s >= 40) return 'bg-yellow-500';
    if (s >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColorClass = (s: number) => {
    if (s >= 80) return 'text-emerald-700';
    if (s >= 60) return 'text-green-700';
    if (s >= 40) return 'text-yellow-700';
    if (s >= 20) return 'text-orange-700';
    return 'text-red-700';
  };

  const getGrade = (s: number) => {
    if (s >= 90) return 'A+';
    if (s >= 80) return 'A';
    if (s >= 70) return 'B+';
    if (s >= 60) return 'B';
    if (s >= 50) return 'C';
    return 'D';
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Leaf className="w-4 h-4 text-emerald-500" />
            環保分數
          </span>
          <span className={cn('text-sm font-bold', getTextColorClass(clampedScore))}>
            {clampedScore}/100 ({getGrade(clampedScore)})
          </span>
        </div>
      )}
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getColorClass(clampedScore))}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Carbon Footprint Summary Component
// Compact display of carbon emission for a trip/segment.
// ============================================================

interface CarbonFootprintSummaryProps {
  totalKg: number;
  perPersonKg?: number;
  reductionPercent?: number;
  className?: string;
}

export function CarbonFootprintSummary({
  totalKg,
  perPersonKg,
  reductionPercent,
  className,
}: CarbonFootprintSummaryProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 text-sm', className)}>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">
        <Wind className="w-4 h-4 text-blue-500" />
        <span className="text-gray-600">碳排放</span>
        <span className="font-bold text-gray-800">{totalKg.toFixed(1)} kg CO&#x2082;e</span>
      </div>
      {perPersonKg !== undefined && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">
          <span className="text-gray-600">人均</span>
          <span className="font-semibold text-gray-800">{perPersonKg.toFixed(1)} kg</span>
        </div>
      )}
      {reductionPercent !== undefined && reductionPercent > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
          <Leaf className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-emerald-700">減碳 {reductionPercent}%</span>
        </div>
      )}
    </div>
  );
}
