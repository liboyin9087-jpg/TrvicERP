import { forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'tertiary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  'aria-label'?: string;
  'aria-busy'?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-primary-900 text-white',
    'hover:bg-primary-700 hover:shadow-sm',
    'active:bg-primary-950',
    'disabled:bg-neutral-200 disabled:text-neutral-400'
  ),
  secondary: cn(
    'bg-white text-primary-900 border-2 border-primary-900',
    'hover:bg-primary-50',
    'active:bg-primary-100',
    'disabled:border-neutral-300 disabled:text-neutral-400'
  ),
  danger: cn(
    'bg-error text-white',
    'hover:bg-red-600 hover:shadow-sm',
    'active:bg-red-700',
    'disabled:bg-neutral-200 disabled:text-neutral-400'
  ),
  tertiary: cn(
    'bg-transparent text-primary-900',
    'hover:bg-primary-50',
    'active:bg-primary-100',
    'disabled:text-neutral-400'
  ),
  ghost: cn(
    'bg-transparent text-primary-900',
    'hover:bg-primary-50',
    'active:bg-primary-100',
    'disabled:text-neutral-400'
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-btn-sm px-4 text-sm min-h-[36px]',
  md: 'h-btn-md px-5 text-sm min-h-[44px]',
  lg: 'h-btn-lg px-8 text-base min-h-[48px]',
};

export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      'aria-label': ariaLabel,
      'aria-busy': ariaBusy,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'rounded-md font-semibold',
          'transition-all duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'whitespace-nowrap',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={ariaBusy || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
));

Button.displayName = 'Button';

export interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export const FAB = memo(forwardRef<HTMLButtonElement, FABProps>(
  ({ className, icon, label, position = 'bottom-right', ...props }, ref) => {
    const positionStyles = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'fixed z-fixed',
          'w-14 h-14 rounded-full',
          'bg-primary-900 text-white',
          'shadow-lg',
          'flex items-center justify-center',
          'transition-all duration-200',
          'hover:bg-primary-700 hover:shadow-xl hover:scale-105',
          'active:bg-primary-950',
          'focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          positionStyles[position],
          className
        )}
        aria-label={label}
        {...props}
      >
        {icon}
      </button>
    );
  }
));

FAB.displayName = 'FAB';

export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical';
  'aria-label'?: string;
}

export const ButtonGroup = memo(({
  children,
  className,
  direction = 'horizontal',
  'aria-label': ariaLabel,
}: ButtonGroupProps) => {
  return (
    <div
      className={cn(
        'flex gap-2',
        direction === 'vertical' && 'flex-col',
        className
      )}
      aria-label={ariaLabel}
      role="group"
    >
      {children}
    </div>
  );
});

ButtonGroup.displayName = 'ButtonGroup';