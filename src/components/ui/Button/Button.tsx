import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-semibold
    px-6 py-3
    min-h-[44px]
    rounded-md
    transition-all duration-200 ease-in-out
    cursor-pointer
    border-none
    focus:outline-none focus:ring-2 focus:ring-primary-900 focus:ring-offset-2
  `;

  const variantClasses = {
    primary: `
      bg-primary-900 text-white
      hover:bg-primary-800
      active:bg-primary-950
      disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed
    `,
    secondary: `
      bg-white text-primary-900 border-2 border-primary-900
      hover:bg-primary-50
      active:bg-primary-100
      disabled:border-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-500
    `,
    danger: `
      bg-error text-white
      hover:bg-red-600
      active:bg-red-700
      disabled:bg-neutral-300 disabled:text-neutral-500
    `,
    tertiary: `
      bg-transparent text-primary-900
      hover:bg-primary-50
      active:bg-primary-100
      disabled:text-neutral-400
    `,
  };

  const sizeClasses = {
    sm: `px-4 py-2 text-sm min-h-[36px]`,
    md: `px-6 py-3 text-base min-h-[44px]`,
    lg: `px-8 py-4 text-lg min-h-[48px]`,
  };

  return (
    <button
      type={type}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? '載入中...' : children}
    </button>
  );
};
