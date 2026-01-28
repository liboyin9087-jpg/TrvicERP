# 🎨 TrvicERP 設計系統指南

**高級 SaaS 介面設計規範與實作建議**

> 本指南由資深 UI/UX 設計師基於現有程式碼分析撰寫，提供專業的設計系統建議。

---

## 📊 目錄

- [現況分析](#現況分析)
- [設計系統診斷](#設計系統診斷)
- [高級 SaaS 設計原則](#高級-saas-設計原則)
- [設計模式](#設計模式)
- [實用性優化](#實用性優化)
- [頂級案例參考](#頂級案例參考)
- [具體改進建議](#具體改進建議)
- [設計檢查清單](#設計檢查清單)
- [實施計畫](#實施計畫)

---

## 現況分析

### ✅ 現有優勢

1. **技術基礎扎實**
   - React + TypeScript
   - Tailwind CSS（實用優先）
   - Framer Motion（流暢動畫）
   - 已有 Glassmorphism 概念

2. **UI 組件庫完整**
   - Dashtail UI Kit（50+ 組件）
   - 可拖曳 Dashboard
   - AI Copilot 原型

3. **設計方向正確**
   - 考慮 Kintone 風格（自訂化）
   - 注重 AI 整合
   - 支援深色模式

---

## 設計系統診斷

### ❌ 需要改進的問題

#### A. 色彩系統過於複雜

**問題：**

```css
/* ❌ 過多的色階層級 */
--color-primary-50 到 --color-primary-950  /* 11 個層級，維護困難 */
--color-secondary-50 到 --color-secondary-950  /* 11 個層級 */
```

**建議：**

```css
/* ✅ 簡化為關鍵色階 */
:root {
  /* 品牌色（僅保留關鍵 3 色） */
  --brand-primary: #3b82f6; /* 主色 */
  --brand-light: #60a5fa; /* 懸停/次要 */
  --brand-dark: #2563eb; /* 按壓/強調 */

  /* 中性色（灰階 - 僅 5 色） */
  --gray-50: #f8fafc; /* 背景 */
  --gray-200: #e2e8f0; /* 邊框 */
  --gray-500: #64748b; /* 輔助文字 */
  --gray-700: #334155; /* 主文字 */
  --gray-900: #0f172a; /* 深色模式背景 */

  /* 語意色（單一主色即可） */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

#### B. 缺乏一致的間距系統

**建議：8px Grid System（Apple/Figma 標準）**

```javascript
// tailwind.config.js
theme: {
  spacing: {
    '0': '0px',
    '1': '4px',    // 0.5 × 8
    '2': '8px',    // 1 × 8
    '3': '12px',   // 1.5 × 8
    '4': '16px',   // 2 × 8
    '6': '24px',   // 3 × 8
    '8': '32px',   // 4 × 8
    '12': '48px',  // 6 × 8
    '16': '64px',  // 8 × 8
  }
}
```

**實際應用：**

```tsx
// ✅ 好的範例
<div className="p-6 gap-4">  {/* 24px padding, 16px gap */}

// ❌ 避免
<div className="p-5 gap-3.5">  {/* 不規則數字 */}
```

#### C. 字體系統不完整

**建議：Type Scale（Major Third: 1.25 比例）**

```css
:root {
  /* 字體大小 */
  --text-xs: 12px; /* 0.75rem - 輔助說明 */
  --text-sm: 14px; /* 0.875rem - 次要內容 */
  --text-base: 16px; /* 1rem - 主要內容 */
  --text-lg: 20px; /* 1.25rem - 小標題 */
  --text-xl: 24px; /* 1.5rem - 標題 */
  --text-2xl: 32px; /* 2rem - 大標題 */

  /* 行高 */
  --leading-tight: 1.25; /* 標題用 */
  --leading-normal: 1.5; /* 內文用 */
  --leading-relaxed: 1.75; /* 長文用 */

  /* 字重 */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

---

## 高級 SaaS 設計原則

### 🎨 視覺層次法則

#### 60-30-10 色彩使用比例

```
60% - 主背景色（中性灰）
30% - 次要色（輔助背景、邊框）
10% - 強調色（品牌色、CTA）
```

**實作範例：**

```tsx
<div className="bg-gray-50">
  {" "}
  {/* 60% - 主背景 */}
  <aside className="bg-white border-gray-200">
    {" "}
    {/* 30% - 次要 */}
    <button className="bg-brand-primary">
      {" "}
      {/* 10% - 強調 */}
      立即開始
    </button>
  </aside>
</div>
```

### 📐 空間與佈局

#### 黃金比例與留白

- **卡片內距：** 24px (1.5rem)
- **元件間距：** 16px (1rem)
- **區塊間距：** 32px (2rem)
- **頁面邊距：** 48px (3rem)

#### 響應式斷點

```javascript
screens: {
  'sm': '640px',   // 手機橫向
  'md': '768px',   // 平板
  'lg': '1024px',  // 筆電
  'xl': '1280px',  // 桌機
  '2xl': '1536px', // 大螢幕
}
```

### 🔤 字體階層

```css
/* 標題層級 */
h1: 32px / 700 / 1.25    /* 頁面主標題 */
h2: 24px / 600 / 1.25    /* 區塊標題 */
h3: 20px / 600 / 1.25    /* 子標題 */

/* 內文層級 */
body-lg: 18px / 400 / 1.5    /* 重要內容 */
body: 16px / 400 / 1.5       /* 主要內容 */
body-sm: 14px / 400 / 1.5    /* 次要內容 */
caption: 12px / 400 / 1.5    /* 輔助說明 */
```

---

## 設計模式

### 🌟 微互動（Micro-interactions）

#### 優雅的按鈕效果

```tsx
<button
  className="
  px-6 py-3 
  bg-brand-primary 
  rounded-lg
  transition-all duration-200
  hover:bg-brand-light 
  hover:shadow-lg 
  hover:-translate-y-0.5
  active:translate-y-0
  focus:ring-4 focus:ring-brand-primary/20
"
>
  立即開始
</button>
```

#### Loading 狀態

```tsx
<button
  disabled
  className="
  relative overflow-hidden
  bg-gray-300 text-gray-500 cursor-not-allowed
  after:absolute after:inset-0
  after:bg-gradient-to-r after:from-transparent 
  after:via-white/40 after:to-transparent
  after:animate-shimmer
"
>
  <span className="flex items-center gap-2">
    <Loader className="animate-spin" />
    處理中...
  </span>
</button>
```

### 🎭 狀態設計

#### 空狀態（Empty State）

```tsx
<div className="flex flex-col items-center justify-center py-16 px-6">
  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
    <InboxIcon className="w-8 h-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-700 mb-2">尚無資料</h3>
  <p className="text-sm text-gray-500 text-center mb-6">
    您還沒有建立任何專案，立即開始建立第一個專案吧！
  </p>
  <button className="px-4 py-2 bg-brand-primary text-white rounded-lg">
    建立專案
  </button>
</div>
```

#### 錯誤狀態

```tsx
<div className="rounded-lg border border-error/20 bg-error/5 p-4">
  <div className="flex gap-3">
    <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
    <div>
      <h4 className="text-sm font-semibold text-error mb-1">發生錯誤</h4>
      <p className="text-sm text-gray-700 mb-3">
        無法載入資料，請檢查網路連線或稍後再試。
      </p>
      <button className="text-sm font-medium text-error hover:underline">
        重新載入
      </button>
    </div>
  </div>
</div>
```

### 🌈 深度與層次

#### 陰影階層系統

```css
:root {
  /* 卡片陰影 */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);

  /* 圓角層級 */
  --radius-sm: 6px; /* 小元件（Badge, Tag） */
  --radius-md: 8px; /* 卡片 */
  --radius-lg: 12px; /* 面板 */
  --radius-xl: 16px; /* 模態框 */
  --radius-full: 9999px; /* 圓形按鈕 */
}
```

#### Z-index 層級

```css
:root {
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1100;
  --z-fixed: 1200;
  --z-modal-backdrop: 1300;
  --z-modal: 1400;
  --z-popover: 1500;
  --z-tooltip: 1600;
}
```

---

## 實用性優化

### ⚡ 性能優化

#### 減少動畫層級

```css
/* ❌ 避免 */
.card {
  transition: all 0.3s; /* 觸發所有屬性重繪 */
}

/* ✅ 僅動畫需要的屬性 */
.card {
  transition:
    transform 0.2s,
    opacity 0.2s;
}
```

#### 使用 CSS Containment

```css
.widget-card {
  contain: layout style paint; /* 隔離渲染範圍 */
}
```

### ♿ 無障礙設計（A11y）

#### 色彩對比度

- **正常文字：** 對比度 ≥ 4.5:1 (WCAG AA)
- **大型文字：** 對比度 ≥ 3:1
- **互動元件：** 對比度 ≥ 3:1

#### 鍵盤導航

```tsx
<button
  className="..."
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
>
  按鈕
</button>
```

#### Focus 可見性

```css
.interactive-element:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
```

---

## 頂級案例參考

### 🏆 推薦學習對象

#### 1. Linear（專案管理）

- ✨ 極簡設計
- 🎯 流暢動畫
- ⌨️ 鍵盤快捷鍵優先
- 🎨 一致的視覺語言

**學習重點：**

- 命令面板（Cmd+K）設計
- 快速操作流程
- 細膩的微互動

#### 2. Notion（協作工具）

- 📐 清晰的資訊層次
- 🧩 靈活的佈局系統
- 🎭 優雅的空狀態
- 🔄 流暢的載入體驗

**學習重點：**

- 模組化內容區塊
- 拖曳互動設計
- 上下文選單

#### 3. Stripe Dashboard（支付平台）

- 📊 專業的數據視覺化
- 🎨 一致的色彩系統
- ⚠️ 優秀的錯誤處理
- 📱 響應式設計典範

**學習重點：**

- 數據表格設計
- 篩選器互動
- 狀態指示器

#### 4. Vercel Dashboard（部署平台）

- 🌙 深色模式典範
- 🧭 簡潔的導航
- ⚡ 快速的載入體驗
- 🎯 清晰的視覺層次

**學習重點：**

- 部署狀態視覺化
- 即時日誌展示
- 效能儀表板

---

## 具體改進建議

### 🎯 針對 TrvicERP 的優化

#### 1. 建立 Design Tokens

```typescript
// src/design-system/tokens.ts
export const designTokens = {
  colors: {
    brand: {
      primary: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
    },
    neutral: {
      50: "#f8fafc",
      200: "#e2e8f0",
      500: "#64748b",
      700: "#334155",
      900: "#0f172a",
    },
    semantic: {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  },
  typography: {
    fontFamily: {
      sans: 'Inter, "Noto Sans TC", sans-serif',
    },
    fontSize: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "20px",
      xl: "24px",
      "2xl": "32px",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  borderRadius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
  shadows: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.15)",
  },
  animation: {
    duration: {
      fast: "150ms",
      normal: "200ms",
      slow: "300ms",
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
};
```

#### 2. 統一 Button 元件

```tsx
// src/components/ui/Button.tsx
import { cn } from "@/lib/utils";

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Button = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  children,
  onClick,
  className,
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-brand-primary hover:bg-brand-light text-white shadow-md hover:shadow-lg focus:ring-brand-primary/20",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-200",
    ghost: "hover:bg-gray-100 text-gray-700 focus:ring-gray-100",
    danger:
      "bg-error hover:bg-error-dark text-white shadow-md hover:shadow-lg focus:ring-error/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-base gap-2",
    lg: "px-6 py-3 text-lg gap-3",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
```

#### 3. 統一 Card 元件

```tsx
// src/components/ui/Card.tsx
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  hover?: boolean;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = ({
  children,
  hover = false,
  padding = "md",
  className,
}: CardProps) => {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-sm",
        paddingClasses[padding],
        hover &&
          "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn("border-b border-gray-200 pb-4 mb-4", className)}>
    {children}
  </div>
);

export const CardTitle = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <h3 className={cn("text-lg font-semibold text-gray-900", className)}>
    {children}
  </h3>
);

export const CardContent = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <div className={className}>{children}</div>;
```

---

## 設計檢查清單

### ✅ 質感檢查

- [ ] 色彩對比度 ≥ 4.5:1（WCAG AA 標準）
- [ ] 所有互動元件有懸停狀態
- [ ] 所有動畫 ≤ 300ms
- [ ] 圓角統一使用 8px 或 12px
- [ ] 間距符合 8px grid
- [ ] 字體大小 ≥ 14px（主要內容）
- [ ] 陰影層次分明（3-4 個層級）
- [ ] 配色專業不俗氣

### ✅ 實用性檢查

- [ ] 鍵盤導航支援（Tab, Enter, Esc）
- [ ] Loading 狀態明確
- [ ] 錯誤訊息具體且可操作
- [ ] 空狀態有引導行動
- [ ] 響應式斷點合理
- [ ] 表單驗證即時反饋
- [ ] 成功/失敗訊息清晰

### ✅ 高級感檢查

- [ ] 微互動流暢自然
- [ ] 留白充足不擁擠
- [ ] 動畫有意義不花俏
- [ ] 層次分明易導航
- [ ] 資訊密度適中
- [ ] 視覺重點突出
- [ ] 品牌識別度高

### ✅ 無障礙檢查

- [ ] 所有圖片有 alt 文字
- [ ] 表單標籤正確關聯
- [ ] Focus 狀態可見
- [ ] 顏色不是唯一區分方式
- [ ] 支援螢幕閱讀器
- [ ] 文字可縮放至 200%

---

## 實施計畫

### 📅 Phase 1: 設計系統基礎（1-2 週）

**目標：建立設計規範**

- [ ] 簡化 CSS 變數至 20-30 個關鍵變數
- [ ] 建立 Design Tokens 檔案
- [ ] 統一間距系統（8px grid）
- [ ] 定義字體階層
- [ ] 建立陰影和圓角標準

**交付物：**

- `design-system/tokens.ts`
- 更新後的 `tailwind.config.js`
- 更新後的 `index.css`

### 📅 Phase 2: 核心元件重構（2-3 週）

**目標：統一基礎元件**

- [ ] 重構 Button 元件（4 種變體 + 3 種尺寸）
- [ ] 重構 Card 元件（支援 hover 效果）
- [ ] 重構 Input/Select 元件
- [ ] 加入微互動效果
- [ ] 統一 Loading 狀態

**交付物：**

- `components/ui/Button.tsx`
- `components/ui/Card.tsx`
- `components/ui/Input.tsx`
- Storybook 文檔（可選）

### 📅 Phase 3: 佈局優化（2 週）

**目標：改善整體佈局**

- [ ] 實作抽屜式側邊欄
- [ ] 優化 Dashboard 網格系統
- [ ] 改進 AI Copilot UI
- [ ] 響應式斷點調整
- [ ] 深色模式優化

**交付物：**

- `components/layout/DrawerSidebar.tsx`
- 更新後的 `DraggableDashboard.tsx`
- 更新後的 `FloatingCopilot.tsx`

### 📅 Phase 4: 細節打磨（1-2 週）

**目標：提升質感**

- [ ] 空狀態設計
- [ ] 錯誤狀態設計
- [ ] Loading 動畫優化
- [ ] Toast 通知系統
- [ ] 過渡動畫調整

**交付物：**

- `components/ui/EmptyState.tsx`
- `components/ui/ErrorState.tsx`
- `components/ui/Toast.tsx`

---

## 📚 延伸閱讀

### 設計系統參考

- [Material Design 3](https://m3.material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Atlassian Design System](https://atlassian.design/)
- [Ant Design](https://ant.design/)

### 色彩工具

- [Coolors](https://coolors.co/) - 配色方案生成
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - 對比度檢查
- [Color Hunt](https://colorhunt.co/) - 配色靈感

### 設計資源

- [Figma Community](https://www.figma.com/community) - 設計檔案
- [Dribbble](https://dribbble.com/) - 設計靈感
- [Refactoring UI](https://www.refactoringui.com/) - UI 設計技巧

---

## 🤝 貢獻指南

改進此設計系統時，請遵循以下原則：

1. **保持一致性** - 所有新增元件必須符合 Design Tokens
2. **測試響應式** - 確保在所有斷點正常運作
3. **注重無障礙** - 遵循 WCAG AA 標準
4. **性能優先** - 避免過度動畫和重繪
5. **文檔完整** - 為新元件編寫使用說明

---

## 📝 版本歷史

### v1.0.0 (2026-01-28)

- 初始版本
- 完整的設計系統分析
- 核心元件規範
- 實施計畫

---

**維護者：** TrvicERP 設計團隊  
**最後更新：** 2026-01-28  
**授權：** MIT License
