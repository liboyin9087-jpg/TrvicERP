/**
 * TrvicERP Input Component
 *
 * Form input with 44px minimum height (WCAG touch target)
 * Supports labels, helper text, error states
 *
 * @see DESIGN_SYSTEM.md Section 5.4
 */

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeStyles = {
  sm: 'h-9 text-sm px-3',
  md: 'h-11 text-base px-3',
  lg: 'h-12 text-base px-4',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth = true,
      required,
      disabled,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'block text-xs font-semibold text-neutral-700',
              required && "after:content-['*'] after:ml-1 after:text-error"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            className={cn(
              // Base styles
              'w-full rounded-md border-2 bg-white',
              'font-sans text-neutral-800',
              'transition-all duration-150 ease-in-out',
              'placeholder:text-neutral-400',
              // Focus styles
              'focus:outline-none focus:border-primary-900 focus:ring-2 focus:ring-primary-900/10',
              // Size
              sizeStyles[size],
              // Icons padding
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              // States
              hasError
                ? 'border-error focus:border-error focus:ring-error/10'
                : 'border-neutral-300',
              disabled && 'bg-neutral-100 text-neutral-500 cursor-not-allowed',
              className
            )}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            id={hasError ? `${id}-error` : `${id}-helper`}
            className={cn(
              'text-xs',
              hasError ? 'text-error' : 'text-neutral-500'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea Component
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      fullWidth = true,
      required,
      disabled,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'block text-xs font-semibold text-neutral-700',
              required && "after:content-['*'] after:ml-1 after:text-error"
            )}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-md border-2 bg-white',
            'font-sans text-neutral-800 text-base',
            'transition-all duration-150 ease-in-out',
            'placeholder:text-neutral-400',
            'focus:outline-none focus:border-primary-900 focus:ring-2 focus:ring-primary-900/10',
            'px-3 py-2 min-h-[100px] resize-y',
            hasError
              ? 'border-error focus:border-error focus:ring-error/10'
              : 'border-neutral-300',
            disabled && 'bg-neutral-100 text-neutral-500 cursor-not-allowed',
            className
          )}
          disabled={disabled}
          aria-invalid={hasError}
          {...props}
        />

        {(error || helperText) && (
          <p
            className={cn(
              'text-xs',
              hasError ? 'text-error' : 'text-neutral-500'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Select Component
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      size = 'md',
      options,
      placeholder,
      fullWidth = true,
      required,
      disabled,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'block text-xs font-semibold text-neutral-700',
              required && "after:content-['*'] after:ml-1 after:text-error"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              'w-full rounded-md border-2 bg-white appearance-none',
              'font-sans text-neutral-800',
              'transition-all duration-150 ease-in-out',
              'focus:outline-none focus:border-primary-900 focus:ring-2 focus:ring-primary-900/10',
              'pr-10',
              sizeStyles[size],
              hasError
                ? 'border-error focus:border-error focus:ring-error/10'
                : 'border-neutral-300',
              disabled && 'bg-neutral-100 text-neutral-500 cursor-not-allowed',
              className
            )}
            disabled={disabled}
            aria-invalid={hasError}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown chevron */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {(error || helperText) && (
          <p
            className={cn(
              'text-xs',
              hasError ? 'text-error' : 'text-neutral-500'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

/**
 * Checkbox Component
 */
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={cn(
            'w-5 h-5 rounded border-2 border-primary-900',
            'text-primary-900 focus:ring-2 focus:ring-primary-900/20',
            'cursor-pointer',
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className="text-sm text-neutral-700 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Input;
