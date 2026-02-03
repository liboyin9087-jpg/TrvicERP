import React, { useMemo } from 'react';
import type { GenericWidget } from '@/core/types/dashboard'; // 假設此路徑定義了基礎的 Widget 類型
import { formatDecimal } from '@/lib/formatters';

// [architect] Widget 介面明確定義 Pie Chart 專用 Config 類型
// 定義圖表資料中單一項目的預期結構
interface PieChartDataItem {
  label: string;
  value: number;
}

// 定義 Pie Chart Widget 專用的配置介面
export interface PieChartWidgetConfig {
  data: PieChartDataItem[];
  // 可選：允許自定義圖表標題、顏色調色板等。
  // 目前，我們將依賴元件內部的調色板和 widget.title。
}

// [architect] 顏色常數定義與元件邏輯耦合 -> 解耦並使用 Tailwind Tokens
// [designer] 使用 Hardcoded 顏色值 (#3B82F6 等) 而非 Tailwind CSS 變數 (高)
// 定義一組Dashtail/Tailwind CSS token 名稱，用於確保顏色的一致性與可主題化。
// 這些名稱將用於為圖例生成 CSS class，並為圓錐漸變生成 CSS 變數。
const DASHTAIL_COLOR_TOKENS = [
  'primary-500',
  'success-500',
  'warning-500',
  'info-500',
  'error-500',
  'indigo-500',
  'pink-500',
  'emerald-500',
];

/**
 * 輔助函數：根據給定的 Tailwind 顏色 token 獲取 CSS 變量字符串。
 * 假設 Dashtail/Tailwind 主題定義了如 `--color-primary-500` 這樣的 CSS 自定義屬性。
 * 這允許在像 `conic-gradient` 這樣的 CSS 屬性中使用基於 token 的顏色，而無需在 JS 中硬編碼 hex 值。
 * @param token Tailwind 顏色 token 字符串 (例如 'primary-500')。
 * @returns CSS 變量字符串 (例如 'var(--color-primary-500)')。
 */
const getCssColorVar = (token: string): string => `var(--color-${token})`;

/**
 * 輔助函數：根據給定的 Tailwind 顏色 token 獲取 Tailwind 背景 class 字符串。
 * @param token Tailwind 顏色 token 字符串 (例如 'primary-500')。
 * @returns Tailwind CSS class 字符串 (例如 'bg-primary-500')。
 */
const getBgClass = (token: string): string => `bg-${token}`;

/**
 * 根據提供的圖表資料構建 CSS 圓錐漸變字符串。
 * 顏色是從 Dashtail/Tailwind token 通過 CSS 自定義屬性派生而來的。
 * @param data 餅圖資料項的數組。
 * @returns CSS 圓錐漸變字符串。
 */
function buildConicGradient(data: PieChartDataItem[]): string {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let current = 0;
  const segments = data.map((item, index) => {
    const start = (current / total) * 360;
    const end = ((current + item.value) / total) * 360;
    current += item.value;
    // 使用從 DASHTAIL_COLOR_TOKENS 派生而來的基於 token 的顏色，透過 CSS 變數獲取
    const colorToken = DASHTAIL_COLOR_TOKENS[index % DASHTAIL_COLOR_TOKENS.length];
    const color = getCssColorVar(colorToken);
    return `${color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${segments.join(', ')})`;
}

/**
 * PieChartWidget 元件，用於以餅圖格式顯示資料。
 * 遵循 Dashtail UI 指南和架構最佳實踐。
 */
export default function PieChartWidget({ widget }: { widget: GenericWidget<PieChartWidgetConfig> }) {
  // [architect] 元件直接依賴全域靜態資料 (PIE_CHART_DATA) -> 改為透過 Props 傳入
  // 資料現在直接來自 widget 的配置。
  const chartData: PieChartDataItem[] = widget.config?.data || [];

  // [architect] 混合渲染邏輯與資料轉換 -> 資料轉換邏輯已提取到 buildConicGradient
  // 漸變被 memoized，只有當 `chartData` 引用改變時才會重新計算。
  const gradient = useMemo(() => buildConicGradient(chartData), [chartData]);

  // 計算總值，確保至少為 1 以避免除以零。
  const total = chartData.reduce((sum, item) => sum + item.value, 0) || 1;

  // [designer] 結構: 如果是 Widget，確保外層有標準 Card 結構。
  // 使用 Dashtail 類似的卡片 class 作為外部結構。
  // [designer] 未明確驗證字體與間距使用 Tailwind class
  // 調整文本顏色為更具語義的 Dashtail 等效顏色 (例如，text-foreground, text-muted-foreground)，
  // 假設這些 class 存在於 Dashtail 主題中。這有助於實現更好的主題化。
  return (
    <div className="h-full rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col p-4">
      {/* Widget Header 包含標題和拖曳把手 */}
      <div className="flex items-center justify-between mb-4">
        {/* [designer] 缺少 drag-handle 結構 (中) */}
        <h3 className="text-lg font-semibold text-foreground drag-handle cursor-grab">
          {widget.title || 'Pie Chart'}
        </h3>
        {/* 可選：在此處添加其他標頭元素，例如設置按鈕、刷新按鈕等 */}
      </div>

      {/* 主要圖表內容區域，佔用剩餘高度 */}
      <div className="flex-1 flex items-center gap-6">
        <div className="relative w-28 h-28 flex-shrink-0"> {/* flex-shrink-0 防止縮小 */}
          <div
            className="w-28 h-28 rounded-full"
            style={{ backgroundImage: gradient }}
            aria-label={`圖表主題: ${widget.title || 'Pie Chart'}`}
          />
          {/* 內部圓圈顯示總百分比 */}
          <div
            className="absolute inset-0 m-auto w-14 h-14 bg-background rounded-full shadow-inner flex items-center justify-center
                       text-sm font-semibold text-muted-foreground
                       focus:ring-2 focus:ring-primary-300 active:bg-primary-50 focus:outline-none cursor-pointer
                       transition-all duration-200 ease-in-out hover:shadow-md hover:bg-accent"
            tabIndex={0} // 使 div 可聚焦
            role="button" // 指示這是一個互動元素
            aria-label="查看圖表詳細資訊或總百分比"
          >
            <span>{chartData.length > 0 ? '100%' : 'N/A'}</span> {/* 如果有數據則顯示100%，否則顯示N/A */}
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-sm">無可用數據顯示。</p>
          ) : (
            chartData.map((item, index) => (
              // 每個圖例項目都帶有互動性 hover/focus 狀態
              <div
                key={item.label}
                className="flex items-center justify-between text-sm text-muted-foreground p-1 rounded-md
                           hover:bg-accent focus-within:ring-1 focus-within:ring-primary-200 transition-all duration-150 ease-in-out"
                tabIndex={0} // 使 div 可聚焦
                role="listitem" // 指示這是一個列表項目
                aria-label={`${item.label}: ${formatDecimal((item.value / total) * 100, 0)}%`}
              >
                <div className="flex items-center gap-2">
                  {/* 使用基於 token 的顏色 class 作為圖例指示器 */}
                  <span className={`w-3 h-3 rounded-full ${getBgClass(DASHTAIL_COLOR_TOKENS[index % DASHTAIL_COLOR_TOKENS.length])}`} />
                  <span>{item.label}</span>
                </div>
                <span className="font-semibold text-foreground">
                  {formatDecimal((item.value / total) * 100, 0)}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}