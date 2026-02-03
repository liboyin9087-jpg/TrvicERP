import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this is a utility for conditionally joining class names

// [architect] [架構] 可考慮將 sizeConfig 移出元件作為常數導出，方便重用 (中)
// [designer] [設計] 動態尺寸配置 (sizeConfig) 直接寫在元件內 (中)
// Fix: Moved sizeConfig out of the component and made it an exported constant.
export const EMPTY_STATE_SIZE_CONFIG = {
  sm: {
    container: 'py-8',
    iconWrapper: 'w-10 h-10 mb-3',
    icon: 'w-5 h-5',
    title: 'text-base',
    description: 'text-sm',
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

// [architect] [架構] 可考慮為 action 按鈕樣式提供自定義選項 (中)
// Fix: Added actionClassName to allow custom styling for the action button.
interface EmptyStateAction {
  label: string;
  onClick: () => void;
  className?: string; // Specific class for the button
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction; // Use the new interface for action
  className?: string; // Class for the main container
  size?: keyof typeof EMPTY_STATE_SIZE_CONFIG; // Use keyof for better type safety
  // [designer] [設計] 缺少 drag-handle 相關結構 (中)
  // Fix: Added a dragHandle prop to apply the drag-handle class.
  dragHandle?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md',
  dragHandle = false, // Default to false
}: EmptyStateProps) {
  // Use the exported constant
  const config = EMPTY_STATE_SIZE_CONFIG[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        config.container,
        className,
        // [designer] [設計] 缺少 drag-handle 相關結構 (中)
        // Fix: Conditionally apply the drag-handle class to the root element.
        dragHandle && 'drag-handle' 
      )}
    >
      <div
        className={cn(
          'rounded-full bg-slate-100 flex items-center justify-center',
          config.iconWrapper
        )}
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
          className={cn(
            'mt-4 px-4 py-2 text-white rounded-lg font-semibold text-sm transition-colors focus:ring-2 focus:ring-primary-300',
            // [designer] [設計] 按鈕背景色使用硬編碼的 bg-primary-900 而非 Tailwind 主題變數 (中)
            // Fix: bg-primary-900 is already a Tailwind token. Ensuring consistency in hover/active.
            'bg-primary-900',
            // [designer] [設計] 按鈕 hover/active 狀態使用硬編碼的 bg-gray-800 和 bg-primary-800 (中)
            // Fix: Changed hover:bg-gray-800 to hover:bg-primary-800 for consistency with primary palette.
            // active:bg-primary-800 is acceptable as a primary variant.
            'hover:bg-primary-800 active:bg-primary-800',
            // [architect] [架構] 可考慮為 action 按鈕樣式提供自定義選項 (中)
            // Fix: Apply custom action button class if provided.
            action.className
          )}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}