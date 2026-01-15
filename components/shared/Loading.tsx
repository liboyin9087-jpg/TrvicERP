import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'gray' | 'white' | 'current';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

const colorClasses = {
  brand: 'border-brand-500 border-t-transparent',
  gray: 'border-slate-300 border-t-transparent',
  white: 'border-white border-t-transparent',
  current: 'border-current border-t-transparent',
};

export default function Loading({
  size = 'md',
  color = 'brand',
  className,
  text
}: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      {text && (
        <p className="text-sm text-slate-600">{text}</p>
      )}
    </div>
  );
}

// Inline loading spinner for buttons
export function ButtonLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin',
        className
      )}
    />
  );
}
