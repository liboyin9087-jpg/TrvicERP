import React from 'react';
import { BarChart3, DollarSign, Star, Users } from 'lucide-react';
import type { GenericWidget } from '@/core/types/dashboard';
// Removed direct dependency on global KPI_DATA as per [architect] 1
import { formatCurrency, formatDecimal, formatNumber } from '@/lib/formatters';

// [architect] 2. Widget 介面未明確定義 config 的結構
// 為 KpiCardWidget 定義專屬的配置介面
export interface KpiCardWidgetConfig {
  /**
   * KPI 的類型，用於決定圖標、格式和標籤。
   * 預設為 'revenue'。
   */
  kpiType?: 'revenue' | 'orders' | 'customers' | 'satisfaction';
  /**
   * 是否顯示趨勢資訊。
   * 預設為 true。
   */
  showTrend?: boolean;
}

// 定義 KpiCardWidget 接收的數據結構，使其獨立於全域數據源
interface KpiCardData {
  /** KPI 的主要數值 */
  value: number;
  /** KPI 的趨勢數值 (百分比變化) */
  trend: number;
}

// 組合 KpiCardWidget 的完整 props 介面
interface KpiCardWidgetProps {
  /**
   * Widget 的通用配置，包含 KpiCardWidgetConfig。
   */
  widget: GenericWidget<KpiCardWidgetConfig>;
  /**
   * 該 KPI Widget 要顯示的具體數據。
   * 這使得元件可以獨立運作，不依賴全域數據。
   */
  data: KpiCardData;
}

// KPI 的元數據，包含圖標、格式化類型和顯示標籤
const KPI_META = {
  revenue: { icon: DollarSign, format: 'currency', label: 'Revenue' },
  orders: { icon: BarChart3, format: 'count', label: 'Orders' },
  customers: { icon: Users, format: 'count', label: 'Customers' },
  satisfaction: { icon: Star, format: 'score', label: 'Satisfaction' },
};

export default function KpiCardWidget({ widget, data }: KpiCardWidgetProps) {
  // [designer] 5. 預設值處理建議
  // 從 widget.config 中解構 kpiType 和 showTrend，並提供預設值
  const { kpiType = 'revenue', showTrend = true } = widget.config;

  // 從 data props 中解構 value 和 trend
  const { value, trend } = data; // data 已經被 KpiCardData 介面保證包含 value 和 trend

  const meta = KPI_META[kpiType];
  const Icon = meta?.icon || BarChart3; // 預設圖標
  const kpiLabel = meta?.label || kpiType.charAt(0).toUpperCase() + kpiType.slice(1); // 預設標籤
  const isPositive = trend >= 0;

  // [architect] 3. 格式化邏輯與渲染邏輯混合 -> 保持格式化邏輯在外部函數，但選擇邏輯在組件內是合理的
  const formattedValue = (() => {
    switch (meta?.format) {
      case 'currency':
        return formatCurrency(value);
      case 'score':
        return formatDecimal(value, 1);
      case 'count':
      default:
        return formatNumber(value);
    }
  })();

  return (
    // [designer] 2. 缺少 drag-handle 結構 & [designer] 2. 確保外層有標準 Card 結構
    // 增加標準 Card 結構 (p-6 bg-white rounded-lg shadow-sm) 及 drag-handle 類別
    <div className="p-6 bg-white rounded-lg shadow-sm h-full flex flex-col justify-between gap-4 drag-handle">
      <div className="flex items-start justify-between">
        <div>
          {/* [designer] 1. 硬編碼顏色值 -> text-gray-400 替換為 text-neutral-400 */}
          {/* [designer] 3. 字體與間距使用正確 -> 保持原始字體/間距，符合 Dashtail 規範，同時使用 meta.label */}
          <p className="text-sm uppercase tracking-wide text-neutral-400">{kpiLabel}</p>
          {/* [designer] 1. 硬編碼顏色值 -> text-gray-900 替換為 text-neutral-900 */}
          <p className="text-2xl font-bold text-neutral-900">{formattedValue}</p>
        </div>
        {/* [designer] 1. 硬編碼顏色值 -> bg-brand-50 替換為 bg-primary-50 */}
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          {/* [designer] 1. 硬編碼顏色值 -> text-brand-600 替換為 text-primary-600 */}
          <Icon size={18} className="text-primary-600" />
        </div>
      </div>
      {showTrend && (
        <div className="flex items-center gap-2 text-sm">
          {/* [designer] 4. 動態樣式條件判斷可優化 -> 替換硬編碼顏色為 Tailwind Token */}
          <span className={`font-semibold ${isPositive ? 'text-success-600' : 'text-danger-500'}`}>
            {isPositive ? '+' : ''}
            {formatDecimal(trend, 1)}%
          </span>
          {/* [designer] 1. 硬編碼顏色值 -> text-gray-400 替換為 text-neutral-400 */}
          <span className="text-neutral-400">vs last period</span>
        </div>
      )}
    </div>
  );
}