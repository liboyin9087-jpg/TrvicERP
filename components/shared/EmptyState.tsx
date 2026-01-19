import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'py-8',
    iconWrapper: 'w-10 h-10 mb-3',
    icon: 'w-5 h-5',
    title: 'text-base',
    description: 'text-xs',
  },
  md: {
    container: 'py-12',
    iconWrapper: 'w-12 h-12 mb-4',
    icon: 'w-6 h-6',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    iconWrapper: 'w-16 h-16 mb-4',
    icon: 'w-8 h-8',
    title: 'text-xl',
    description: 'text-base',
  },
};

const EmptyState = memo(({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) => {
  const config = sizeConfig[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        config.container,
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={cn(
          'rounded-full bg-slate-100 flex items-center justify-center',
          config.iconWrapper
        )}
        aria-hidden="true"
      >
        <Icon className={cn('text-slate-400', config.icon)} />
      </div>
      <h3 className={cn('font-semibold text-slate-700', config.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-slate-400 mt-1 max-w-sm', config.description)}>
          {description}
        </p>
      )}
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-black text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors"
          aria-label={action.label}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;