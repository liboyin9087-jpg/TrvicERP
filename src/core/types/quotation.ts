/**
 * 報價管理核心類型定義
 * Quotation Management Core Types
 */

/**
 * 報價狀態
 */
export type QuotationStatus =
  | 'draft'       // 草稿
  | 'sent'        // 已發送
  | 'accepted'    // 已接受
  | 'rejected'    // 已拒絕
  | 'expired';    // 已過期

/**
 * 報價狀態常數
 */
export const QUOTATION_STATUS = {
  DRAFT: 'draft' as const,
  SENT: 'sent' as const,
  ACCEPTED: 'accepted' as const,
  REJECTED: 'rejected' as const,
  EXPIRED: 'expired' as const,
} as const;

/**
 * 成本類型
 */
export type CostType = 'fixed' | 'per_pax';

/**
 * 報價項目
 */
export interface QuotationItem {
  id: string;
  category: string;           // 類別（機票、住宿、交通等）
  name: string;                // 項目名稱
  costType: CostType;          // 成本類型
  unitCost: number;            // 單價
  quantity?: number;           // 數量（固定成本時為 1）
  currency: string;             // 幣別
  description?: string;        // 說明
}

/**
 * 成本明細
 */
export interface CostBreakdown {
  fixed: number;               // 固定成本總額
  variable: number;            // 變動成本（每人）
  total: number;               // 總成本
  currency: string;           // 幣別
}

/**
 * 報價
 */
export interface Quotation {
  id: string;
  quotationNumber: string;     // 報價單號
  version: number;              // 版本號
  customerId: string;           // 客戶 ID
  customerName: string;        // 客戶名稱
  sessionId?: string;          // 關聯的團次 ID
  items: QuotationItem[];      // 報價項目
  costBreakdown: CostBreakdown; // 成本明細
  profitMargin: number;         // 利潤率（百分比）
  sellingPrice: number;        // 售價（每人）
  paxCount: number;             // 人數
  totalAmount: number;          // 總金額
  currency: string;             // 幣別
  validUntil: string;          // 有效期限
  status: QuotationStatus;      // 狀態
  convertedToOrderId?: string; // 轉換為訂單的 ID
  notes?: string;               // 備註
  createdAt: string;            // 建立時間
  updatedAt: string;            // 更新時間
  createdBy: string;            // 建立者 ID
}

/**
 * 報價建立資料
 */
export interface CreateQuotationData {
  customerId: string;
  customerName: string;
  sessionId?: string;
  items: QuotationItem[];
  profitMargin: number;
  paxCount: number;
  validDays?: number;          // 有效天數（預設 30 天）
  currency?: string;
  notes?: string;
}

/**
 * 報價更新資料
 */
export interface UpdateQuotationData {
  items?: QuotationItem[];
  profitMargin?: number;
  paxCount?: number;
  validUntil?: string;
  notes?: string;
  // 計算欄位（由服務層自動計算）
  costBreakdown?: CostBreakdown;
  sellingPrice?: number;
  totalAmount?: number;
}

/**
 * 報價轉訂單資料
 */
export interface ConvertQuotationToOrderData {
  orderNumber?: string;        // 訂單編號（可選，系統自動生成）
  notes?: string;
}

/**
 * 計算報價成本
 */
export function calculateQuotationCost(
  items: QuotationItem[],
  paxCount: number
): CostBreakdown {
  let fixed = 0;
  let variable = 0;

  items.forEach(item => {
    if (item.costType === 'fixed') {
      fixed += item.unitCost * (item.quantity || 1);
    } else {
      variable += item.unitCost;
    }
  });

  const total = fixed + variable * paxCount;

  return {
    fixed,
    variable,
    total,
    currency: items[0]?.currency || 'TWD',
  };
}

/**
 * 計算報價售價
 */
export function calculateSellingPrice(
  totalCost: number,
  profitMargin: number
): number {
  return Math.round(totalCost * (1 + profitMargin / 100));
}

/**
 * 檢查報價是否過期
 */
export function isQuotationExpired(validUntil: string): boolean {
  return new Date(validUntil) < new Date();
}
