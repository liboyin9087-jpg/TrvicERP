/**
 * 訂單管理核心類型定義
 * Order Management Core Types
 */

/**
 * 訂單狀態定義。
 * 描述訂單從建立到完成或取消的整個生命週期階段。
 *
 * @example
 * // 訂單生命週期通常流程:
 * // draft -> pending -> confirmed -> paid -> in_progress -> completed
 * // 任何階段都可能進入 'cancelled' 或 'refunded' (從 'paid' 之後)
 *
 * @enum {string} OrderStatus
 * @property {'draft'} draft - 草稿狀態。訂單已建立但尚未提交或確認，可隨時修改或取消。
 * @property {'pending'} pending - 待確認狀態。訂單已提交，等待客戶或內部人員確認。在此狀態下，訂單內容通常不應再修改。
 * @property {'confirmed'} confirmed - 已確認狀態。訂單內容已被最終確認，等待付款。
 * @property {'paid'} paid - 已付款狀態。訂單費用已全數或部分支付。此後訂單通常會進入服務履行階段。
 * @property {'in_progress'} in_progress - 進行中狀態。服務或商品正在準備或交付中。
 * @property {'completed'} completed - 已完成狀態。服務或商品已交付且訂單流程結束。
 * @property {'cancelled'} cancelled - 已取消狀態。訂單在任何階段被取消。取消後的訂單通常不可恢復。
 * @property {'refunded'} refunded - 已退款狀態。訂單已付款後因故進行退款。此狀態通常發生在 'paid' 或 'in_progress' 之後。
 */
export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

/**
 * 訂單狀態常數
 * 提供類型安全的字串常數，用於方便的比較和使用。
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
 * 訂單類型
 * 定義了訂單實體的完整結構和屬性。
 */
export interface Order {
  id: string;
  orderNumber: string;        // 訂單編號
  sessionId: string;          // 關聯的團次 ID
  quotationId?: string;       // 關聯的報價 ID
  customerId: string;         // 客戶 ID
  customerName: string;       // 客戶名稱
  status: OrderStatus;        // 訂單狀態
  totalAmount: number;        // 總金額
  paidAmount: number;         // 已付金額
  currency: string;           // 幣別
  createdAt: string;          // 建立時間
  updatedAt: string;          // 更新時間
  cancelledAt?: string;       // 取消時間
  cancelledReason?: string;   // 取消原因
  notes?: string;             // 備註
}

/**
 * 描述從一個訂單狀態到另一個訂單狀態的具體轉換規則。
 * 包含目標狀態、執行轉換所需滿足的條件以及轉換成功後執行的動作。
 */
export interface OrderTransitionRule {
  /** 目標訂單狀態 */
  to: OrderStatus;
  /**
   * 轉換的描述。
   * @example '提交草稿', '確認訂單', '取消訂單'
   */
  description: string;
  /**
   * 執行此轉換的先決條件。
   * 如果未提供，則表示無特定條件 (或條件恆為真)。
   * @param order - 當前訂單實例。
   * @returns 如果條件滿足則為 true，否則為 false。
   */
  condition?: (order: Order) => boolean;
  /**
   * 轉換成功後執行的動作。
   * 此動作在轉換成功後執行，通常用於觸發副作用，例如發送通知、更新庫存等。
   * @param order - 當前訂單實例。
   * @returns 可以是同步或異步操作。
   */
  action?: (order: Order) => void | Promise<void>;
}

/**
 * 訂單狀態機配置。
 * 定義了從每個狀態可以轉換到的所有可能狀態，以及轉換所需的條件和動作。
 * 每個鍵代表一個起始狀態，其值是一個 OrderTransitionRule 數組，描述了所有可能的出站轉換。
 */
export const ORDER_STATE_MACHINE: Record<OrderStatus, OrderTransitionRule[]> = {
  draft: [
    {
      to: 'pending',
      description: '提交草稿訂單，進入待確認',
      condition: (order) => order.totalAmount > 0, // 範例條件：總金額必須大於0
    },
    {
      to: 'cancelled',
      description: '取消草稿訂單',
    },
  ],
  pending: [
    {
      to: 'confirmed',
      description: '確認訂單內容，等待付款',
      condition: (order) => !!order.customerId && !!order.customerName, // 範例條件：客戶資訊完整
    },
    {
      to: 'cancelled',
      description: '取消待確認訂單',
    },
  ],
  confirmed: [
    {
      to: 'paid',
      description: '標記為已付款',
      condition: (order) => order.paidAmount === order.totalAmount && order.totalAmount > 0, // 範例條件：已付金額等於總金額且總金額大於0
    },
    {
      to: 'cancelled',
      description: '取消已確認訂單',
    },
  ],
  paid: [
    {
      to: 'in_progress',
      description: '開始進行服務或商品準備',
    },
    {
      to: 'refunded',
      description: '進行退款處理',
      // action: async (order) => { /* 例如：觸發退款流程 */ },
    },
    {
      to: 'cancelled',
      description: '取消已付款訂單 (可能需搭配退款處理)',
      // action: async (order) => { /* 例如：發送取消通知 */ },
    },
  ],
  in_progress: [
    {
      to: 'completed',
      description: '完成服務或商品交付',
    },
    {
      to: 'cancelled',
      description: '取消進行中訂單',
      // action: async (order) => { /* 例如：停止服務、處理部分退款 */ },
    },
  ],
  completed: [], // 終止狀態，通常不再有出站轉換
  cancelled: [], // 終止狀態，通常不再有出站轉換
  refunded: [], // 終止狀態，通常不再有出站轉換
};

/**
 * 檢查訂單狀態轉換是否有效。
 * 評估從一個狀態到另一個狀態的轉換是否在狀態機中被允許，並檢查所有定義的條件。
 *
 * @param order - 要檢查轉換的訂單實例。用於評估轉換條件。
 * @param from - 當前訂單狀態。
 * @param to - 目標訂單狀態。
 * @returns 如果轉換有效且條件滿足則為 true，否則為 false。
 */
export function isValidOrderTransition(
  order: Order,
  from: OrderStatus,
  to: OrderStatus
): boolean {
  const possibleTransitions = ORDER_STATE_MACHINE[from];
  if (!possibleTransitions) {
    return false; // 沒有定義從此 'from' 狀態的出站轉換
  }

  // 檢查是否存在從 'from' 到 'to' 的有效轉換規則，並且其條件（如果存在）被滿足。
  return possibleTransitions.some(
    (transition) =>
      transition.to === to && (!transition.condition || transition.condition(order))
  );
}

/**
 * 執行訂單狀態轉換。
 * 此函數負責尋找有效的轉換規則，評估其條件，並在滿足時執行相應的動作。
 *
 * 注意：此函數僅執行轉換規則中定義的副作用 (action)。
 * 訂單實例 `order.status` 的實際更新和持久化通常在調用此函數的服務層中進行。
 *
 * @param order - 要執行轉換的訂單實例。
 * @param from - 當前訂單狀態。
 * @param to - 目標訂單狀態。
 * @returns Promise<void> - 成功執行轉換和動作後解析。如果轉換無效或條件不滿足，則拒絕。
 * @throws {Error} 如果轉換無效或條件不滿足。
 */
export async function executeOrderTransition(
  order: Order,
  from: OrderStatus,
  to: OrderStatus
): Promise<void> {
  const possibleTransitions = ORDER_STATE_MACHINE[from];
  if (!possibleTransitions) {
    throw new Error(`State machine error: No transitions defined from state: ${from}`);
  }

  const validTransition = possibleTransitions.find(
    (transition) =>
      transition.to === to && (!transition.condition || transition.condition(order))
  );

  if (!validTransition) {
    throw new Error(
      `Invalid transition attempt for order ${order.id}: Cannot transition from ${from} to ${to} or conditions not met.`
    );
  }

  if (validTransition.action) {
    await validTransition.action(order);
  }
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