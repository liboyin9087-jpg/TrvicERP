import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil, FileText, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'edit' | 'proposal' | 'line';

interface ViewOption {
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  description: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  {
    id: 'edit',
    label: '業務編輯版',
    icon: Pencil,
    path: '/',
    description: '完整功能編輯',
  },
  {
    id: 'proposal',
    label: '提案預覽',
    icon: FileText,
    path: '/proposal',
    description: '客戶簡報模式',
  },
  {
    id: 'line',
    label: 'LINE 風格',
    icon: MessageCircle,
    path: '/line',
    description: '對話式呈現',
  },
];

interface ViewSwitcherProps {
  className?: string;
}

export default function ViewSwitcher({ className }: ViewSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentMode = (): ViewMode => {
    if (location.pathname.startsWith('/proposal')) return 'proposal';
    if (location.pathname.startsWith('/line')) return 'line';
    return 'edit';
  };

  const currentMode = getCurrentMode();

  const handleSwitch = (option: ViewOption) => {
    navigate(option.path);
  };

  return (
    <div className={cn('flex items-center gap-1 p-1 bg-slate-100 rounded-xl', className)}>
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = currentMode === option.id;

        return (
          <motion.button
            key={option.id}
            onClick={() => handleSwitch(option)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              isActive
                ? 'text-brand-600'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="viewSwitcherActive"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{option.label}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// Compact version for mobile
export function ViewSwitcherCompact({ className }: ViewSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentMode = (): ViewMode => {
    if (location.pathname.startsWith('/proposal')) return 'proposal';
    if (location.pathname.startsWith('/line')) return 'line';
    return 'edit';
  };

  const currentMode = getCurrentMode();
  const currentOption = VIEW_OPTIONS.find(o => o.id === currentMode) || VIEW_OPTIONS[0];

  return (
    <div className={cn('relative', className)}>
      <select
        value={currentMode}
        onChange={(e) => {
          const option = VIEW_OPTIONS.find(o => o.id === e.target.value);
          if (option) navigate(option.path);
        }}
        className="appearance-none bg-slate-100 text-slate-700 text-sm font-medium px-4 py-2 pr-8 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        {VIEW_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <currentOption.icon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
    </div>
  );
}
