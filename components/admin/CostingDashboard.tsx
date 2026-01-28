import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, Move } from 'lucide-react';
import EmptyState from '../shared/EmptyState'; // Assuming this path is correct for EmptyState

// --- 1. 定義 Props 介面 ---

// 成本項目結構
interface CostingDashboardItem {
  category: string;
  amount: number;
  percent: number; // 佔總成本的百分比，例如 35 代表 35%
}

// 優化建議結構
interface CostingDashboardSuggestion {
  id: string; // 建議的唯一識別碼
  icon: React.ElementType; // Lucide React 圖標元件，例如 TrendingDown
  title: string;
  description: string;
}

// CostingDashboard 元件的 Props 介面
export interface CostingDashboardProps {
  // 儀表板元件（Widget）的標題和描述
  widgetTitle?: string; // 預設為 "成本分析"
  widgetDescription?: string; // 預設為 "團次成本結構與利潤分析"

  // 關鍵指標數據
  totalCost: number; // 總成本
  estimatedRevenue: number; // 預估營收
  grossMarginPercent: number; // 毛利率，例如 32.5 代表 32.5%
  avgCostPerPerson: number; // 人均成本

  // 成本結構的詳細項目
  costItems: CostingDashboardItem[];

  // 成本優化建議 (可選)
  optimizationSuggestions?: CostingDashboardSuggestion[];
  potentialSavingsAmount?: number; // 總潛在節省金額 (可選)
}

// --- 2. 提取共用樣式 ---

// 應用於 Dashtail 規範中可互動卡片的通用樣式
// 這些樣式在 Dashtail 中通常用於強調可點擊或可互動的卡片區塊
const INTERACTIVE_CARD_STYLES = 'focus:ring-2 focus:ring-primary-300 active:bg-primary-800 transition-all duration-150 ease-in-out';

// --- 3. 輔助元件：用於顯示單個指標卡片 ---
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor: string; // 例如 'text-gray-900' 或 'text-primary-600'
}

function MetricCard({ icon, label, value, valueColor }: MetricCardProps) {
  return (
    <div className={`bg-white p-6 rounded-2xl border border-gray-100 ${INTERACTIVE_CARD_STYLES}`}>
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      {/* 保持 text-2xl font-bold 用於強調數字 */}
      <p className={`text-2xl font-bold ${valueColor} mt-1`}>{value}</p>
    </div>
  );
}

// --- 4. CostingDashboard 主元件 ---
export default function CostingDashboard({
  widgetTitle = "成本分析",
  widgetDescription = "團次成本結構與利潤分析",
  totalCost,
  estimatedRevenue,
  grossMarginPercent,
  avgCostPerPerson,
  costItems,
  optimizationSuggestions = [],
  potentialSavingsAmount,
}: CostingDashboardProps) {

  // 輔助函數：將金額格式化為 "NT$ XX萬"
  const formatAmountToMillion = (amount: number) => `NT$ ${(amount / 10000).toFixed(0)}萬`;

  return (
    // 遵守 Dashtail/TrvicERP 規範：元件作為一個可拖曳的 Widget，需有標準卡片結構
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
      {/* 遵守 Dashtail/TrvicERP 規範：拖曳把手結構 */}
      <div className="drag-handle flex items-center justify-between mb-4 pb-2 border-b border-gray-100 cursor-grab">
        {/* 調整字體大小為 widget 標題常見的 text-lg */}
        <h2 className="text-lg font-semibold text-gray-900">{widgetTitle}</h2>
        <Move className="w-5 h-5 text-gray-400" /> {/* 提供視覺化的拖曳圖標 */}
      </div>

      {widgetDescription && <p className="text-sm text-gray-500 mb-4">{widgetDescription}</p>}

      <div className="flex-grow space-y-6"> {/* 主要內容區塊 */}
        {/* 指標卡片網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<DollarSign className="w-5 h-5 text-gray-600" />}
            label="總成本"
            value={formatAmountToMillion(totalCost)}
            valueColor="text-gray-900"
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5 text-primary-600" />} {/* 修正為 Tailwind 標準顏色 */}
            label="預估營收"
            value={formatAmountToMillion(estimatedRevenue)}
            valueColor="text-primary-600"
          />
          <MetricCard
            icon={<BarChart3 className="w-5 h-5 text-primary-600" />} {/* 修正為 Tailwind 標準顏色 */}
            label="毛利率"
            value={`${grossMarginPercent.toFixed(1)}%`}
            valueColor="text-primary-600"
          />
          <MetricCard
            icon={<PieChart className="w-5 h-5 text-gray-600" />}
            label="人均成本"
            value={`NT$ ${avgCostPerPerson.toLocaleString()}`}
            valueColor="text-gray-900"
          />
        </div>

        {/* 成本結構與優化建議面板 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 成本結構面板 */}
          <div className={`bg-white p-6 rounded-2xl border border-gray-100 ${INTERACTIVE_CARD_STYLES}`}>
            {/* 調整字體大小為 panel 標題常見的 text-lg */}
            <h3 className="font-semibold text-gray-900 mb-6 text-lg">成本結構</h3>
            {costItems.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="尚無成本資料"
                description="請先選擇團次或新增成本項目"
                size="sm"
              />
            ) : (
              <div className="space-y-4">
                {costItems.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.category}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">NT$ {item.amount.toLocaleString()}</span>
                        <span className="text-sm text-gray-500 ml-2">({item.percent}%)</span>
                      </div>
                    </div>
                    {/* 進度條已經使用 primary-900，符合規範 */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-900 rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 成本優化建議面板 */}
          <div className={`bg-primary-900 text-white p-6 rounded-2xl ${INTERACTIVE_CARD_STYLES}`}>
            {/* 調整字體大小為 panel 標題常見的 text-lg */}
            <h3 className="font-semibold mb-6 text-lg">成本優化建議</h3>
            <div className="space-y-4">
              {optimizationSuggestions.length === 0 && potentialSavingsAmount === undefined ? (
                 <EmptyState
                    icon={TrendingUp} // 這裡可以使用適合表示建議的圖標
                    title="暫無優化建議"
                    description="目前成本表現良好或無足夠數據"
                    size="sm"
                    className="text-gray-400" // 調整 EmptyState 容器顏色以適應深色背景
                    titleClassName="text-white" // 調整標題顏色
                    descriptionClassName="text-gray-400" // 調整描述顏色
                  />
              ) : (
                <>
                  {optimizationSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="p-4 bg-white/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {/* 修正為 Tailwind 標準顏色 */}
                        <suggestion.icon className="w-4 h-4 text-primary-400" />
                        <span className="text-sm font-semibold">{suggestion.title}</span>
                      </div>
                      {/* 調整文字顏色以適應深色背景 */}
                      <p className="text-sm text-gray-300">{suggestion.description}</p>
                    </div>
                  ))}
                  {potentialSavingsAmount !== undefined && (
                    <div className="p-4 bg-white/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {/* 修正為 Tailwind 標準顏色 */}
                        <DollarSign className="w-4 h-4 text-primary-400" />
                        <span className="text-sm font-semibold">潛在節省金額</span>
                      </div>
                      {/* 保持 text-2xl font-bold 用於強調數字 */}
                      <p className="text-2xl font-bold text-primary-400 mt-1">
                        NT$ {potentialSavingsAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}