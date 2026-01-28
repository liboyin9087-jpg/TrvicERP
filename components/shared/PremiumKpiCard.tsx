import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumKpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'purple';
  className?: string;
}

/**
 * Vision Pro 風格的高級 KPI 卡片
 *
 * 特點：
 * - 多層次光影堆疊 (Ambient Light → Glass → Rim Light → Noise)
 * - Hover 時的動態光暈與位移
 * - 內部極光效果 (Inner Aurora)
 * - 噪點紋理增加質感
 */
const PremiumKpiCard: React.FC<PremiumKpiCardProps> = ({
  title,
  value,
  subtext = '與上月相比',
  trend,
  icon: Icon,
  variant = 'default',
  className,
}) => {
  const isPositive = trend !== undefined && trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  // 根據變體選擇光暈顏色
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
        "group relative w-full h-48 rounded-[24px] transition-all duration-500",
        "hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(30,64,175,0.3)]",
        className
      )}
    >
      {/* Layer 1: 動態背景光暈 (Ambient Light) - 模擬背後的光 */}
      <div
        className={cn(
          "absolute -inset-[1px] rounded-[24px] blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          "bg-gradient-to-b",
          glowColors[variant]
        )}
      />

      {/* Layer 2: 卡片主體 (The Glass) */}
      <div className="relative h-full w-full rounded-[24px] bg-[#0A0F1C]/80 backdrop-blur-2xl border border-white/[0.08] overflow-hidden focus:ring-2 focus:ring-primary-300 active:bg-primary-800">

        {/* Layer 2.1: 內部頂部的高光反射 (Top Highlight) */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />

        {/* Layer 2.2: 噪點紋理 (Noise Texture) - 質感來源 */}
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay pointer-events-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />

        {/* Layer 2.3: 內部的彩色極光 (Inner Aurora) */}
        <div
          className={cn(
            "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] transition-colors duration-700",
            auroraColors[variant]
          )}
        />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/10 rounded-full blur-[60px] focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />

        {/* Layer 2.4: Hover 時的掃光效果 */}
        <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-12 transition-all duration-700 group-hover:left-[100%] focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />

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
              <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-lg tracking-tight focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
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
