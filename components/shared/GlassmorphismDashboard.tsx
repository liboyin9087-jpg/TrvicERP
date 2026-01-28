import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassmorphismDashboardProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  className?: string;
}

/**
 * Vision Pro 風格的儀表板佈局
 *
 * 特點：
 * - 全域背景光 (Global Ambient Light)
 * - 極致深色主題
 * - 玻璃側邊欄
 * - 層次分明的 Z-Index 管理
 */
const GlassmorphismDashboard: React.FC<GlassmorphismDashboardProps> = ({
  children,
  sidebar,
  header,
  className,
}) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-[#050505] text-white relative overflow-hidden",
        "selection:bg-blue-500/30",
        className
      )}
    >
      {/* ====== 全域背景層 ====== */}

      {/* 1. 全域背景光 (Global Ambient) - 決定整體色調 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* 主光暈 - 左上 */}
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
        {/* 次光暈 - 右下 */}
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-900/15 rounded-full blur-[100px] focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
        {/* 點綴光暈 - 中央 */}
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[300px] bg-purple-900/10 rounded-full blur-[150px] focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
      </div>

      {/* 2. 噪點紋理層 */}
      <div className="fixed inset-0 bg-noise opacity-[0.015] pointer-events-none mix-blend-overlay focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />

      {/* 3. 細微網格圖案 (可選) */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ====== 側邊欄 ====== */}
      {sidebar && (
        <aside className="fixed left-0 top-0 h-full w-64 border-r border-white/[0.05] bg-primary-900/30 backdrop-blur-xl z-40 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          {/* 側邊欄頂部高光 */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
          {sidebar}
        </aside>
      )}

      {/* ====== 主內容區 ====== */}
      <main className={cn("relative z-0", sidebar && "pl-64")}>
        {/* Header */}
        {header && (
          <header className="sticky top-0 z-30 border-b border-white/[0.05] bg-primary-900/20 backdrop-blur-xl focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
            {header}
          </header>
        )}

        {/* 內容 */}
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default GlassmorphismDashboard;

/* ====== 附帶的輔助組件 ====== */

/**
 * 玻璃側邊欄導航項目
 */
interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
        "text-gray-400 hover:text-white hover:bg-white/[0.03]",
        isActive && [
          "text-white bg-gradient-to-r from-blue-600/20 to-transparent",
          "border-l-2 border-blue-500",
          "shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]",
        ]
      )}
    >
      <span className={cn("transition-colors", isActive && "text-blue-400")}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

/**
 * 玻璃卡片容器
 */
interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hover = true,
}) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-white/[0.02] backdrop-blur-xl",
        "border border-white/[0.06] overflow-hidden",
        hover && [
          "transition-all duration-300",
          "hover:bg-white/[0.04] hover:border-white/[0.1]",
          "hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]",
        ],
        className
      )}
    >
      {/* 頂部高光線 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
      {/* 噪點紋理 */}
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
      {/* 內容 */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * 區塊標題
 */
interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  action,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
