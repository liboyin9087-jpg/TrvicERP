import React from 'react';
import { Sun, Flower2, Leaf, Snowflake, CalendarDays } from 'lucide-react';
import { cn } from '../../src/lib/utils';

export type SeasonType = 'all' | 'spring' | 'summer' | 'autumn' | 'winter';

interface SeasonFilterProps {
  value: SeasonType;
  onChange: (season: SeasonType) => void;
  className?: string;
}

const SEASON_CONFIG: Record<SeasonType, { label: string; icon: React.ReactNode; color: string }> = {
  all: {
    label: '全年',
    icon: <CalendarDays className="w-3.5 h-3.5" />,
    color: 'bg-slate-900 text-white',
  },
  spring: {
    label: '春季',
    icon: <Flower2 className="w-3.5 h-3.5" />,
    color: 'bg-pink-500 text-white',
  },
  summer: {
    label: '夏季',
    icon: <Sun className="w-3.5 h-3.5" />,
    color: 'bg-amber-500 text-white',
  },
  autumn: {
    label: '秋季',
    icon: <Leaf className="w-3.5 h-3.5" />,
    color: 'bg-orange-500 text-white',
  },
  winter: {
    label: '冬季',
    icon: <Snowflake className="w-3.5 h-3.5" />,
    color: 'bg-sky-500 text-white',
  },
};

/**
 * Check if a spot's season field matches the selected season filter
 * Handles various season formats: 春季, 夏季, 秋季, 冬季, 全年, 春秋茶季, 4-10月, etc.
 */
export function matchesSeason(spotSeason: string | undefined, filter: SeasonType): boolean {
  // 'all' filter matches everything
  if (filter === 'all') return true;

  // If spot has no season data, show it for all filters
  if (!spotSeason) return true;

  // 全年 (year-round) spots match all seasons
  if (spotSeason === '全年') return true;

  const seasonText = spotSeason.toLowerCase();

  switch (filter) {
    case 'spring':
      return seasonText.includes('春');
    case 'summer':
      // Summer includes: 夏, 4-10月, 5-9月 ranges
      if (seasonText.includes('夏')) return true;
      // Check for month ranges that include summer months (June-August)
      const summerRange = spotSeason.match(/(\d+)-(\d+)月/);
      if (summerRange) {
        const start = parseInt(summerRange[1]);
        const end = parseInt(summerRange[2]);
        // Summer is roughly June (6) to August (8)
        return (start <= 6 && end >= 6) || (start <= 7 && end >= 7) || (start <= 8 && end >= 8);
      }
      return false;
    case 'autumn':
      return seasonText.includes('秋');
    case 'winter':
      return seasonText.includes('冬');
    default:
      return true;
  }
}

export default function SeasonFilter({ value, onChange, className }: SeasonFilterProps) {
  const seasons: SeasonType[] = ['all', 'spring', 'summer', 'autumn', 'winter'];

  return (
    <div className={cn('flex gap-1.5 flex-wrap', className)}>
      {seasons.map((season) => {
        const config = SEASON_CONFIG[season];
        const isActive = value === season;

        return (
          <button
            key={season}
            onClick={() => onChange(season)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
              isActive
                ? config.color
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {config.icon}
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
