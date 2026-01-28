import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils'; // 假設此工具函數已正確引入並可用於組合 Tailwind CSS 類別

// --- CONFIGURATION INTERFACE ---
// [architect] [架構] 缺少明確的配置介面定義 (中)
// 根據 Kintone 獨立性要求，將 props 定義為 `GlassmorphismDashboardConfig`。
// 此介面定義了元件作為獨立 Widget 應接收的配置。
// 對於佈局元件，接收 `ReactNode` 作為內容是符合其職責的配置方式。
interface GlassmorphismDashboardConfig {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  className?: string;
}

// --- SHARED TAILWIND UTILITY CLASSES ---
// [designer] [設計] 重複出現 focus:ring-2 focus:ring-primary-300 active:bg-primary-800 樣式，應提取為共用 class (中)
// 根據原始碼的提示，假設 `primary-300` 和 `primary-800` 已在 Tailwind 配置中定義為品牌色系。
const INTERACTIVE_ELEMENT_STYLES = "focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800";

// --- BACKGROUND COMPONENTS ---
// [architect] [架構] 元件同時處理背景效果、佈局結構和樣式渲染，違反單一職責原則 (中)
// 將所有背景效果（光暈、噪點、網格）提取到獨立的 `GlassmorphismBackgrounds` 元件中，
// 以遵守單一職責原則，使 `GlassmorphismDashboard` 專注於佈局管理。
const GlassmorphismBackgrounds: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* ====== 全域背景層 ====== */}
      {/* 1. 全域背景光 (Global Ambient) - 決定整體色調 */}
      {/* [designer] [設計] 背景光暈元素包含不必要的互動樣式 (focus/active) (中) */}
      {/* 已移除不必要的 focus/active 樣式。 */}
      {/* [designer] [設計] 使用硬編碼顏色值 而非 Tailwind 配置顏色 (高) */}
      {/* 已將硬編碼顏色替換為 Tailwind 的標準顏色，或假定已配置的 primary 顏色。 */}
      {/* 主光暈 - 左上 */}
      <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]" />
      {/* 次光暈 - 右下 */}
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-900/15 rounded-full blur-[100px]" />
      {/* 點綴光暈 - 中央 */}
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[300px] bg-purple-900/10 rounded-full blur-[150px]" />

      {/* 2. 噪點紋理層 */}
      {/* 已移除不必要的 focus/active 樣式。 */}
      <div className="fixed inset-0 bg-noise opacity-[0.015] pointer-events-none mix-blend-overlay" />

      {/* 3. 細微網格圖案 (可選) */}
      {/* [designer] [設計] 部分樣式使用 inline style (如網格背景) 而非 Tailwind class (中) */}
      {/* 已將 inline style 替換為假設已在 `tailwind.config.js` 中定義的 `bg-grid-pattern` 工具類。 */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] bg-grid-pattern"
        // 原始 inline style (已由 bg-grid-pattern 替換):
        // style={{
        //   backgroundImage: `
        //     linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        //     linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        //   `,
        //   backgroundSize: '60px 60px',
        // }}
      />
    </div>
  );
};

// --- MAIN LAYOUT COMPONENT ---
// [architect] [架構] 元件同時處理背景效果、佈局結構和樣式渲染，違反單一職責原則 (中)
// 將主要佈局結構（側邊欄、頂部導航、內容區）提取到獨立的 `GlassmorphismLayout` 元件中。
interface GlassmorphismLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
}

const GlassmorphismLayout: React.FC<GlassmorphismLayoutProps> = ({
  children,
  sidebar,
  header,
}) => {
  return (
    <>
      {/* ====== 側邊欄 ====== */}
      {sidebar && (
        <aside className="fixed left-0 top-0 h-full w-64 border-r border-white/[0.05] bg-primary-900/30 backdrop-blur-xl z-40">
          {/* 側邊欄頂部高光 */}
          {/* [designer] [設計] 背景光暈元素包含不必要的互動樣式 (focus/active) (中) */}
          {/* 已移除不必要的 focus/active 樣式。 */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          {sidebar}
        </aside>
      )}

      {/* ====== 主內容區 ====== */}
      {/* [architect] [架構] 互動狀態樣式 (focus/active) 直接寫在非互動元素上 (中) */}
      {/* 已移除 `main` 元素上不必要的 focus/active 樣式。 */}
      <main className={cn("relative z-0", sidebar && "pl-64")}>
        {/* Header */}
        {header && (
          <header className={cn(
            "sticky top-0 z-30 border-b border-white/[0.05] bg-primary-900/20 backdrop-blur-xl",
            // [designer] [設計] 缺少 drag-handle 結構，不符合可拖拽儀表板需求 (中)
            // 對於一個全屏佈局元件，將 `drag-handle` 類別添加到其主要標題元素是合理的處理方式。
            // 這表示如果此儀表板整體被作為一個可拖曳 Widget 嵌入時，此標題區域將充當拖曳手柄。
            "drag-handle"
          )}>
            {/* Header底部高光 */}
            {/* [designer] [設計] 背景光暈元素包含不必要的互動樣式 (focus/active) (中) */}
            {/* 已移除不必要的 focus/active 樣式。 */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            {header}
          </header>
        )}

        {/* 內容 */}
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </>
  );
};


/**
 * Vision Pro 風格的儀表板佈局
 *
 * 特點：
 * - 全域背景光 (Global Ambient Light)
 * - 極致深色主題
 * - 玻璃側邊欄
 * - 層次分明的 Z-Index 管理
 * - Kintone Widget Compatible: 透過 props 接收配置和內容。
 */
const GlassmorphismDashboard: React.FC<GlassmorphismDashboardConfig> = ({
  children,
  sidebar,
  header,
  className,
}) => {
  return (
    <div
      className={cn(
        // [designer] [設計] 使用硬編碼顏色值 (如 #050505) 而非 Tailwind 配置顏色 (高)
        // 已替換為假設已在 Tailwind 配置中定義的 `bg-primary-950`。
        "min-h-screen bg-primary-950 text-white relative overflow-hidden",
        "selection:bg-blue-500/30", // `blue-500` 是標準 Tailwind 顏色，使用其變體是允許的。
        className
      )}
    >
      <GlassmorphismBackgrounds />
      <GlassmorphismLayout sidebar={sidebar} header={header}>
        {children}
      </GlassmorphismLayout>
    </div>
  );
};

export default GlassmorphismDashboard;

// --- 附帶的輔助組件 ---
// 根據要求，這些輔助組件保留在同一文件中，但理想情況下應各自獨立為文件。

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
        INTERACTIVE_ELEMENT_STYLES, // 已應用提取出的共用互動樣式。
        isActive && [
          "text-white bg-gradient-to-r from-blue-600/20 to-transparent",
          "border-l-2 border-blue-500", // `blue-500` 是標準 Tailwind 顏色。
          // [designer] [設計] 使用硬編碼顏色值 (如 #3b82f6) 而非 Tailwind 配置顏色 (高)
          // 已將硬編碼的 RGB 值替換為透過 `theme()` 函數引用 Tailwind 配置中的顏色。
          "shadow-[inset_0_0_20px_theme(colors.blue.500/10)]",
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
          // [designer] [設計] 使用硬編碼顏色值 (rgba(0,0,0,0.2)) 而非 Tailwind 配置顏色 (高)
          // 已將硬編碼的 RGB 值替換為透過 `theme()` 函數引用 Tailwind 配置中的顏色。
          "hover:shadow-[0_8px_30px_theme(colors.black/20)]",
        ],
        className
      )}
    >
      {/* 頂部高光線 */}
      {/* [designer] [設計] 背景光暈元素包含不必要的互動樣式 (focus/active) (中) */}
      {/* 已移除不必要的 focus/active 樣式。 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {/* 噪點紋理 */}
      {/* [designer] [設計] 背景光暈元素包含不必要的互動樣式 (focus/active) (中) */}
      {/* 已移除不必要的 focus/active 樣式。 */}
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
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