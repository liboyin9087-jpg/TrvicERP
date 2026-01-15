/**
 * 訂單管理核心類型定義
 * Order Management Core Types
 */

/**
 * 訂單狀態
 */
export type OrderStatus =
  | 'draft'           // 草稿
  | 'pending'         // 待確認
  | 'confirmed'       // 已確認
  | 'paid'            // 已付款
  | 'in_progress'     // 進行中
  | 'completed'       // 已完成
  | 'cancelled'       // 已取消
  | 'refunded';       // 已退款

/**
 * 訂單狀態常數
 */
export const ORDER_STATUS = {
  DRAFT: 'draft' as const,
  PENDING: 'pending' as const,
  CONFIRMED: 'confirmed' as const,
  PAID: 'paid' as const,
  IN_PROGRESS: 'in_progress' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'cancelled' as const,
  REFUNDED: 'refunded' as const,
} as const;

/**
 * 訂單狀態轉換規則
 */
export interface OrderStateTransition {
  from: OrderStatus;
  to: OrderStatus;
  condition?: () => boolean;
  action?: () => void | Promise<void>;
}

/**
 * 訂單狀態機配置
 */
export const ORDER_STATE_MACHINE: Record<OrderStatus, OrderStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['paid', 'cancelled'],
  paid: ['in_progress', 'refunded'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // 終止狀態
  cancelled: [], // 終止狀態
  refunded: [], // 終止狀態
};

/**
 * 檢查狀態轉換是否有效
 */
export function isValidOrderTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  const allowedTransitions = ORDER_STATE_MACHINE[from];
  return allowedTransitions.includes(to);
}

/**
 * 訂單類型
 */
export interface Order {
  id: string;
  orderNumber: string;        // 訂單編號
  sessionId: string;          // 關聯的團次 ID
  quotationId?: string;        // 關聯的報價 ID
  customerId: string;          // 客戶 ID
  customerName: string;        // 客戶名稱
  status: OrderStatus;         // 訂單狀態
  totalAmount: number;         // 總金額
  paidAmount: number;          // 已付金額
  currency: string;            // 幣別
  createdAt: string;           // 建立時間
  updatedAt: string;           // 更新時間
  cancelledAt?: string;       // 取消時間
  cancelledReason?: string;   // 取消原因
  notes?: string;              // 備註
}

/**
 * 訂單建立資料
 */
export interface CreateOrderData {
  sessionId: string;
  quotationId?: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  currency?: string;
  notes?: string;
}

/**
 * 訂單更新資料
 */
export interface UpdateOrderData {
  status?: OrderStatus;
  totalAmount?: number;
  paidAmount?: number;
  notes?: string;
}

/**
 * 訂單取消資料
 */
export interface CancelOrderData {
  reason: string;
  refundAmount?: number;
}

/**
 * 訂單查詢條件
 */
export interface OrderQuery {
  status?: OrderStatus | OrderStatus[];
  customerId?: string;
  sessionId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}
