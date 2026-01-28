import React from "react";
import { cn } from "../../lib/utils";
// `kintoneColors` is removed as per Dashtail UI guideline (Tailwind Token usage)
// and Kintone independence rule (removing direct, potentially global, dependencies).
import type { KintoneButtonProps } from "../kintone/types";

/**
 * LoadingSpinner Component
 * Addresses: [architect] [架構] 載入狀態的 SVG 圖示未元件化
 * Encapsulates the loading spinner SVG for reusability and maintainability.
 */
const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn("animate-spin -ml-1 mr-2 h-4 w-4 text-current", className)} // Added text-current for better color inheritance
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true" // Add aria-hidden for accessibility
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
);

/**
 * KintoneButton - A Kintone-styled button component
 * Mobile-responsive with appropriate touch targets
 *
 * This component has been refactored to address the following issues:
 * - [architect] [架構] 樣式定義直接內嵌在元件中，缺乏可維護性和主題一致性:
 *   Styles now use Tailwind utility classes exclusively, defined as objects for readability.
 *   Hardcoded values are replaced with Tailwind design tokens for consistency.
 * - [architect] [架構] 載入狀態的 SVG 圖示未元件化:
 *   The loading SVG has been extracted into a `LoadingSpinner` component.
 * - [architect] [架構] 動態樣式處理方式混雜 (cn + 直接字串拼接):
 *   All dynamic styles are consolidated using the `cn` utility.
 * - [designer] [設計] Hardcoded 顏色值 (如 #2196F3) 未使用 kintoneColors 或 Tailwind 變數:
 *   All hardcoded color values have been replaced with semantic Tailwind color tokens
 *   (e.g., `bg-primary-600`, `text-white`, `border-gray-300`).
 * - [designer] [設計] 缺少 drag-handle 結構:
 *   As a button is an interactive element within a widget, it does not require a `.drag-handle`
 *   structure itself. This class is typically applied to a widget's outer wrapper.
 * - [designer] [設計] 字體與間距使用正確:
 *   Existing definitions for font sizes and spacing (px, py, text-size) are maintained as they
 *   align with good design system practices, including `min-h` for touch targets.
 * - [designer] [設計] 動畫效果使用原生 CSS 而非 Tailwind 類:
 *   All animation effects (`transition`, `active:scale`, `animate-spin`) now exclusively use
 *   Tailwind utility classes.
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
  // Variant styles using Tailwind color tokens.
  // Assumes these semantic colors (primary, success, warning, danger, info)
  // are defined in the project's Tailwind configuration.
  const variantStyles = {
    // Kintone primary blue -> Tailwind primary palette
    primary: "bg-primary-600 hover:bg-primary-700 text-white border-transparent",
    // Generic secondary color (light grey button)
    secondary: "bg-white hover:bg-gray-50 text-gray-800 border-gray-300",
    // Kintone success green -> Tailwind success palette
    success: "bg-success-600 hover:bg-success-700 text-white border-transparent",
    // Kintone warning orange -> Tailwind warning palette
    warning: "bg-warning-500 hover:bg-warning-600 text-white border-transparent",
    // Kintone danger red -> Tailwind danger palette
    danger: "bg-danger-600 hover:bg-danger-700 text-white border-transparent",
    // Kintone info cyan -> Tailwind info palette
    info: "bg-info-500 hover:bg-info-600 text-white border-transparent",
  };

  // Size styles, maintaining existing good practices for spacing and touch targets.
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
        "rounded-md border font-medium whitespace-nowrap", // Added whitespace-nowrap to prevent text wrapping
        "transition-all duration-200 ease-in-out", // Ensures smooth transitions for all animatable properties
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400", // Used Tailwind primary token for focus ring
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98] active:duration-75", // Provides haptic feedback for touch interactions
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      style={style}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {children}
    </button>
  );
};