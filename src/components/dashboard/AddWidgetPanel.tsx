import React from 'react';
import { Plus, X } from 'lucide-react';
// architect: 移除對全域 Store (useDashboardStore) 的直接依賴
// import { useDashboardStore } from '@/store/useDashboardStore';
import type { WidgetType } from '@/core/types/dashboard';

// architect: Config Props 介面 (AddWidgetPanelProps) 已正確定義，並新增 availableWidgets
interface AddWidgetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: WidgetType) => void;
  // architect: 將 availableWidgets 改為透過 Props 傳遞以降低耦合度
  availableWidgets: Array<{
    type: WidgetType;
    title: string;
    description: string;
    // ... 其他 widget 屬性
  }>;
}

// designer: 定義重複的 focus/active 樣式，降低重複性並提升一致性
const INTERACTIVE_BUTTON_CLASSES =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 active:bg-primary-800';

export default function AddWidgetPanel({ isOpen, onClose, onAdd, availableWidgets }: AddWidgetPanelProps) {
  // architect: 移除 useDashboardStore 的使用
  // const availableWidgets = useDashboardStore((state) => state.availableWidgets);

  if (!isOpen) return null;

  return (
    // designer: 邊框顏色使用 Tailwind Token，將 border-gray-200 改為 border-gray-300 (假設為 Dashtail 規範的預設邊框色)
    // designer: 移除容器 div 上不必要的 focus/active 樣式
    <div className="fixed right-6 top-20 w-72 bg-white rounded-lg shadow-xl border border-gray-300 z-50 overflow-hidden">
      <div className="relative flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        {/* designer: 缺少 drag-handle 結構，在此新增。假設整個 header 區域為可拖曳範圍。*/}
        {/* drag-handle 應位於可點擊元素下方 (z-index 較低)，但覆蓋整個拖曳區域。 */}
        <div className="drag-handle absolute inset-0 cursor-grab" aria-hidden="true" />
        
        <h3 className="font-semibold text-gray-800 relative z-10">Widget library</h3>
        
        {/* designer: 圖示按鈕缺少 ARIA 標籤，已新增 aria-label */}
        {/* designer: 套用定義好的重複 focus/active 樣式 */}
        <button
          onClick={onClose}
          className={`p-1 rounded hover:bg-gray-200 transition-colors relative z-10 ${INTERACTIVE_BUTTON_CLASSES}`}
          aria-label="Close widget library"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      {/* designer: 高度限制使用 max-h-96 硬編碼值，已改為具體像素值 max-h-[400px] */}
      {/* designer: 移除內容區 div 上不必要的 focus/active 樣式 */}
      <div className="p-3 max-h-[400px] overflow-y-auto">
        <div className="space-y-2">
          {availableWidgets.map((widget) => (
            // designer: 邊框顏色使用 Tailwind Token，將 border-gray-200 改為 border-gray-300
            // designer: 品牌相關顏色 (brand-*) 改為使用 primary-* 系列，符合 Dashtail UI 規範
            // designer: 套用定義好的重複 focus/active 樣式
            // designer: 圖示按鈕缺少 ARIA 標籤，已新增 aria-label
            <button
              key={widget.type}
              onClick={() => onAdd(widget.type)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border border-gray-300 hover:border-primary-200 hover:bg-primary-50 transition-all text-left ${INTERACTIVE_BUTTON_CLASSES}`}
              aria-label={`Add ${widget.title} widget`}
            >
              {/* designer: 移除圖示區 div 上不必要的 focus/active 樣式 */}
              {/* designer: 品牌相關顏色 (brand-*) 改為使用 primary-* 系列 */}
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Plus size={20} className="text-primary-600" />
              </div>
              <div>
                <div className="font-medium text-gray-800 text-sm">{widget.title}</div>
                <div className="text-sm text-gray-500">{widget.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}