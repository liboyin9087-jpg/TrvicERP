/**
 * TrvicERP Design System - Status Badge Component
 * 
 * 用於顯示旅程、訂單、任務等物件的即時狀態
 */

import React from 'react';
import { 
  FileEdit, 
  UserPlus, 
  Plane, 
  Navigation, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import { statusBadge } from '../../tokens/design-tokens';
import { StatusBadgeProps, TripStatus, BadgeSize } from '../../types';
import { cn } from '../../utils';

// 狀態對應圖示
const statusIcons: Record<TripStatus, React.ElementType> = {
  planning: FileEdit,
  open: UserPlus,
  upcoming: Plane,
  inProgress: Navigation,
  completed: CheckCircle,
  cancelled: XCircle,
};

// 尺寸對應的 Tailwind classes
const sizeClasses: Record<BadgeSize, string> = {
  small: 'h-5 px-2 py-1 text-[11px] gap-1 rounded',
  medium: 'h-[26px] px-2.5 py-1.5 text-xs gap-1.5 rounded-md',
  large: 'h-8 px-3 py-2 text-sm gap-2 rounded-lg',
};

// 圖示尺寸
const iconSizes: Record<BadgeSize, number> = {
  small: 12,
  medium: 14,
  large: 16,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
  showIcon = true,
  onDark = false,
  label,
  className,
  disabled = false,
}) => {
  const statusConfig = onDark 
    ? statusBadge.statusOnDark[status] 
    : statusBadge.status[status];
  
  const defaultLabel = statusBadge.status[status].label;
  const displayLabel = label || defaultLabel;
  
  const Icon = statusIcons[status];
  const iconSize = iconSizes[size];

  // 計算樣式
  const baseStyles: React.CSSProperties = {
    backgroundColor: statusConfig.background,
    color: statusConfig.text,
    ...(onDark && { backdropFilter: 'blur(8px)' }),
  };

  return (
    <span
      role="status"
      aria-label={`狀態：${displayLabel}`}
      className={cn(
        // 基礎樣式
        'inline-flex items-center justify-center font-semibold whitespace-nowrap',
        'transition-all duration-150 ease-out',
        // 尺寸
        sizeClasses[size],
        // 禁用狀態
        disabled && 'opacity-50 cursor-not-allowed',
        // Hover 效果 (非禁用時)
        !disabled && 'hover:shadow-sm',
        className
      )}
      style={baseStyles}
    >
      {showIcon && (
        <Icon 
          size={iconSize} 
          style={{ color: onDark ? statusConfig.text : statusBadge.status[status].icon }}
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
};

// ============================================================================
// ICON ONLY VARIANT
// ============================================================================

export interface StatusBadgeIconOnlyProps {
  status: TripStatus;
  size?: BadgeSize;
  onDark?: boolean;
  className?: string;
  tooltip?: string;
}

export const StatusBadgeIconOnly: React.FC<StatusBadgeIconOnlyProps> = ({
  status,
  size = 'medium',
  onDark = false,
  className,
  tooltip,
}) => {
  const statusConfig = onDark 
    ? statusBadge.statusOnDark[status] 
    : statusBadge.status[status];
  
  const Icon = statusIcons[status];
  
  // Icon-only 尺寸
  const iconOnlySizes: Record<BadgeSize, { container: string; icon: number }> = {
    small: { container: 'w-5 h-5', icon: 12 },
    medium: { container: 'w-6 h-6', icon: 14 },
    large: { container: 'w-7 h-7', icon: 16 },
  };

  const { container, icon } = iconOnlySizes[size];
  const defaultLabel = statusBadge.status[status].label;

  return (
    <span
      role="status"
      aria-label={tooltip || `狀態：${defaultLabel}`}
      title={tooltip || defaultLabel}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'transition-all duration-150 ease-out',
        container,
        className
      )}
      style={{
        backgroundColor: statusConfig.background,
        ...(onDark && { backdropFilter: 'blur(8px)' }),
      }}
    >
      <Icon 
        size={icon} 
        style={{ color: onDark ? statusConfig.text : statusBadge.status[status].icon }}
        strokeWidth={2}
        aria-hidden="true"
      />
    </span>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default StatusBadge;

// Re-export types for convenience
export type { StatusBadgeProps, TripStatus, BadgeSize } from '../../types';
