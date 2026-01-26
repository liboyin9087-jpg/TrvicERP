import React from "react";
import { cn } from "../../lib/utils";
import { kintoneColors } from "../kintone/theme";
import type { KintoneButtonProps } from "../kintone/types";

/**
 * KintoneButton - A Kintone-styled button component
 * Mobile-responsive with appropriate touch targets
 */
export const KintoneButton: React.FC<KintoneButtonProps> = ({
  children,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  onClick,
  disabled = false,
  type = "button",
  loading = false,
  className,
  style,
  ...props
}) => {
  const variantStyles = {
    primary: "bg-[#2196F3] hover:bg-[#1E88E5] text-white border-transparent",
    secondary:
      "bg-white hover:bg-secondary-50 text-secondary-900 border-secondary-300",
    success: "bg-[#4CAF50] hover:bg-[#43A047] text-white border-transparent",
    warning: "bg-[#FF9800] hover:bg-[#FB8C00] text-white border-transparent",
    danger: "bg-[#F44336] hover:bg-[#E53935] text-white border-transparent",
    info: "bg-[#00BCD4] hover:bg-[#00ACC1] text-white border-transparent",
  };

  const sizeStyles = {
    small: "px-3 py-1.5 text-sm min-h-[36px]",
    medium: "px-4 py-2 text-base min-h-[44px]", // 44px for mobile touch target
    large: "px-6 py-3 text-lg min-h-[52px]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center",
        "rounded-md border font-medium",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2196F3]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98]", // Touch feedback
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      style={style}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
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
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
