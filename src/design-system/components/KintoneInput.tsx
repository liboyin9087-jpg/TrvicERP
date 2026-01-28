import React from "react";
import { cn } from "../../lib/utils";

interface KintoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  size?: "small" | "medium" | "large";
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string; // Additional classes for the input element
  style?: React.CSSProperties; // Additional inline styles for the input element
  // ...props 會包含所有 HTMLInputAttributes，故此處無需額外列出
}

const KINTONE_INPUT_SIZE_STYLES = {
  // 將 min-h-[px] 替換為 Tailwind 的 rem-based 單位，實現單位一致性。
  small: "px-3 py-1.5 text-sm min-h-9", // min-h-9 = 36px
  medium: "px-4 py-2 text-base min-h-11", // min-h-11 = 44px
  large: "px-5 py-3 text-lg min-h-13", // min-h-13 = 52px
};

/**
 * KintoneInput - A Kintone-styled input component
 * Mobile-optimized with appropriate sizing, supporting drag-and-drop as a widget.
 */
export const KintoneInput = React.forwardRef<HTMLInputElement, KintoneInputProps>(
  (
    {
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
    },
    ref, // 接收由 forwardRef 傳入的 ref
  ) => {
    // 根據規範，元件應能作為獨立 Widget 被拖曳與配置。
    // 因此，在外層新增標準 Card 結構，並包含 .drag-handle 類別以支援拖曳功能。
    return (
      <div className="relative w-full p-4 bg-white shadow-md rounded-lg border border-neutral-200">
        {/* drag-handle 區域，通常是一個小圖示或特定區域，允許用戶拖曳整個 Widget */}
        <div className="absolute top-1 right-1 p-1 cursor-grab text-neutral-400 hover:text-neutral-600 drag-handle">
          {/* 替換為實際的拖曳圖示（例如來自 Icon Library 的 SVG） */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>

        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref} // 將 ref 傳遞給底層的 input 元素
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
              : "border-neutral-300 focus:ring-primary-500 focus:border-primary-500",
            "disabled:bg-secondary-100 disabled:cursor-not-allowed", // `secondary-100` 假設是主題色系中的有效值
            "text-neutral-900 placeholder-neutral-400",
            KINTONE_INPUT_SIZE_STYLES[size], // 使用抽離的常數樣式
            className,
          )}
          style={style}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              "mt-1.5 text-sm",
              error ? "text-red-500" : "text-neutral-500",
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

KintoneInput.displayName = "KintoneInput";