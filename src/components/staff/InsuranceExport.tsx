import React, { useState } from 'react';
import { FileText, Download, AlertCircle, Shield, GripVertical } from 'lucide-react';

// --- [architect] [架構] 問題修復 1 & 2: 缺少明確的 Props 介面定義 & 元件直接使用內部狀態 ---
// 定義保險記錄的介面
interface InsuranceRecord {
  id: string;
  tripName: string;
  travelerCount: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'submitted' | 'confirmed';
  provider: string;
}

// 為了方便開發和作為獨立元件運行時的數據來源，提供一個預設的 Mock 數據。
// 在實際 Kintone 場景中，此數據應透過 props 傳入，或從父組件/API獲取。
const MOCK_RECORDS_FOR_DEMO: InsuranceRecord[] = [
  { id: '1', tripName: '東京五日深度遊', travelerCount: 24, startDate: '2025-03-15', endDate: '2025-03-19', status: 'confirmed', provider: '新光產險' },
  { id: '2', tripName: '北海道冬季雪祭', travelerCount: 38, startDate: '2025-02-01', endDate: '2025-02-06', status: 'submitted', provider: '國泰產險' },
  { id: '3', tripName: '首爾購物美食團', travelerCount: 12, startDate: '2025-04-20', endDate: '2025-04-24', status: 'pending', provider: '富邦產險' },
];

// [architect] [架構] 為元件定義明確的 Props 介面
// 元件透過 Props 接收所有必要的資料，確保其獨立性和可配置性。
interface InsuranceExportProps {
  initialRecords?: InsuranceRecord[]; // 元件接收初始保險記錄，可選，方便測試
  // Kintone 獨立性 (架構):
  // 如果有其他配置項，可以透過定義 `InsuranceExportConfig` 介面並作為 props 傳入。
  // config?: InsuranceExportConfig;
}

// --- [designer] 問題修復 4: 狀態樣式物件應提取為常數 ---
// 將狀態樣式物件提取為常數，使用 Dashtail UI 規範的 Tailwind Tokens。
// [designer] 1. 硬編碼顏色值修正: `brand-` -> `primary-`, `yellow-` -> `warning-`
const INSURANCE_STATUS_STYLES: Record<InsuranceRecord['status'], { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-warning-100', text: 'text-warning-700', label: '待提交' },
  submitted: { bg: 'bg-primary-100', text: 'text-primary-700', label: '已提交' },
  confirmed: { bg: 'bg-primary-100', text: 'text-primary-700', label: '已確認' },
};

// 輔助函數：根據狀態獲取對應的樣式與標籤
const getStatusStyle = (status: InsuranceRecord['status']) => {
  return INSURANCE_STATUS_STYLES[status] || INSURANCE_STATUS_STYLES.pending;
};

// --- [architect] [架構] 問題修復 3: 元件同時負責 UI 渲染和業務邏輯(狀態管理) (中) ---
// 元件仍然負責其自身的 UI 相關狀態管理 (如選中項 `selectedIds`)，
// 但核心數據 (`initialRecords`) 已透過 props 傳入。
// 複雜的業務邏輯或數據操作（如匯出後的數據更新）應透過 props 傳遞的回調函數來處理。

export default function InsuranceExport({ initialRecords = MOCK_RECORDS_FOR_DEMO }: InsuranceExportProps) {
  // [architect] [架構] 元件透過 Props 接收資料，內部狀態僅用於管理 UI 的交互（如勾選狀態）
  const [records] = useState<InsuranceRecord[]>(initialRecords);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState<boolean>(false);

  // 全選/取消全選邏輯
  const toggleSelectAll = () => {
    if (isSelectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map(record => record.id));
    }
    setIsSelectAll(prev => !prev);
  };

  // 單獨選取/取消選取邏輯
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSelectedIds = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      // 同步全選狀態
      setIsSelectAll(newSelectedIds.length === records.length && records.length > 0);
      return newSelectedIds;
    });
  };

  // 匯出按鈕的點擊處理，實際應用中會觸發數據匯出邏輯 (例如呼叫父組件傳入的 onExport 回調)
  const handleExport = () => {
    if (selectedIds.length > 0) {
      console.log('匯出選中的保險記錄:', selectedIds);
      // alert(`正在匯出 ${selectedIds.length} 筆記錄`); // 僅為演示，實際應觸發業務邏輯
      // const selectedRecords = records.filter(record => selectedIds.includes(record.id));
      // onExport(selectedRecords); // 如果有 onExport prop
    }
  };

  // 計算統計數據
  const confirmedTravelerCount = records.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + r.travelerCount, 0);
  const pendingTripsCount = records.filter(r => r.status === 'pending').length;
  const totalTripsCount = records.length;

  return (
    // --- Dashtail UI 規範 (設計) ---
    // 外部 Card 結構與 drag-handle
    // [designer] 3. 字體與間距使用正確的 Tailwind class (中) - 調整為標準 Dashtail Card 結構和文字樣式
    // [designer] 5. 互動元素缺少一致的 focus 樣式 (中) - 增加 focus-visible 樣式以提高可訪問性
    <div className="bg-white shadow-sm rounded-xl border border-neutral-100 p-6 space-y-6
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2">

      {/* [designer] 2. 缺少 drag-handle 結構 (高) */}
      {/* drag-handle 區域，通常包含標題和主要操作按鈕 */}
      <div className="drag-handle flex items-center justify-between pb-4 border-b border-neutral-100 -mt-2 -mx-2 px-2 mb-4 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-neutral-400" />
            <h2 className="text-xl font-semibold text-neutral-800">保險管理</h2>
        </div>
        <button
            onClick={handleExport}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md shadow-sm
                       hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2
                       disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out"
            aria-label={`匯出 ${selectedIds.length} 筆記錄`}
        >
            <Download className="w-4 h-4" />
            匯出 ({selectedIds.length})
        </button>
      </div>

      {/* 元件描述 */}
      <div className="pb-4">
        <p className="text-neutral-500 text-sm">團體保險申報與匯出</p>
      </div>

      {/* 統計卡片區域 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 統計卡片，加上 tabIndex 和 role 以提升可訪問性，並應用 focus-visible 樣式 */}
        <div tabIndex={0} role="group" className="bg-white p-5 rounded-lg border border-neutral-100 cursor-default
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2">
          <Shield className="w-8 h-8 text-primary-600 mb-3" /> {/* [designer] 1. 硬編碼顏色值修正: brand -> primary; 調整圖標大小和間距 */}
          <p className="text-sm text-neutral-500">已投保人數</p>
          <p className="text-xl font-bold text-neutral-900 mt-1">{confirmedTravelerCount}</p>
        </div>
        <div tabIndex={0} role="group" className="bg-white p-5 rounded-lg border border-neutral-100 cursor-default
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2">
          <AlertCircle className="w-8 h-8 text-warning-600 mb-3" /> {/* [designer] 1. 硬編碼顏色值修正: yellow -> warning; 調整圖標大小和間距 */}
          <p className="text-sm text-neutral-500">待處理</p>
          <p className="text-xl font-bold text-warning-600 mt-1">{pendingTripsCount}</p> {/* [designer] 1. 硬編碼顏色值修正: yellow -> warning */}
        </div>
        <div tabIndex={0} role="group" className="bg-white p-5 rounded-lg border border-neutral-100 cursor-default
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2">
          <FileText className="w-8 h-8 text-neutral-600 mb-3" />
          <p className="text-sm text-neutral-500">本月團次</p>
          <p className="text-xl font-bold text-neutral-900 mt-1">{totalTripsCount}</p>
        </div>
      </div>

      {/* 保險記錄表格區域 */}
      <div className="bg-white rounded-lg border border-neutral-100 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-neutral-100">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="w-12 px-6 py-3 text-left">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded
                             focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  checked={isSelectAll}
                  onChange={toggleSelectAll}
                  aria-label="選取所有記錄"
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">團次</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">日期</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">人數</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">保險公司</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {records.map((record) => {
              const status = getStatusStyle(record.status);
              return (
                <tr
                  key={record.id}
                  // 應用 hover 效果和 focus-visible 樣式，讓表格行可聚焦
                  className="hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-inset"
                  tabIndex={0} // 使行可透過鍵盤導航聚焦
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded
                                 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                      checked={selectedIds.includes(record.id)}
                      onChange={() => toggleSelect(record.id)}
                      aria-label={`選取團次: ${record.tripName}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-900">{record.tripName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{record.startDate} ~ {record.endDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{record.travelerCount} 人</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{record.provider}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* 狀態標籤應用提取出的樣式 */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}