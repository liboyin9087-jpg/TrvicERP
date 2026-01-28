/**
 * 企業客戶管理模組匯出
 */

// 原始模組匯出 (保持不變)
export * from './services/corporateService';
export type * from '@/core/types/corporate';

// 根據問題描述及修復規範，將此模組匯出檔案擴展為包含一個獨立的 Kintone/Dashtail Widget。
// 該 Widget 將符合 Kintone 獨立性與 Dashtail UI 規範。

import React from 'react';

// 1. Kintone 獨立性 (架構):
//    - 移除對全域 Store 的依賴。
//    - 改為透過定義 `interface CorporateIndexConfig` props 來接收資料。
//    - 確保元件可以作為獨立 Widget 被拖曳與配置。
// 根據 {file_path_name}Config 規範，此檔案路徑為 /modules/corporate/index.ts，故命名為 CorporateIndexConfig。
interface CorporateIndexConfig {
  /** Widget 標題 */
  title: string;
  /** 要顯示的企業客戶 ID，由配置傳入 */
  corporateId?: string;
  /** 顯示模式 (例如：摘要或詳細資訊) */
  displayMode?: 'summary' | 'detail';
  /** 背景顏色 CSS 類別，需使用 Tailwind Token */
  backgroundColorClass?: string;
  /** 文字顏色 CSS 類別，需使用 Tailwind Token */
  textColorClass?: string;
}

interface CorporateIndexProps {
  config: CorporateIndexConfig;
}

const CorporateIndex: React.FC<CorporateIndexProps> = ({ config }) => {
  const { title, corporateId, displayMode, backgroundColorClass, textColorClass } = config;

  // 2. Dashtail UI 規範 (設計):
  //    - 顏色: 必須使用 Tailwind Token (如 `bg-primary-900`, `text-primary-900`)，嚴禁硬編碼色碼。
  //    - 結構: 如果是 Widget，確保外層有標準 Card 結構。
  //    - 拖曳: 確保支援 `.drag-handle` 類別。

  // 使用預設 Tailwind Token 顏色，如果配置中未提供
  const defaultBgClass = backgroundColorClass || 'bg-white dark:bg-gray-800';
  const defaultTextClass = textColorClass || 'text-gray-900 dark:text-gray-100';
  const headerBgClass = 'bg-primary-600 dark:bg-primary-700'; // 範例：使用 primary token
  const headerTextClass = 'text-white'; // 範例：使用 white text token

  return (
    // 標準 Card 結構，符合 Dashtail UI 規範
    <div className={`rounded-lg shadow-md ${defaultBgClass} p-0 overflow-hidden`}>
      {/* 拖曳區域，支援 .drag-handle 類別 */}
      <div className={`flex justify-between items-center p-4 ${headerBgClass} ${headerTextClass} .drag-handle`}>
        <h3 className="text-lg font-semibold">{title || '企業客戶資訊'}</h3>
        {/* Placeholder for actions or settings button */}
        <div>
          {/* 例如：<button className="text-white hover:text-gray-200">設定</button> */}
        </div>
      </div>

      {/* Widget 內容 */}
      <div className={`p-4 ${defaultTextClass}`}>
        <p>企業 ID: {corporateId || '未設定'}</p>
        <p>顯示模式: {displayMode || 'summary'}</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          這個元件現在是一個獨立的 Kintone Widget，資料透過配置 props 接收。
        </p>
        {/* 這裡可以根據 corporateId 和 displayMode 渲染實際的企業客戶資料 */}
        {/* 例如：
        {corporateId ? (
          <CorporateDetailView corporateId={corporateId} displayMode={displayMode} />
        ) : (
          <p>請在配置中設定企業 ID 以顯示內容。</p>
        )}
        */}
      </div>
    </div>
  );
};

// 匯出元件及其配置介面，以便 Kintone/Dashtail 可以發現並使用它
export { CorporateIndex, CorporateIndexConfig };