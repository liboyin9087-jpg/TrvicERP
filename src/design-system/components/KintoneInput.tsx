import React from "react";
import { cn } from "../../lib/utils";
import type { KintoneInputProps } from "../kintone/types";

/**
 * KintoneInput - A Kintone-styled input component
 * Mobile-optimized with appropriate sizing
 */
export const KintoneInput: React.FC<KintoneInputProps> = ({
  value,
  onChange,
  placeholder,
  type = "text",
  size = "medium",
  error = false,
  helperText,
  label,
  required = false,
  disabled = false,
  className,
  style,
  ...props
}) => {
  const sizeStyles = {
    small: "px-3 py-1.5 text-sm min-h-[36px]",
    medium: "px-4 py-2 text-base min-h-[44px]", // 44px for mobile
    large: "px-5 py-3 text-lg min-h-[52px]",
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full rounded-md border",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-1",
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-[#2196F3] focus:border-[#2196F3]",
          "disabled:bg-secondary-100 disabled:cursor-not-allowed",
          "text-gray-900 placeholder-gray-400",
          sizeStyles[size],
          className,
        )}
        style={style}
        {...props}
      />
      {helperText && (
        <p
          className={cn(
            "mt-1.5 text-sm",
            error ? "text-red-500" : "text-gray-500",
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};
