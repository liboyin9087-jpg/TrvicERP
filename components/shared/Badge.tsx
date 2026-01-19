/**
 * TrvicERP Badge & Status Components
 *
 * Badge variants for labels and status indicators
 * Status indicators for tour/order workflows
 *
 * @see DESIGN_SYSTEM.md Section 5.2 (Status Colors)
 */

import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 text-primary-900',
  secondary: 'bg-neutral-200 text-neutral-700',
  success: 'bg-success-light text-success-dark',
  error: 'bg-error-light text-error-dark',
  warning: 'bg-warning-light text-warning-dark',
  info: 'bg-info-light text-info-dark',
  neutral: 'bg-neutral-200 text-neutral-700',
};

const sizeStyles = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function Badge({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-md whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full bg-current',
            size === 'sm' && 'w-1 h-1'
          )}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Tour/Order Status Types
 */
export type TourStatus =
  | 'draft'
  | 'quoted'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

/**
 * Tour Status Badge
 */
interface TourStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: TourStatus;
}

const tourStatusConfig: Record<
  TourStatus,
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: '草稿', variant: 'neutral' },
  quoted: { label: '已報價', variant: 'info' },
  confirmed: { label: '已確認', variant: 'success' },
  in_progress: { label: '進行中', variant: 'primary' },
  completed: { label: '已完成', variant: 'secondary' },
  cancelled: { label: '已取消', variant: 'error' },
};

export function TourStatusBadge({
  status,
  className,
  ...props
}: TourStatusBadgeProps) {
  const config = tourStatusConfig[status];

  return (
    <Badge
      variant={config.variant}
      dot
      className={className}
      {...props}
    >
      {config.label}
    </Badge>
  );
}

/**
 * Payment Status Badge
 */
interface PaymentStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: PaymentStatus;
}

const paymentStatusConfig: Record<
  PaymentStatus,
  { label: string; variant: BadgeVariant }
> = {
  pending: { label: '待付款', variant: 'warning' },
  partial: { label: '部分付款', variant: 'info' },
  paid: { label: '已付款', variant: 'success' },
  overdue: { label: '逾期', variant: 'error' },
};

export function PaymentStatusBadge({
  status,
  className,
  ...props
}: PaymentStatusBadgeProps) {
  const config = paymentStatusConfig[status];

  return (
    <Badge
      variant={config.variant}
      dot
      className={className}
      {...props}
    >
      {config.label}
    </Badge>
  );
}

/**
 * Status Indicator (larger, with dot)
 */
export type StatusIndicatorVariant =
  | 'draft'
  | 'quoted'
  | 'confirmed'
  | 'progress'
  | 'completed'
  | 'cancelled';

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusIndicatorVariant;
  label?: string;
}

const statusIndicatorStyles: Record<StatusIndicatorVariant, string> = {
  draft: 'bg-neutral-100 text-neutral-500',
  quoted: 'bg-info-light text-info',
  confirmed: 'bg-success-light text-success',
  progress: 'bg-purple-100 text-purple-600',
  completed: 'bg-neutral-200 text-neutral-600',
  cancelled: 'bg-error-light text-error',
};

const statusIndicatorLabels: Record<StatusIndicatorVariant, string> = {
  draft: '草稿',
  quoted: '已報價',
  confirmed: '已確認',
  progress: '進行中',
  completed: '已完成',
  cancelled: '已取消',
};

export function StatusIndicator({
  status,
  label,
  className,
  ...props
}: StatusIndicatorProps) {
  const displayLabel = label || statusIndicatorLabels[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold',
        statusIndicatorStyles[status],
        className
      )}
      {...props}
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      {displayLabel}
    </span>
  );
}

/**
 * Count Badge (for notifications, etc.)
 */
interface CountBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function CountBadge({ count, max = 99, className }: CountBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[18px] h-[18px] px-1',
        'bg-error text-white text-[10px] font-bold rounded-full',
        className
      )}
    >
      {displayCount}
    </span>
  );
}

/**
 * Trend Indicator (for KPI changes)
 */
interface TrendIndicatorProps {
  value: number;
  label?: string;
  showSign?: boolean;
  className?: string;
}

export function TrendIndicator({
  value,
  label,
  showSign = true,
  className,
}: TrendIndicatorProps) {
  const isPositive = value >= 0;
  const displayValue = Math.abs(value);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm',
        isPositive ? 'text-success' : 'text-error',
        className
      )}
    >
      <span>{isPositive ? '\u2191' : '\u2193'}</span>
      <span className="font-medium tabular-nums">
        {showSign && (isPositive ? '+' : '-')}
        {displayValue}%
      </span>
      {label && <span className="text-neutral-500">{label}</span>}
    </span>
  );
}

export default Badge;
