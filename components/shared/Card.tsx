/**
 * TrvicERP Card Component
 *
 * Card variants per design spec:
 * - default: Standard card with border and shadow
 * - elevated: Higher elevation card
 * - stat: KPI/statistics card
 * - interactive: Clickable card
 *
 * @see DESIGN_SYSTEM.md Section 5.2
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'default' | 'elevated' | 'stat' | 'interactive';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: cn(
    'bg-white border border-neutral-300 rounded-lg shadow-sm',
    'transition-all duration-200'
  ),
  elevated: cn(
    'bg-white border border-neutral-200 rounded-lg shadow-md',
    'transition-all duration-200'
  ),
  stat: cn(
    'bg-white border border-neutral-200 rounded-lg shadow-sm',
    'transition-all duration-200'
  ),
  interactive: cn(
    'bg-white border border-neutral-300 rounded-lg shadow-sm',
    'transition-all duration-200 cursor-pointer',
    'hover:border-primary-500 hover:shadow-md'
  ),
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const hoverStyles = {
  default: 'hover:shadow-md hover:border-neutral-400',
  elevated: 'hover:shadow-lg hover:-translate-y-0.5',
  stat: 'hover:shadow-md hover:border-primary-500',
  interactive: 'hover:shadow-md hover:border-primary-500',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          variantStyles[variant],
          paddingStyles[padding],
          hoverable && hoverStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card Header
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({
  className,
  title,
  subtitle,
  action,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 mb-4',
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg font-bold text-neutral-900 truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Card Body
 */
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardBody({ className, children, ...props }: CardBodyProps) {
  return (
    <div className={cn('text-neutral-700', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export function CardFooter({
  className,
  bordered = true,
  children,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cn(
        'mt-4 pt-4 flex items-center gap-2',
        bordered && 'border-t border-neutral-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * KPI/Stat Card
 */
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
}

export function StatCard({
  className,
  title,
  value,
  change,
  icon,
  ...props
}: StatCardProps) {
  const isPositive = change && change.value >= 0;

  return (
    <Card variant="stat" className={className} hoverable {...props}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-primary-900 mt-2 font-mono tabular-nums">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                'text-sm mt-2 flex items-center gap-1',
                isPositive ? 'text-success' : 'text-error'
              )}
            >
              <span>{isPositive ? '\u2191' : '\u2193'}</span>
              <span className="font-medium">
                {Math.abs(change.value)}%
              </span>
              {change.label && (
                <span className="text-neutral-500">{change.label}</span>
              )}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center text-primary-900">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export default Card;
