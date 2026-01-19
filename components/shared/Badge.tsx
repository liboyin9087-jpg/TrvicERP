import { cn } from '@/lib/utils';
import React, { memo } from 'react';

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
  'aria-label'?: string;
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

export const Badge = memo(function Badge({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  'aria-label': ariaLabel,
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
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      role="status"
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full bg-current',
            size === 'sm' && 'w-1 h-1'
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
});

export type TourStatus =
  | 'draft'
  | 'quoted'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

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

export const TourStatusBadge = memo(function TourStatusBadge({
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
      aria-label={`狀態: ${config.label}`}
      {...props}
    >
      {config.label}
    </Badge>
  );
});

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

export const PaymentStatusBadge = memo(function PaymentStatusBadge({
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
      aria-label={`付款狀態: ${config.label}`}
      {...props}
    >
      {config.label}
    </Badge>
  );
});

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

export const StatusIndicator = memo(function StatusIndicator({
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
      aria-label={`狀態: ${displayLabel}`}
      role="status"
      {...props}
    >
      <span className="w-2 h-2 rounded-full bg-current" aria-hidden="true" />
      {displayLabel}
    </span>
  );
});

interface CountBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export const CountBadge = memo(function CountBadge({
  count,
  max = 99,
  className,
}: CountBadgeProps) {
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
      aria-label={`${displayCount} 個通知`}
      role="status"
    >
      {displayCount}
    </span>
  );
});

interface TrendIndicatorProps {
  value: number;
  label?: string;
  showSign?: boolean;
  className?: string;
}

export const TrendIndicator = memo(function TrendIndicator({
  value,
  label,
  showSign = true,
  className,
}: TrendIndicatorProps) {
  const isPositive = value >= 0;
  const displayValue = Math.abs(value);
  const trendLabel = isPositive ? '上升' : '下降';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm',
        isPositive ? 'text-success' : 'text-error',
        className
      )}
      aria-label={`${trendLabel} ${displayValue}%${label ? ` ${label}` : ''}`}
      role="status"
    >
      <span aria-hidden="true">{isPositive ? '\u2191' : '\u2193'}</span>
      <span className="font-medium tabular-nums">
        {showSign && (isPositive ? '+' : '-')}
        {displayValue}%
      </span>
      {label && <span className="text-neutral-500">{label}</span>}
    </span>
  );
});