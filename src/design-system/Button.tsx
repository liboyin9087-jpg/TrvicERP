import React from "react";

// The variant types available for the button
type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "pill"
  | "success"
  | "info"
  | "warning"
  | "error";

// --- START: Styling Configuration (Extracted for better architecture) ---

// Base classes applied to all buttons for common styles and transitions
const baseClasses = `
  inline-flex items-center justify-center gap-2 font-medium 
  transition-all duration-200 ease-out rounded-md 
  disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
  focus:outline-none focus:ring-offset-white
  transform hover:scale-[1.02] active:scale-[0.98]
`;

// Variant-specific classes, including hover, focus, active, and unified disabled states
const variantClasses: Record<Variant, string> = {
  // Primary variant uses semantic primary colors
  primary: `
    bg-primary-500 text-white border border-primary-500
    hover:bg-primary-600 hover:border-primary-600
    focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
    active:bg-primary-700 active:border-primary-700
    disabled:bg-secondary-100 disabled:border-secondary-200 disabled:text-secondary-400
  `,

  // Secondary variant uses neutral system
  secondary: `
    bg-white text-secondary-900 border border-secondary-300
    hover:bg-secondary-50 hover:border-secondary-400
    focus:ring-2 focus:ring-secondary-500/50 focus:ring-offset-2
    active:bg-secondary-100 active:border-secondary-500
    disabled:bg-secondary-100 disabled:border-secondary-200 disabled:text-secondary-400
  `,

  // Ghost variant with consistent states and disabled text color
  ghost: `
    bg-transparent text-secondary-700 border border-transparent
    hover:bg-secondary-100 hover:text-secondary-900
    focus:ring-2 focus:ring-secondary-500/50 focus:ring-offset-2
    active:bg-secondary-200
    disabled:text-secondary-400
  `,

  // Pill variant updated to use semantic colors and unified disabled style
  pill: `
    rounded-full bg-primary-500 text-white border border-primary-500
    hover:bg-primary-600 hover:border-primary-600
    focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
    active:bg-primary-700
    disabled:bg-secondary-100 disabled:border-secondary-200 disabled:text-secondary-400
  `,

  // Semantic success variant with unified disabled style
  success: `
    bg-success text-white border border-success
    hover:bg-success-dark hover:border-success-dark
    focus:ring-2 focus:ring-success/50 focus:ring-offset-2
    active:bg-success-dark
    disabled:bg-secondary-100 disabled:border-secondary-200 disabled:text-secondary-400
  `,

  // Semantic info variant with unified disabled style
  info: `
    bg-info text-white border border-info
    hover:bg-info-dark hover:border-info-dark
    focus:ring-2 focus:ring-info/50 focus:ring-offset-2
    active:bg-info-dark
    disabled:bg-secondary-100 disabled:border-secondary-200 disabled:text-secondary-400
  `,

  // Semantic warning variant with unified disabled style
  warning: `
    bg-warning text-white border border-warning
    hover:bg-warning-dark hover:border-warning-dark
    focus:ring-2 focus:ring-warning/50 focus:ring-offset-2
    active:bg-warning-dark
    disabled:bg-secondary-100 disabled:border-secondary-200 disabled:text-secondary-400
  `,

  // Semantic error variant with unified disabled style
  error: `
    bg-error text-white border border-error
    hover:bg-error-dark hover:border-error-dark
    focus:ring-2 focus:ring-error/50 focus:ring-offset-2
    active:bg-error-dark
    disabled:bg-secondary-100 disabled:border-secondary-200 disabled:text-secondary-400
  `,
};

// Size-specific classes
const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

/**
 * Helper function to generate combined Tailwind class names for the Button component.
 * This centralizes styling logic and keeps the component clean.
 */
function getButtonClassNames(
  variant: Variant,
  size: "sm" | "md" | "lg",
  additionalClassName: string = "",
  isDragHandle: boolean = false // Added for Kintone drag-handle support
): string {
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    isDragHandle ? "drag-handle" : "", // Conditionally add drag-handle class
    additionalClassName,
  ];

  // Clean up extra spaces and trim for a neat class string
  return classes.join(" ").replace(/\s+/g, ' ').trim();
}

// --- END: Styling Configuration ---


// --- START: Loading Spinner Component ---
const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-current" // text-current inherits parent text color
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
// --- END: Loading Spinner Component ---


// --- START: Button Component Definition ---

/**
 * ButtonConfig defines the specific configurable properties of the Button component.
 * This adheres to the Kintone independence requirement for configuration.
 */
interface ButtonConfig {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean; // Indicates a loading state
  isDragHandle?: boolean; // If true, applies 'drag-handle' class for widget dragging support
}

/**
 * ButtonProps combines standard HTML button attributes with our custom ButtonConfig.
 * This provides clear and explicit type definitions for all expected props.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonConfig {}

/**
 * A versatile Button component for TrvicERP design system.
 * It supports various visual variants, sizes, a loading state, and optional
 * support for Kintone's .drag-handle class for widget dragging.
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false, // Default to false
  isDragHandle = false, // Default to false
  className = "",
  children, // Destructure children to control rendering during loading
  disabled, // Destructure disabled to allow external control, overridden by loading
  ...props
}: ButtonProps) {
  // Determine if the button should be disabled, prioritizing the loading state
  const isDisabled = disabled || loading;

  // Get combined class names using the helper function, passing isDragHandle
  const combinedClassName = getButtonClassNames(variant, size, className, isDragHandle);

  return (
    <button
      {...props}
      className={combinedClassName}
      disabled={isDisabled} // Apply disabled prop
    >
      {loading ? <Spinner /> : children} {/* Show spinner if loading, otherwise show children */}
    </button>
  );
}