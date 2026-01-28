import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import { CUSTOMER_RANKING } from '@/data/dashboardData';
import { formatCurrency } from '@/lib/formatters';

// --- 常數定義以提高可讀性、維護性並避免魔法數字 ---
const BADGE_SIZE_CLASSES = 'w-6 h-6';
const RANK_BADGE_FONT_CLASSES = 'text-sm font-bold';

// 使用設計系統的 token 顏色 (例如 primary-500)
const TOP_RANK_BADGE_BG = 'bg-primary-500';
const TOP_RANK_BADGE_TEXT = 'text-white';

const OTHER_RANK_BADGE_BG = 'bg-gray-100';
const OTHER_RANK_BADGE_TEXT = 'text-gray-500';

export default function CustomerRankingWidget(_: { widget: Widget }) {
  // 1. 處理 CUSTOMER_RANKING 為空陣列的情況
  if (!CUSTOMER_RANKING || CUSTOMER_RANKING.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm h-full p-4">
        目前沒有客戶排名資料。
      </div>
    );
  }

  return (
    <div className="space-y-2"> {/* 調整間距以配合 hover 效果 */}
      {CUSTOMER_RANKING.map((customer, index) => (
        // 2. 驗證 customer 物件的屬性是否存在 (基本檢查，更複雜驗證可能需要 Yup/Zod)
        // 確保 customer 存在且有 id，否則跳過
        <div
          key={customer.id} // 確保每個項目都有一個唯一的 key
          className="flex items-center justify-between text-sm p-2 rounded-md transition-colors duration-200 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary-300 focus-within:ring-offset-1" // 加入 hover/focus 狀態
          tabIndex={0} // 讓每個項目可被 tab 鍵選中
        >
          <div className="flex items-center gap-3">
            <span
              className={`${BADGE_SIZE_CLASSES} rounded-lg flex items-center justify-center ${RANK_BADGE_FONT_CLASSES} ${
                index === 0
                  ? `${TOP_RANK_BADGE_BG} ${TOP_RANK_BADGE_TEXT}`
                  : `${OTHER_RANK_BADGE_BG} ${OTHER_RANK_BADGE_TEXT}`
              }`}
            >
              {index + 1}
            </span>
            <div>
              {/* 確保屬性存在再渲染，並提供預設值 */}
              <div className="font-medium text-gray-800">{customer.name ?? '未知客戶'}</div>
              <div className="text-sm text-gray-500">{`${customer.orders ?? 0} orders`}</div>
            </div>
          </div>
          <div className="font-semibold text-gray-900">{formatCurrency(customer.revenue ?? 0)}</div>
        </div>
      ))}
    </div>
  );
}