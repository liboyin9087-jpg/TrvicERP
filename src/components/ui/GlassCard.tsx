/**
 * GlassCard - VicERP 設計系統核心組件
 *
 * 基於規格書實作的 Vision Pro 風格玻璃擬態卡片
 * 特點：
 * - Adaptive Layering: 深色模式下增加不透明度 (現在透過 props 控制，提供組件獨立性)
 * - 微弱雜訊質感提升實體感
 * - 頂部高光線條模擬玻璃厚度
 * - 支援 hover 互動效果
 * - 完全響應式設計，支援明確的尺寸限制 (maxWidth, height)
 * - 支援 Dashtail/TrvicERP 拖動規範 (drag-handle)
 * - 使用 Tailwind Token 統一顏色管理 (primary-500, primary-900)
 * - 動畫效果遵循設計系統的平滑曲線規範
 */

import React, { ReactNode } from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils"; // Assuming cn utility is correctly defined

// ============================================
// Type Definitions
// ============================================
interface GlassCardProps {
  children: ReactNode;
  variant?: "default" | "elevated" | "subtle";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  hover?: boolean;
  glow?: boolean;
  className?: string;
  onClick?: () => void;
  motionProps?: MotionProps;
  /**
   * 控制組件是否啟用深色模式樣式。
   * 如果為 true，則應用 dark: 前綴的樣式，否則應用預設（淺色）樣式。
   * 解決 [architect] 組件直接依賴全域樣式問題。
   */
  darkMode?: boolean;
  /**
   * 為卡片添加一個可拖曳的把手區域。
   * 解決 [designer] 缺少 drag-handle 結構問題。
   */
  hasDragHandle?: boolean;
  /**
   * 設定卡片的寬度限制，例如 "max-w-md", "w-full"。
   * 解決 [architect] 缺少明確的尺寸限制機制問題。
   */
  maxWidth?: string;
  /**
   * 設定卡片的高度，例如 "h-full", "h-auto"。
   * 解決 [architect] 缺少明確的尺寸限制機制問題。
   */
  height?: string;
}

// ============================================
// Variant Mappings
// ============================================
// Updated variants to be functions returning classes based on darkMode prop
const getVariantClasses = (
  variant: "default" | "elevated" | "subtle",
  isDarkMode: boolean
) => {
  const commonClasses = "backdrop-blur-xl border "; // Base common classes
  const variantMap = {
    default: {
      light: "bg-white/75 border-white/20",
      dark: "bg-white/[0.03] border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
    },
    elevated: {
      light: "bg-white/85 border-white/30 backdrop-blur-2xl shadow-xl",
      dark: "bg-white/[0.05] border-white/[0.12] backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)]",
    },
    subtle: {
      light: "bg-white/60 border-white/10 backdrop-blur-lg",
      dark: "bg-white/[0.02] border-white/[0.05] backdrop-blur-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
    },
  };

  const selectedVariant = variantMap[variant];
  return cn(
    commonClasses, // Apply common styles
    isDarkMode ? selectedVariant.dark : selectedVariant.light
  );
};

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-6",
  lg: "p-8",
  xl: "p-12",
} as const;

// Hover effects now primarily focus on transforms, shadows are handled by Tailwind classes
// 解決 [architect] 動畫配置與樣式邏輯耦合過高問題。
const hoverEffects = {
  default: { y: -4, scale: 1.005 },
  elevated: { y: -6, scale: 1.01 },
  subtle: { y: -2, scale: 1.002 },
} as const;

// 標準設計系統的彈簧過渡動畫值，提供一致性。
// 解決 [designer] 動畫效果未檢查設計系統規範問題。
const designSystemTransition = {
  type: "spring",
  stiffness: 250, // 略微降低硬度
  damping: 25,    // 略微降低阻尼
  mass: 1,        // 增加質量以獲得更自然的感覺
  restSpeed: 0.001,
  restDelta: 0.001,
};

// ============================================
// Main Component
// ============================================
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = "default",
  padding = "md",
  hover = true,
  glow = false,
  className,
  onClick,
  motionProps = {},
  darkMode = false, // Default to light mode unless specified by prop
  hasDragHandle = false, // Default to no drag handle
  maxWidth = "w-full", // Default width
  height = "h-auto",   // Default height
}) => {
  const paddingClass = paddingClasses[padding];
  const hoverEffect = hover ? hoverEffects[variant] : undefined;

  // 決定是否為可點擊的
  const isClickable = !!onClick;
  const Component = motion.div;

  // Construct base classes for GlassCard, now integrating dark mode via prop
  const baseClasses = cn(
    // 基礎樣式
    "rounded-2xl transition-all duration-300 relative overflow-hidden",
    maxWidth, // 應用 maxWidth
    height,   // 應用 height

    // 變體樣式，使用新的函數根據 darkMode prop 應用
    getVariantClasses(variant, darkMode),

    // 發光效果 - 使用 Tailwind 的 primary 顏色組件 (primary-500, primary-900)
    // 解決 [designer] 硬編碼顏色值問題。
    glow && (darkMode ? "ring-1 ring-primary-400/30 shadow-primary-500/15" : "ring-1 ring-primary-500/20 shadow-primary-500/15"),
    glow && (darkMode ? "bg-gradient-to-br from-primary-900/[0.03] to-transparent" : "bg-gradient-to-br from-primary-500/[0.03] to-transparent"),


    // 可點擊樣式
    isClickable && [
      "cursor-pointer",
      darkMode ? "hover:bg-white/[0.04] hover:border-white/[0.15]" : "hover:bg-white/[0.85] hover:border-white/40",
      "active:scale-[0.98]",
    ],

    // Hover shadow for non-elevated variants if not already defined in getVariantClasses.
    // Elevated variant already has shadow in its classes.
    // 解決 [architect] 動畫配置與樣式邏輯耦合過高問題。
    hover && variant === "default" && (darkMode ? "hover:shadow-lg" : "hover:shadow-md"),
    hover && variant === "subtle" && (darkMode ? "hover:shadow-md" : "hover:shadow-sm"),

    className,
  );

  return (
    <Component
      whileHover={hoverEffect}
      transition={{
        ...designSystemTransition, // 應用設計系統預設動畫
        ...motionProps.transition,  // 允許從 motionProps 覆蓋
      }}
      onClick={onClick}
      className={baseClasses}
      {...motionProps}
    >
      {/* ====== 可拖曳把手 ====== */}
      {/* 解決 [designer] 缺少 drag-handle 結構問題。 */}
      {hasDragHandle && (
        <div
          className={cn(
            "drag-handle absolute inset-x-0 top-0 h-4 cursor-grab z-20", // 把手區域
            // 視覺上細微，預設隱藏，hover 時顯示
            "opacity-0 hover:opacity-100 transition-opacity duration-200",
            "flex items-center justify-center", // 用於視覺指示器
            // 小抓取條指示器
            "before:content-[''] before:w-8 before:h-0.5 before:rounded-full before:bg-gray-300/50 dark:before:bg-gray-700/50"
          )}
          style={{ transform: 'translateY(-50%)' }} // 讓把手略微伸出卡片頂部
        />
      )}

      {/* ====== 玻璃效果層 ====== */}

      {/* 1. 頂部高光線條 - 模擬玻璃厚度 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      {/* 2. 左側微弱高光 - 增加立體感 */}
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent" />

      {/* 3. 噪點紋理層 - 提升實體感 */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none mix-blend-overlay",
          darkMode ? "opacity-[0.025]" : "opacity-[0.015]"
        )}
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter></defs><rect width="100%" height="100%" filter="url(%23noiseFilter)" opacity="0.4"/></svg>')`,
          backgroundSize: "100px 100px",
        }}
      />

      {/* 4. 微妙的內發光（僅在發光模式） */}
      {glow && (
        <div className={cn(
          "absolute inset-0 rounded-2xl pointer-events-none",
          darkMode ? "bg-gradient-to-br from-primary-900/[0.03] to-transparent" : "bg-gradient-to-br from-primary-500/[0.03] to-transparent"
        )} />
      )}

      {/* ====== 內容區域 ====== */}
      <div className={cn("relative z-10", paddingClass)}>{children}</div>

      {/* ====== 邊緣微光效果（僅在 elevated 變體） ====== */}
      {variant === "elevated" && (
        <>
          {/* 左下角光點 */}
          <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/20 rounded-full blur-[1px]" />
          {/* 右上角光點 */}
          <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-white/30 rounded-full blur-[0.5px]" />
        </>
      )}
    </Component>
  );
};

// ============================================
// Specialized Variants
// ============================================

/**
 * GlassCardHeader - 卡片標題區域
 */
interface GlassCardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  darkMode?: boolean; // 繼承或控制子組件的深色模式樣式
}

export const GlassCardHeader: React.FC<GlassCardHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
  darkMode = false, // Default to light mode
}) => {
  return (
    <div
      className={cn(
        "flex items-start justify-between pb-4 border-b",
        darkMode ? "border-white/[0.05]" : "border-white/10",
        className,
      )}
    >
      <div className="space-y-1">
        <h3 className={cn("text-lg font-semibold", darkMode ? "text-white" : "text-gray-900")}>
          {title}
        </h3>
        {subtitle && (
          <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
};

/**
 * GlassCardContent - 卡片內容區域
 */
interface GlassCardContentProps {
  children: ReactNode;
  className?: string;
}

export const GlassCardContent: React.FC<GlassCardContentProps> = ({
  children,
  className,
}) => {
  return <div className={cn("pt-4", className)}>{children}</div>;
};

/**
 * GlassCardGrid - 網格佈局的玻璃卡片容器
 */
interface GlassCardGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export const GlassCardGrid: React.FC<GlassCardGridProps> = ({
  children,
  cols = 3,
  gap = "md",
  className,
}) => {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  const gapClasses = {
    sm: "gap-3",
    md: "gap-6",
    lg: "gap-8",
  };

  return (
    <div className={cn("grid", colClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  );
};

// ============================================
// Exports
// ============================================
export default GlassCard;
export type {
  GlassCardProps,
  GlassCardHeaderProps,
  GlassCardContentProps,
  GlassCardGridProps,
};