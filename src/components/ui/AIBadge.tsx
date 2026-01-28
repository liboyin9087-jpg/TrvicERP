import React, { ReactNode, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AIBadgeType,
  AIBadgeSize,
  AIContext,
  AIBadgeComponentConfig,
  defaultAIBadgeComponentConfig,
  // 為了方便擴展或替換預設圖標庫，Lucide-react 的圖標組件現在通過 config 檔案匯出。
  // 消費者可以從 config 檔案導入並在自定義配置中使用，而 AIBadge 本身不直接依賴它們。
  // 例如: import { Sparkles, Clock, MapPin } from "@/config/aiBadgeConfig";
  Clock, // 交通時間 AI 標記中會用到
  TrendingUp, // 毛利分析 AI 標記中會用到
} from "@/config/aiBadgeConfig";
import {
  badgeVariants,
  badgeTransition,
  detailVariants,
  detailTransition,
  processingIconRotateTransition,
  processingPulseVariants,
  processingPulseTransition,
  expandableIndicatorTransition,
  actionButtonVariants,
  actionButtonTransition,
} from "@/config/aiBadgeAnimations";

// ============================================
// Type Definitions
// ============================================

interface AIBadgeProps {
  type: AIBadgeType;
  message: string;
  detail?: string;
  size?: AIBadgeSize;
  icon?: ReactNode; // 允許傳入任何 ReactNode 作為自定義圖標
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
  // Kintone 獨立性原則: 允許外部傳入配置，覆蓋預設配置，實現元件獨立性與主題支援。
  // 若此元件作為 Widget 的一部分，Widget 可以透過此 prop 傳入其專屬配置。
  config?: Partial<AIBadgeComponentConfig>;
}

interface AIContextualBadgeProps extends Omit<AIBadgeProps, "type" | "icon"> {
  context: AIContext;
  value?: string | number;
}

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
  config: customConfig,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 合併自定義配置與預設配置
  const mergedConfig: AIBadgeComponentConfig = React.useMemo(
    () => ({
      typeAppearances: {
        ...defaultAIBadgeComponentConfig.typeAppearances,
        ...customConfig?.typeAppearances,
      },
      sizeClasses: {
        ...defaultAIBadgeComponentConfig.sizeClasses,
        ...customConfig?.sizeClasses,
      },
      contextIconsMap: {
        ...defaultAIBadgeComponentConfig.contextIconsMap,
        ...customConfig?.contextIconsMap,
      },
    }),
    [customConfig],
  );

  const { typeAppearances, sizeClasses: sizeClassMap } = mergedConfig;
  const config = typeAppearances[type];
  const sizeClasses = sizeClassMap[size];

  // Auto-hide 功能的實現檢查與記憶體洩漏修復
  useEffect(() => {
    // 清除任何現有的計時器，以避免重複設置或記憶體洩漏
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }

    if (autoHide && isVisible) {
      autoHideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.(); // 在自動隱藏時觸發 onDismiss
      }, hideDelay);
    }

    // 清理函數：在組件卸載或效果重新執行時清除計時器
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [autoHide, hideDelay, isVisible, onDismiss]); // 依賴項變更時重新執行效果

  // 用於在用戶互動時清除自動隱藏計時器
  const clearAutoHideTimer = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  };

  // 處理點擊事件
  const handleClick = (e: React.MouseEvent) => {
    clearAutoHideTimer(); // 互動時清除計時器，避免自動隱藏
    if (expandable && !onClick) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  };

  // 處理關閉事件
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡到徽章的點擊事件
    clearAutoHideTimer(); // 關閉時清除計時器
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={badgeVariants}
        transition={badgeTransition}
        className={cn(
          "relative inline-flex items-center rounded-full",
          "backdrop-blur-sm border transition-all duration-200",
          config.bgClass,
          config.borderClass,
          config.glowClass, // Hardcoded 顏色值已替換為 Tailwind token
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
          transition={
            type === "processing"
              ? processingIconRotateTransition
              : undefined
          }
          className={cn(config.iconClass, sizeClasses.icon)}
        >
          {icon ? (
            // 如果提供了 icon prop (ReactNode)，則直接渲染它
            typeof icon === "string" ? (
              <span className="w-full h-full flex items-center justify-center">{icon}</span>
            ) : (
              icon
            )
          ) : (
            // 否則，使用從配置中獲取的圖標組件
            <config.icon className="w-full h-full" />
          )}
        </motion.div>

        {/* 訊息文字 */}
        <span className={cn(config.textClass, sizeClasses.text, "font-medium")}>
          {message}
        </span>

        {/* 可擴展指示器 */}
        {expandable && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={expandableIndicatorTransition}
            className={cn(config.iconClass, "w-3 h-3 ml-1")}
          >
            {/* SVG for dropdown arrow */}
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
              "hover:bg-gray-100/10 dark:hover:bg-gray-700/10", // 使用通用的 Tailwind 顏色
              config.iconClass,
            )}
            aria-label="Dismiss AI badge"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* 脈衝動畫（processing 類型） */}
        {type === "processing" && (
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full border-2",
              config.borderClass.replace("/20", "/40"), // 調整透明度以創建脈衝效果
            )}
            variants={processingPulseVariants}
            transition={processingPulseTransition}
          />
        )}
      </motion.div>

      {/* 展開的詳細資訊 */}
      <AnimatePresence>
        {isExpanded && detail && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={detailVariants}
            transition={detailTransition}
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
                initial="initial"
                animate="animate"
                variants={actionButtonVariants}
                transition={actionButtonTransition}
                onClick={(e) => {
                  e.stopPropagation();
                  actionButton.onClick();
                  clearAutoHideTimer(); // 執行動作時清除計時器
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
// 將業務邏輯與基礎展示元件分離，遵循 Single Responsibility 原則
export const AIContextualBadge: React.FC<AIContextualBadgeProps> = ({
  context,
  message,
  value,
  config: customConfig, // 傳遞 config prop
  ...props
}) => {
  // 合併自定義配置與預設配置以獲取圖標映射
  const mergedConfig: AIBadgeComponentConfig = React.useMemo(
    () => ({
      typeAppearances: {
        ...defaultAIBadgeComponentConfig.typeAppearances,
        ...customConfig?.typeAppearances,
      },
      sizeClasses: {
        ...defaultAIBadgeComponentConfig.sizeClasses,
        ...customConfig?.sizeClasses,
      },
      contextIconsMap: {
        ...defaultAIBadgeComponentConfig.contextIconsMap,
        ...customConfig?.contextIconsMap,
      },
    }),
    [customConfig],
  );

  const IconComponent = mergedConfig.contextIconsMap[context];

  // 根據情境自動判斷類型
  const getTypeFromContext = (
    context: AIContext,
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
      message={value !== undefined && value !== null ? `${message} ${value}` : message}
      config={customConfig} // 將 config 傳遞給 AIBadge
      {...props}
    />
  );
};

// ============================================
// Specialized AI Badge Variants
// ============================================
// 這些特化變體進一步封裝了業務邏輯，並使用 AIBadge 進行展示

/**
 * 毛利分析 AI 標記
 */
export const ProfitAIBadge: React.FC<{ profit: number; target?: number; config?: Partial<AIBadgeComponentConfig> }> = ({
  profit,
  target = 0.1,
  config,
}) => {
  const isOptimal = profit >= target;
  // 獲取圖標，如果 config 中有定義則使用，否則使用預設
  const IconComponent = config?.contextIconsMap?.profit || defaultAIBadgeComponentConfig.contextIconsMap.profit;

  return (
    <AIBadge
      type={isOptimal ? "success" : "warning"}
      icon={<IconComponent className="w-full h-full" />} // 確保圖標組件接收 className
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
      config={config} // 將 config 傳遞給 AIBadge
    />
  );
};

/**
 * 交通時間 AI 標記
 */
export const RouteAIBadge: React.FC<{
  duration: number;
  isOptimal: boolean;
  config?: Partial<AIBadgeComponentConfig>;
}> = ({ duration, isOptimal, config }) => {
  // 從配置中獲取時鐘圖標，如果沒有則回退到 Clock
  const IconComponent = config?.contextIconsMap?.route || Clock;

  return (
    <AIBadge
      type={isOptimal ? "success" : "warning"}
      icon={<IconComponent className="w-full h-full" />} // 確保圖標組件接收 className
      message={`${duration} 分鐘`}
      detail={
        isOptimal
          ? "交通時間合理，行程安排流暢"
          : "交通時間較長，建議調整行程順序或交通方式"
      }
      expandable
      config={config} // 將 config 傳遞給 AIBadge
    />
  );
};

/**
 * AI 處理狀態標記
 */
export const AIProcessingBadge: React.FC<{
  taskName: string;
  progress?: number;
  config?: Partial<AIBadgeComponentConfig>;
}> = ({ taskName, progress, config }) => {
  return (
    <AIBadge
      type="processing"
      message={`AI 正在${taskName}...`}
      detail={
        progress !== undefined ? `進度: ${progress}%` : "正在分析資料，請稍候"
      }
      size="md"
      autoHide={false}
      config={config} // 將 config 傳遞給 AIBadge
    />
  );
};

// ============================================
// Exports
// ============================================
export default AIBadge;
export type { AIBadgeProps, AIContextualBadgeProps, AIBadgeType, AIBadgeSize };