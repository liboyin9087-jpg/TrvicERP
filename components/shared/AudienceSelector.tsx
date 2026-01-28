import React from 'react';
import { Users, Heart, Baby, Camera, Mountain, Leaf, Compass, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// All possible target audience values from the data
export const AUDIENCE_OPTIONS = [
  { value: '親子', label: '親子', icon: Baby },
  { value: '文青', label: '文青', icon: User },
  { value: '情侶', label: '情侶', icon: Heart },
  { value: '攝影', label: '攝影', icon: Camera },
  { value: '登山', label: '登山', icon: Mountain },
  { value: '生態', label: '生態', icon: Leaf },
  { value: '冒險', label: '冒險', icon: Compass },
  { value: '銀髮', label: '銀髮', icon: Users },
] as const;

interface AudienceSelectorProps {
  value: string[];
  onChange: (audiences: string[]) => void;
  className?: string;
}

export default function AudienceSelector({ value, onChange, className }: AudienceSelectorProps) {
  const toggleAudience = (audience: string) => {
    if (value.includes(audience)) {
      onChange(value.filter(a => a !== audience));
    } else {
      onChange([...value, audience]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">客群篩選</span>
        {value.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            清除全部
          </button>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {AUDIENCE_OPTIONS.map(({ value: audience, label, icon: Icon }) => {
          const isActive = value.includes(audience);
          return (
            <button
              key={audience}
              onClick={() => toggleAudience(audience)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                isActive
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
