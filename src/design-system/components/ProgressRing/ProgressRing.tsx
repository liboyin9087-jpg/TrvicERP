/**
 * TrvicERP Design System - Progress Ring Component
 * 
 * SVG 環形進度指示器，支援多種尺寸、色彩主題和顯示模式
 */

import React, { useEffect, useState, useRef, useId } from 'react';
import { Check, AlertTriangle, Clock, X } from 'lucide-react';
import { progressRing } from '../../tokens/design-tokens';
import { 
  ProgressRingProps, 
  RingSize, 
  RingThickness, 
  RingColorScheme,
  RingDisplayMode,
  RingAnimation,
  LabelPosition
} from '../../types';
import { cn, formatPercentage, calculateRingParams } from '../../utils';

// 尺寸配置 (數值版本，用於 SVG 計算)
const sizeValues: Record<RingSize, number> = {
  xsmall: 32,
  small: 40,
  medium: 56,
  large: 80,
  xlarge: 120,
};

// Stroke width 配置
const strokeWidthValues: Record<RingSize, Record<RingThickness, number>> = {
  xsmall: { thin: 2, regular: 3, thick: 4.5 },
  small: { thin: 2.5, regular: 4, thick: 6 },
  medium: { thin: 3, regular: 5, thick: 7.5 },
  large: { thin: 4, regular: 6, thick: 9 },
  xlarge: { thin: 5, regular: 8, thick: 12 },
};

// 字型大小配置
const fontSizeConfig: Record<RingSize, { primary: string; secondary: string | null }> = {
  xsmall: { primary: 'text-[11px]', secondary: null },
  small: { primary: 'text-[13px]', secondary: null },
  medium: { primary: 'text-base', secondary: 'text-[10px]' },
  large: { primary: 'text-[22px]', secondary: 'text-xs' },
  xlarge: { primary: 'text-[32px]', secondary: 'text-sm' },
};

// Icon 大小配置
const iconSizeConfig: Record<RingSize, number> = {
  xsmall: 14,
  small: 18,
  medium: 24,
  large: 32,
  xlarge: 48,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 'medium',
  thickness = 'regular',
  colorScheme = 'default',
  displayMode = 'percentage',
  customValue,
  secondaryLabel,
  externalLabel,
  labelPosition = 'none',
  showTrack = true,
  animation = 'onMount',
  onDark = false,
  className,
  interactive = false,
  onClick,
  tooltip,
}) => {
  const uniqueId = useId();
  const [animatedValue, setAnimatedValue] = useState(animation === 'none' ? value : 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);

  // 計算正規化的百分比值
  const normalizedValue = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayValue = animation === 'none' ? normalizedValue : animatedValue;

  // SVG 參數
  const diameter = sizeValues[size];
  const strokeWidth = strokeWidthValues[size][thickness];
  const { center, radius, circumference, dashOffset } = calculateRingParams(
    diameter,
    strokeWidth,
    displayValue
  );

  // 色彩配置
  const colors = onDark 
    ? progressRing.colorSchemeOnDark[colorScheme]
    : progressRing.colorScheme[colorScheme];
  const textColor = onDark 
    ? progressRing.text.onDark 
    : progressRing.text.primary;
  const secondaryTextColor = progressRing.text.secondary;

  // 字型配置
  const fonts = fontSizeConfig[size];

  // 動畫效果
  useEffect(() => {
    if (animation === 'none') {
      setAnimatedValue(normalizedValue);
      return;
    }

    if (animation === 'onMount' && prevValueRef.current === value && !isAnimating) {
      // 首次掛載動畫
      setIsAnimating(true);
      const duration = 1000;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedValue(normalizedValue * eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    } else if (animation === 'onChange' && prevValueRef.current !== value) {
      // 數值變化動畫
      const startValue = animatedValue;
      const duration = 600;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedValue(startValue + (normalizedValue - startValue) * eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }

    prevValueRef.current = value;
  }, [value, normalizedValue, animation, animatedValue, isAnimating]);

  // 渲染中心內容
  const renderCenterContent = () => {
    switch (displayMode) {
      case 'percentage':
        return (
          <span className={cn('font-bold', fonts.primary)} style={{ color: textColor }}>
            {formatPercentage(Math.round(displayValue))}
          </span>
        );
      
      case 'fraction':
        return (
          <span className={cn('font-bold', fonts.primary)}>
            <span style={{ color: colors.progress }}>{Math.round(value)}</span>
            <span style={{ color: secondaryTextColor }}>/{max}</span>
          </span>
        );
      
      case 'icon':
        const IconComponent = normalizedValue >= 100 
          ? Check 
          : normalizedValue >= 80 
            ? AlertTriangle 
            : Clock;
        const iconColor = normalizedValue >= 100 
          ? progressRing.colorScheme.success.progress
          : normalizedValue >= 80 
            ? progressRing.colorScheme.warning.progress
            : colors.progress;
        return (
          <IconComponent 
            size={iconSizeConfig[size]} 
            style={{ color: iconColor }}
            strokeWidth={2}
          />
        );
      
      case 'custom':
        return (
          <span 
            className={cn('font-bold', fonts.primary)} 
            style={{ color: textColor }}
          >
            {customValue}
          </span>
        );
      
      default:
        return null;
    }
  };

  // 計算實際的 dashOffset (用於動畫)
  const actualDashOffset = circumference * (1 - displayValue / 100);

  // 主要 Ring 元件
  const ringElement = (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        interactive && 'cursor-pointer transition-transform duration-200 hover:scale-105',
        className
      )}
      style={{ width: diameter, height: diameter }}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'progressbar'}
      aria-valuenow={Math.round(normalizedValue)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={tooltip || `進度 ${Math.round(normalizedValue)}%`}
      title={tooltip}
      tabIndex={interactive ? 0 : undefined}
    >
      {/* SVG Ring */}
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        className="transform -rotate-90"
      >
        {/* 定義漸層 (可選) */}
        <defs>
          <linearGradient id={`gradient-${uniqueId}`} gradientTransform="rotate(90)">
            <stop offset="0%" stopColor={colors.progress} />
            <stop offset="100%" stopColor={colors.progress} />
          </linearGradient>
        </defs>

        {/* 背景軌道 */}
        {showTrack && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.track}
            strokeWidth={strokeWidth}
          />
        )}

        {/* 進度弧線 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.progress}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={actualDashOffset}
          className={cn(
            animation !== 'none' && 'transition-[stroke-dashoffset] duration-500 ease-out'
          )}
        />
      </svg>

      {/* 中心內容 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {renderCenterContent()}
        {secondaryLabel && fonts.secondary && (
          <span 
            className={cn('font-medium mt-0.5', fonts.secondary)}
            style={{ color: secondaryTextColor }}
          >
            {secondaryLabel}
          </span>
        )}
      </div>
    </div>
  );

  // 如果有外部標籤，包裝一層
  if (externalLabel && labelPosition !== 'none') {
    const labelClasses: Record<LabelPosition, string> = {
      bottom: 'flex-col',
      top: 'flex-col-reverse',
      right: 'flex-row',
      none: '',
    };

    return (
      <div className={cn('inline-flex items-center gap-2', labelClasses[labelPosition])}>
        {ringElement}
        <span 
          className="text-sm font-semibold"
          style={{ color: onDark ? progressRing.text.onDark : '#374151' }}
        >
          {externalLabel}
        </span>
      </div>
    );
  }

  return ringElement;
};

// ============================================================================
// SEMI-CIRCLE VARIANT
// ============================================================================

export interface SemiCircleRingProps extends Omit<ProgressRingProps, 'showTrack'> {
  showMinMax?: boolean;
  minLabel?: string;
  maxLabel?: string;
}

export const SemiCircleRing: React.FC<SemiCircleRingProps> = ({
  value,
  max = 100,
  size = 'large',
  thickness = 'regular',
  colorScheme = 'default',
  displayMode = 'percentage',
  customValue,
  secondaryLabel,
  onDark = false,
  showMinMax = true,
  minLabel = '0%',
  maxLabel = '100%',
  className,
  ...props
}) => {
  const uniqueId = useId();
  const normalizedValue = Math.min(Math.max((value / max) * 100, 0), 100);

  const diameter = sizeValues[size];
  const strokeWidth = strokeWidthValues[size][thickness];
  const center = diameter / 2;
  const radius = (diameter - strokeWidth) / 2;
  
  // 半圓的周長是完整圓的一半
  const semiCircumference = Math.PI * radius;
  const dashOffset = semiCircumference * (1 - normalizedValue / 100);

  const colors = onDark 
    ? progressRing.colorSchemeOnDark[colorScheme]
    : progressRing.colorScheme[colorScheme];
  const textColor = onDark ? progressRing.text.onDark : progressRing.text.primary;
  const fonts = fontSizeConfig[size];

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <div 
        className="relative"
        style={{ width: diameter, height: diameter / 2 + 10 }}
      >
        <svg
          width={diameter}
          height={diameter / 2 + strokeWidth}
          viewBox={`0 0 ${diameter} ${diameter / 2 + strokeWidth}`}
          className="overflow-visible"
        >
          {/* 背景軌道 (半圓) */}
          <path
            d={`M ${strokeWidth / 2} ${diameter / 2} A ${radius} ${radius} 0 0 1 ${diameter - strokeWidth / 2} ${diameter / 2}`}
            fill="none"
            stroke={colors.track}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* 進度弧線 (半圓) */}
          <path
            d={`M ${strokeWidth / 2} ${diameter / 2} A ${radius} ${radius} 0 0 1 ${diameter - strokeWidth / 2} ${diameter / 2}`}
            fill="none"
            stroke={colors.progress}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={semiCircumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        </svg>

        {/* 中心數值 */}
        <div 
          className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-1"
          style={{ top: '30%' }}
        >
          <span className={cn('font-bold', fonts.primary)} style={{ color: textColor }}>
            {displayMode === 'custom' ? customValue : formatPercentage(Math.round(normalizedValue))}
          </span>
          {secondaryLabel && fonts.secondary && (
            <span 
              className={cn('font-medium', fonts.secondary)}
              style={{ color: progressRing.text.secondary }}
            >
              {secondaryLabel}
            </span>
          )}
        </div>
      </div>

      {/* 最小/最大標籤 */}
      {showMinMax && (
        <div 
          className="flex justify-between w-full text-xs text-neutral-500 -mt-1"
          style={{ width: diameter }}
        >
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ProgressRing;
export type { ProgressRingProps, SemiCircleRingProps } from '../../types';
