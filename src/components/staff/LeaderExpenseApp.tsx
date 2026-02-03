import React from 'react';
import { Receipt, Plus, Camera, DollarSign, Calendar, Check, Clock } from 'lucide-react';

// 定義 Expense 介面，保持不變
interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

// [architect] [架構] 缺少明確的 Props 介面定義
// [architect] [架構] 元件直接使用內部狀態(MOCK_EXPENSES)而非透過 Props 接收資料
// [Kintone 獨立性 (架構)] 改為透過定義 interface LeaderExpenseAppConfig props 來接收資料。
export interface LeaderExpenseAppConfig {
  expenses: Expense[]; // 元件透過 props 接收費用資料
  onAddExpense?: () => void; // 新增支出的回調函數 (可選)
  onViewExpenseDetail?: (expenseId: string) => void; // 查看支出詳情的回調函數 (可選)
}

// [designer] [設計] 使用硬編碼顏色值 (如 #3b82f6) - 確保所有顏色都使用 Tailwind Token
// 狀態樣式函數，使用 Tailwind CSS 顏色 token
const getStatusStyle = (status: Expense['status']) => {
  const styles: Record<Expense['status'], { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '待審核' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: '已核准' }, // 使用標準綠色作為核准狀態
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: '已拒絕' },
  };
  return styles[status] || styles.pending;
};

// [architect] [架構] 混合了資料展示與業務邏輯計算 - 計算邏輯移到元件頂部，從 props 派生
export default function LeaderExpenseApp({ expenses, onAddExpense, onViewExpenseDetail }: LeaderExpenseAppConfig) {
  // 總計和篩選數據從 props.expenses 計算而來
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'pending').length;

  return (
    // [Dashtail UI 規範 (設計)] 結構: 如果是 Widget，確保外層有標準 Card 結構。
    // 使用標準卡片樣式：白色背景、圓角、陰影、邊框和內邊距
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6 animate-fade-in">
      {/* 標題區塊，包含拖曳把手 */}
      {/* [Dashtail UI 規範 (設計)] 拖曳: 確保支援 .drag-handle 類別。 */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 drag-handle">
        <div>
          {/* [designer] [設計] 字體與間距未完全使用 Tailwind class - 統一字體大小和粗細 */}
          <h2 className="text-xl font-semibold text-gray-800">領隊報帳</h2>
          <p className="text-sm text-gray-500 mt-1">管理出團費用申報</p>
        </div>
        {/* 新增支出按鈕 */}
        {/* [designer] [設計] 互動狀態樣式不完整 - 確保按鈕有完整的互動狀態 */}
        <button
          onClick={onAddExpense}
          className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2
                     hover:bg-primary-700 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                     active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> {/* 調整圖標大小 */}
          新增支出
        </button>
      </div>

      {/* 數據概覽卡片區塊 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 總支出卡片 */}
        {/* [designer] [設計] 互動狀態樣式不完整 - 這些是展示卡片，不應有 focus/active 狀態 */}
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-500">總支出</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">NT$ {totalAmount.toLocaleString()}</p>
        </div>
        {/* 已核准卡片 */}
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-500">已核准</p>
          {/* [designer] [設計] 使用硬編碼顏色值 - 使用 Tailwind token `text-green-600` */}
          <p className="text-2xl font-bold text-green-600 mt-1">NT$ {approvedAmount.toLocaleString()}</p>
        </div>
        {/* 待審核卡片 */}
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-500">待審核</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount} 筆</p>
        </div>
      </div>

      {/* 支出列表區塊 */}
      <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            目前沒有任何支出記錄。
          </div>
        ) : (
          expenses.map((expense) => {
            const status = getStatusStyle(expense.status);
            return (
              // 每個支出項目作為可點擊的元素
              // [designer] [設計] 互動狀態樣式不完整 - 為列表項目提供完整的互動狀態
              <div
                key={expense.id}
                onClick={() => onViewExpenseDetail?.(expense.id)} // 點擊項目觸發回調
                className="p-4 flex items-center justify-between cursor-pointer
                           hover:bg-gray-50 transition-colors duration-150
                           focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-0
                           active:bg-gray-100"
                tabIndex={0} // 使 div 可被鍵盤導航聚焦
                role="button" // 語義化為按鈕
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-gray-500" /> {/* 調整圖標大小 */}
                  </div>
                  <div>
                    {/* [designer] [設計] 字體與間距未完全使用 Tailwind class - 統一字體大小和粗細 */}
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {expense.category}
                      </span> {/* 調整標籤樣式 */}
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {expense.date}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">NT$ {expense.amount.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${status.bg} ${status.text}`}>
                    {status.label}
                  </span> {/* 調整狀態標籤樣式 */}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}