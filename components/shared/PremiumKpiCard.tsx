import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this utility concatenates class names

// --- Design System Tokens (Conceptual - these would typically be defined in tailwind.config.js) ---
// For this exercise, we are using standard Tailwind classes that represent common design system tokens
// or making choices that align with best practices when specific custom tokens are not provided.

// Background color for the card's main body
const CARD_BACKGROUND_CLASS = 'bg-gray-950'; // Replaces hardcoded #0A0F1C with a standard Tailwind dark gray.
                                          // Consider `bg-primary-950` if 'primary' is the app's dark background color.

// Border color for the card
const CARD_BORDER_CLASS = 'border-white/[0.08]';

// Corner radius for the card
const CARD_RADIUS_CLASS = 'rounded-3xl'; // Replaces rounded-[24px] as `rounded-3xl` is 24px by default in Tailwind v3+.

// Blur values for ambient effects and aurora
const AMBIENT_BLUR_CLASS = 'blur-lg'; // Replaces blur-md for a potentially stronger, yet standard, ambient blur effect.
const AURORA_PRIMARY_BLUR_CLASS = 'blur-3xl'; // Replaces blur-[80px] with the largest standard Tailwind blur.
const AURORA_SECONDARY_BLUR_CLASS = 'blur-2xl'; // Replaces blur-[60px] with a large standard Tailwind blur.

// Shadow for hover effect
const HOVER_CARD_SHADOW_CLASS = 'shadow-2xl shadow-blue-600/30'; // Replaces custom shadow rgba(30,64,175,0.3) with Tailwind color token.

interface PremiumKpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'purple';
  className?: string;
  isDraggable?: boolean; // New prop to control drag handle visibility, adhering to widget spec
}

/**
 * Vision Pro 風格的高級 KPI 卡片
 *
 * 特點：
 * - 多層次光影堆疊 (Ambient Light → Glass → Rim Light → Noise)
 * - Hover 時的動態光暈與位移
 * - 內部極光效果 (Inner Aurora)
 * - 噪點紋理增加質感
 *
 * 遵循 TrvicERP Kintone 獨立性及 Dashtail UI 規範
 */
const PremiumKpiCard: React.FC<PremiumKpiCardProps> = ({
  title,
  value,
  subtext = '與上月相比',
  trend,
  icon: Icon,
  variant = 'default',
  className,
  isDraggable = true, // Defaulting to true as per TrvicERP's draggable component norm
}) => {
  const isPositive = trend !== undefined && trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  // Colors mapping to Tailwind design system tokens for variants
  const glowColors = {
    default: 'from-blue-500/20 to-purple-500/0',
    success: 'from-emerald-500/20 to-blue-500/0',
    warning: 'from-amber-500/20 to-orange-500/0',
    purple: 'from-purple-500/20 to-pink-500/0',
  };

  const iconColors = {
    default: 'text-blue-400 group-hover:text-blue-300',
    success: 'text-emerald-400 group-hover:text-emerald-300',
    warning: 'text-amber-400 group-hover:text-amber-300',
    purple: 'text-purple-400 group-hover:text-purple-300',
  };

  const auroraColors = {
    default: 'bg-blue-600/20 group-hover:bg-blue-500/30',
    success: 'bg-emerald-600/20 group-hover:bg-emerald-500/30',
    warning: 'bg-amber-600/20 group-hover:bg-amber-500/30',
    purple: 'bg-purple-600/20 group-hover:bg-purple-500/30',
  };

  return (
    <div
      className={cn(
        "group relative w-full h-48 transition-all duration-500",
        CARD_RADIUS_CLASS, // Use design system token for border radius
        `hover:-translate-y-2 ${HOVER_CARD_SHADOW_CLASS}`, // Use design system token for hover shadow
        className
      )}
    >
      {/* Layer 1: 動態背景光暈 (Ambient Light) - 模擬背後的光 */}
      <div
        className={cn(
          "absolute -inset-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          CARD_RADIUS_CLASS, // Use design system token for border radius
          AMBIENT_BLUR_CLASS, // Use design system token for blur
          "bg-gradient-to-b",
          glowColors[variant]
        )}
      />

      {/* Layer 2: 卡片主體 (The Glass) */}
      <div className={cn(
        "relative h-full w-full backdrop-blur-2xl overflow-hidden",
        CARD_RADIUS_CLASS, // Use design system token for border radius
        `${CARD_BACKGROUND_CLASS}/80`, // Use design system token for background color
        CARD_BORDER_CLASS, // Use design system token for border
        // Apply focus-within to the card body if it contains interactive elements or is generally selectable
        "focus-within:ring-2 focus-within:ring-primary-300 active:bg-primary-800"
      )}>
        {/* Drag Handle Structure (TrvicERP 可拖動元件規範) */}
        {isDraggable && (
          <div className="absolute top-2 right-2 p-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 drag-handle">
            <GripVertical size={16} className="text-gray-500 hover:text-gray-300" />
          </div>
        )}

        {/* Layer 2.1: 內部頂部的高光反射 (Top Highlight) */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

        {/* Layer 2.2: 噪點紋理 (Noise Texture) - 質感來源 */}
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay pointer-events-none" />

        {/* Layer 2.3: 內部的彩色極光 (Inner Aurora) */}
        <div
          className={cn(
            "absolute -top-20 -right-20 w-64 h-64 rounded-full transition-colors duration-700",
            AURORA_PRIMARY_BLUR_CLASS, // Use design system token for blur
            auroraColors[variant]
          )}
        />
        {/* Second aurora effect - also using design system blur token */}
        <div
          className={cn(
            "absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/10 rounded-full",
            AURORA_SECONDARY_BLUR_CLASS // Use design system token for blur
          )}
        />

        {/* Layer 2.4: Hover 時的掃光效果 */}
        <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-12 transition-all duration-700 group-hover:left-[100%]" />

        {/* Layer 3: 內容層 (Content) */}
        <div className="relative z-10 p-6 flex flex-col justify-between h-full">
          {/* 頂部：Icon 與趨勢 */}
          <div className="flex justify-between items-start">
            <div
              className={cn(
                "p-3 bg-white/[0.03] border border-white/[0.05] rounded-lg shadow-inner transition-transform duration-300 group-hover:scale-110",
                iconColors[variant]
              )}
            >
              <Icon size={24} strokeWidth={1.5} />
            </div>

            {/* 趨勢膠囊 */}
            {trend !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] text-sm font-medium backdrop-blur-md",
                  isPositive ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                <TrendIcon size={12} />
                <span>{isPositive ? '+' : ''}{trend}%</span>
              </div>
            )}
          </div>

          {/* 底部：數值與標題 */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 tracking-wide uppercase mb-1">
              {title}
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-lg tracking-tight">
                {value}
              </span>
              {subtext && (
                <span className="text-sm text-gray-500 font-light">{subtext}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumKpiCard;