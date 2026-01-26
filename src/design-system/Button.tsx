import React from "react";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "pill"
  | "success"
  | "info"
  | "warning"
  | "error";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

const variantClasses: Record<Variant, string> = {
  // Primary uses new semantic primary color system
  primary: `
    bg-primary-500 text-white border border-primary-500
    hover:bg-primary-600 hover:border-primary-600
    focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
    active:bg-primary-700 active:border-primary-700
    disabled:bg-secondary-300 disabled:border-secondary-300 disabled:text-secondary-500
  `,

  // Secondary uses neutral system instead of hard-coded black/white
  secondary: `
    bg-white text-secondary-900 border border-secondary-300
    hover:bg-secondary-50 hover:border-secondary-400
    focus:ring-2 focus:ring-secondary-500/50 focus:ring-offset-2
    active:bg-secondary-100 active:border-secondary-500
    disabled:bg-secondary-100 disabled:border-secondary-200 disabled:text-secondary-400
  `,

  // Ghost variant with consistent states
  ghost: `
    bg-transparent text-secondary-700 border border-transparent
    hover:bg-secondary-100 hover:text-secondary-900
    focus:ring-2 focus:ring-secondary-500/50 focus:ring-offset-2
    active:bg-secondary-200
    disabled:text-secondary-400
  `,

  // Pill variant updated to use semantic colors
  pill: `
    rounded-full bg-primary-500 text-white border border-primary-500
    hover:bg-primary-600 hover:border-primary-600
    focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
    active:bg-primary-700
  `,

  // Semantic variants with consistent interaction states
  success: `
    bg-success text-white border border-success
    hover:bg-success-dark hover:border-success-dark
    focus:ring-2 focus:ring-success/50 focus:ring-offset-2
    active:bg-success-dark
    disabled:bg-secondary-300 disabled:border-secondary-300
  `,

  info: `
    bg-info text-white border border-info
    hover:bg-info-dark hover:border-info-dark
    focus:ring-2 focus:ring-info/50 focus:ring-offset-2
    active:bg-info-dark
    disabled:bg-secondary-300 disabled:border-secondary-300
  `,

  warning: `
    bg-warning text-white border border-warning
    hover:bg-warning-dark hover:border-warning-dark
    focus:ring-2 focus:ring-warning/50 focus:ring-offset-2
    active:bg-warning-dark
    disabled:bg-secondary-300 disabled:border-secondary-300
  `,

  error: `
    bg-error text-white border border-error
    hover:bg-error-dark hover:border-error-dark
    focus:ring-2 focus:ring-error/50 focus:ring-offset-2
    active:bg-error-dark
    disabled:bg-secondary-300 disabled:border-secondary-300
  `,
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: Props) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const base = `
    inline-flex items-center justify-center gap-2 font-medium 
    transition-all duration-200 ease-out rounded-md 
    disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
    focus:outline-none focus:ring-offset-white
    transform hover:scale-[1.02] active:scale-[0.98]
  `;

  return (
    <button
      {...props}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
    />
  );
}
