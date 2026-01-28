/**
 * AIBadge - VicERP AI 互動標記組件
 *
 * 根據規格書設計的 AI 狀態展示組件
 * 特點：
 * - 非侵入式設計，解決 AI "喧賓奪主" 問題
 * - 視覺化 AI 建議和狀態
 * - 支援不同類型的 AI 互動（insight, warning, processing, success）
 * - 優雅的動畫效果
 * - 可點擊展開詳細資訊
 */

import React, { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  TrendingUp,
  Clock,
  DollarSign,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Type Definitions
// ============================================
type AIBadgeType =
  | "insight"
  | "warning"
  | "processing"
  | "success"
  | "error"
  | "info";
type AIBadgeSize = "sm" | "md" | "lg";

interface AIBadgeProps {
  type: AIBadgeType;
  message: string;
  detail?: string;
  size?: AIBadgeSize;
  icon?: ReactNode;
  onClick?: () => void;
  onDismiss?: () => void;
  autoHide?: boolean;
  hideDelay?: number;
  className?: string;
  expandable?: boolean;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

interface AIContextualBadgeProps extends Omit<AIBadgeProps, "type"> {
  context: "profit" | "route" | "booking" | "cost" | "customer";
  value?: string | number;
}

// ============================================
// Configuration Objects
// ============================================
const typeConfig = {
  insight: {
    icon: Sparkles,
    color: "blue",
    bgClass: "bg-blue-500/10 dark:bg-blue-400/10",
    borderClass: "border-blue-500/20 dark:border-blue-400/20",
    textClass: "text-blue-600 dark:text-blue-400",
    iconClass: "text-blue-500 dark:text-blue-400",
    glowClass: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
  },
  warning: {
    icon: AlertTriangle,
    color: "amber",
    bgClass: "bg-amber-500/10 dark:bg-amber-400/10",
    borderClass: "border-amber-500/20 dark:border-amber-400/20",
    textClass: "text-amber-600 dark:text-amber-400",
    iconClass: "text-amber-500 dark:text-amber-400",
    glowClass: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
  processing: {
    icon: Loader2,
    color: "purple",
    bgClass: "bg-purple-500/10 dark:bg-purple-400/10",
    borderClass: "border-purple-500/20 dark:border-purple-400/20",
    textClass: "text-purple-600 dark:text-purple-400",
    iconClass: "text-purple-500 dark:text-purple-400",
    glowClass: "shadow-[0_0_20px_rgba(147,51,234,0.15)]",
  },
  success: {
    icon: CheckCircle,
    color: "green",
    bgClass: "bg-green-500/10 dark:bg-green-400/10",
    borderClass: "border-green-500/20 dark:border-green-400/20",
    textClass: "text-green-600 dark:text-green-400",
    iconClass: "text-green-500 dark:text-green-400",
    glowClass: "shadow-[0_0_20px_rgba(34,197,94,0.15)]",
  },
  error: {
    icon: AlertTriangle,
    color: "red",
    bgClass: "bg-red-500/10 dark:bg-red-400/10",
    borderClass: "border-red-500/20 dark:border-red-400/20",
    textClass: "text-red-600 dark:text-red-400",
    iconClass: "text-red-500 dark:text-red-400",
    glowClass: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
  },
  info: {
    icon: Info,
    color: "slate",
    bgClass: "bg-slate-500/10 dark:bg-slate-400/10",
    borderClass: "border-slate-500/20 dark:border-slate-400/20",
    textClass: "text-slate-600 dark:text-slate-400",
    iconClass: "text-slate-500 dark:text-slate-400",
    glowClass: "shadow-[0_0_20px_rgba(100,116,139,0.15)]",
  },
} as const;

const sizeConfig = {
  sm: {
    container: "px-2 py-1 text-sm gap-1.5",
    icon: "w-3 h-3",
    text: "text-sm",
  },
  md: {
    container: "px-3 py-2 text-sm gap-2",
    icon: "w-4 h-4",
    text: "text-sm",
  },
  lg: {
    container: "px-4 py-3 text-base gap-3",
    icon: "w-5 h-5",
    text: "text-base",
  },
} as const;

// 情境化圖示映射
const contextIcons = {
  profit: TrendingUp,
  route: MapPin,
  booking: Users,
  cost: DollarSign,
  customer: Users,
} as const;

// ============================================
// Main AIBadge Component
// ============================================
export const AIBadge: React.FC<AIBadgeProps> = ({
  type,
  message,
  detail,
  size = "md",
  icon,
  onClick,
  onDismiss,
  autoHide = false,
  hideDelay = 5000,
  className,
  expandable = !!detail,
  actionButton,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const config = typeConfig[type];
  const sizeClasses = sizeConfig[size];
  const IconComponent = icon ? () => icon : config.icon;

  // 自動隱藏邏輯
  React.useEffect(() => {
    if (autoHide && hideDelay > 0) {
      const timer = setTimeout(() => setIsVisible(false), hideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay]);

  // 處理點擊事件
  const handleClick = () => {
    if (expandable && !onClick) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  };

  // 處理關閉事件
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "relative inline-flex items-center rounded-full",
          "backdrop-blur-sm border transition-all duration-200",
          config.bgClass,
          config.borderClass,
          config.glowClass,
          sizeClasses.container,
          (onClick || expandable) && "cursor-pointer hover:scale-105",
          className,
        )}
        onClick={handleClick}
      >
        {/* AI 圖示 */}
        <motion.div
          animate={{
            rotate: type === "processing" ? 360 : 0,
          }}
          transition={{
            duration: type === "processing" ? 2 : 0,
            repeat: type === "processing" ? Infinity : 0,
            ease: "linear",
          }}
          className={cn(config.iconClass, sizeClasses.icon)}
        >
          <IconComponent className="w-full h-full" />
        </motion.div>

        {/* 訊息文字 */}
        <span className={cn(config.textClass, sizeClasses.text, "font-medium")}>
          {message}
        </span>

        {/* 可擴展指示器 */}
        {expandable && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className={cn(config.iconClass, "w-3 h-3 ml-1")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-full h-full"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </motion.div>
        )}

        {/* 關閉按鈕 */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className={cn(
              "ml-2 rounded-full p-0.5 transition-colors",
              "hover:bg-primary-900/10 dark:hover:bg-white/10",
              config.iconClass,
            )}
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* 脈衝動畫（processing 類型） */}
        {type === "processing" && (
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full border-2",
              config.borderClass.replace("/20", "/40"),
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>

      {/* 展開的詳細資訊 */}
      <AnimatePresence>
        {isExpanded && detail && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "rounded-lg border backdrop-blur-sm p-3 overflow-hidden",
              config.bgClass,
              config.borderClass,
              "text-sm",
            )}
          >
            <p className={cn(config.textClass, "leading-relaxed")}>{detail}</p>

            {/* 行動按鈕 */}
            {actionButton && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  actionButton.onClick();
                }}
                className={cn(
                  "mt-3 px-3 py-1.5 rounded-md text-sm font-medium",
                  "bg-white/10 hover:bg-white/20 transition-colors",
                  config.textClass,
                )}
              >
                {actionButton.label}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

// ============================================
// Contextual Badge (業務情境特化版本)
// ============================================
export const AIContextualBadge: React.FC<AIContextualBadgeProps> = ({
  context,
  message,
  value,
  ...props
}) => {
  const IconComponent = contextIcons[context];

  // 根據情境自動判斷類型
  const getTypeFromContext = (
    context: string,
    value?: string | number,
  ): AIBadgeType => {
    if (context === "profit" && typeof value === "number") {
      return value > 0.1 ? "success" : "warning"; // 10% 以上毛利為成功
    }
    if (context === "cost" && typeof value === "number") {
      return value > 1000 ? "warning" : "info"; // 成本超過 1000 為警告
    }
    return "insight";
  };

  return (
    <AIBadge
      type={getTypeFromContext(context, value)}
      icon={<IconComponent />}
      message={value ? `${message} ${value}` : message}
      {...props}
    />
  );
};

// ============================================
// Specialized AI Badge Variants
// ============================================

/**
 * 毛利分析 AI 標記
 */
export const ProfitAIBadge: React.FC<{ profit: number; target?: number }> = ({
  profit,
  target = 0.1,
}) => {
  const isOptimal = profit >= target;
  return (
    <AIBadge
      type={isOptimal ? "success" : "warning"}
      icon={<TrendingUp />}
      message={`毛利 ${(profit * 100).toFixed(1)}%`}
      detail={
        isOptimal
          ? `毛利率達標，高於目標 ${target * 100}%`
          : `建議優化成本結構，目標毛利 ${target * 100}%`
      }
      actionButton={
        !isOptimal
          ? {
              label: "檢視優化建議",
              onClick: () => console.log("Open profit optimization"),
            }
          : undefined
      }
    />
  );
};

/**
 * 交通時間 AI 標記
 */
export const RouteAIBadge: React.FC<{
  duration: number;
  isOptimal: boolean;
}> = ({ duration, isOptimal }) => {
  return (
    <AIBadge
      type={isOptimal ? "success" : "warning"}
      icon={<Clock />}
      message={`${duration} 分鐘`}
      detail={
        isOptimal
          ? "交通時間合理，行程安排流暢"
          : "交通時間較長，建議調整行程順序或交通方式"
      }
      expandable
    />
  );
};

/**
 * AI 處理狀態標記
 */
export const AIProcessingBadge: React.FC<{
  taskName: string;
  progress?: number;
}> = ({ taskName, progress }) => {
  return (
    <AIBadge
      type="processing"
      message={`AI 正在${taskName}...`}
      detail={
        progress !== undefined ? `進度: ${progress}%` : "正在分析資料，請稍候"
      }
      size="md"
      autoHide={false}
    />
  );
};

// ============================================
// Exports
// ============================================
export default AIBadge;
export type { AIBadgeProps, AIContextualBadgeProps, AIBadgeType, AIBadgeSize };
