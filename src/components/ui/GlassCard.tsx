/**
 * GlassCard - VicERP 設計系統核心組件
 *
 * 基於規格書實作的 Vision Pro 風格玻璃擬態卡片
 * 特點：
 * - Adaptive Layering: 深色模式下增加不透明度
 * - 微弱雜訊質感提升實體感
 * - 頂部高光線條模擬玻璃厚度
 * - 支援 hover 互動效果
 * - 完全響應式設計
 */

import React, { ReactNode } from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

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
}

// ============================================
// Variant Mappings
// ============================================
const variants = {
  default: {
    light:
      "bg-white/75 dark:bg-white/[0.03] backdrop-blur-xl border border-white/20 dark:border-white/[0.08]",
    dark: "dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
  },
  elevated: {
    light:
      "bg-white/85 dark:bg-white/[0.05] backdrop-blur-2xl border border-white/30 dark:border-white/[0.12]",
    dark: "shadow-xl dark:shadow-[0_20px_40px_rgba(0,0,0,0.3)]",
  },
  subtle: {
    light:
      "bg-white/60 dark:bg-white/[0.02] backdrop-blur-lg border border-white/10 dark:border-white/[0.05]",
    dark: "dark:shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
  },
} as const;

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-6",
  lg: "p-8",
  xl: "p-12",
} as const;

const hoverEffects = {
  default: { y: -4, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)" },
  elevated: {
    y: -6,
    boxShadow: "0 25px 50px -15px rgba(0,0,0,0.4)",
    scale: 1.01,
  },
  subtle: { y: -2, boxShadow: "0 15px 30px -5px rgba(0,0,0,0.2)" },
} as const;

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
}) => {
  const variantClasses = variants[variant];
  const paddingClass = paddingClasses[padding];
  const hoverEffect = hover ? hoverEffects[variant] : {};

  // 決定是否為可點擊的
  const isClickable = !!onClick;
  const Component = motion.div;

  return (
    <Component
      whileHover={hover ? hoverEffect : undefined}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        ...motionProps.transition,
      }}
      onClick={onClick}
      className={cn(
        // 基礎樣式
        "rounded-2xl transition-all duration-300 relative overflow-hidden",

        // 變體樣式
        variantClasses.light,
        variantClasses.dark,

        // 發光效果
        glow && "ring-1 ring-blue-500/20 dark:ring-blue-400/30",
        glow && "shadow-[0_0_24px_rgba(59,130,246,0.15)]",

        // 可點擊樣式
        isClickable && [
          "cursor-pointer",
          "hover:bg-white/[0.85] dark:hover:bg-white/[0.04]",
          "hover:border-white/40 dark:hover:border-white/[0.15]",
          "active:scale-[0.98]",
        ],

        className,
      )}
      {...motionProps}
    >
      {/* ====== 玻璃效果層 ====== */}

      {/* 1. 頂部高光線條 - 模擬玻璃厚度 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />

      {/* 2. 左側微弱高光 - 增加立體感 */}
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />

      {/* 3. 噪點紋理層 - 提升實體感 */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.015] dark:opacity-[0.025]"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter></defs><rect width="100%" height="100%" filter="url(%23noiseFilter)" opacity="0.4"/></svg>')`,
          backgroundSize: "100px 100px",
        }}
      />

      {/* 4. 微妙的內發光（僅在發光模式） */}
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/[0.03] to-transparent pointer-events-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
      )}

      {/* ====== 內容區域 ====== */}
      <div className={cn("relative z-10", paddingClass)}>{children}</div>

      {/* ====== 邊緣微光效果（僅在 elevated 變體） ====== */}
      {variant === "elevated" && (
        <>
          {/* 左下角光點 */}
          <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/20 rounded-full blur-[1px] focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
          {/* 右上角光點 */}
          <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-white/30 rounded-full blur-[0.5px] focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
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
}

export const GlassCardHeader: React.FC<GlassCardHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-start justify-between pb-4 border-b border-white/10 dark:border-white/[0.05]",
        className,
      )}
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
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
