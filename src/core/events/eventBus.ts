/**
 * 事件總線系統
 * Event Bus System - 用於跨模組通信
 */

/**
 * 事件類型
 */
export type EventType = string | symbol;

/**
 * 事件處理函數
 */
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * 事件訂閱選項
 */
export interface SubscribeOptions {
  once?: boolean; // 只執行一次
  priority?: number; // 優先級，數字越大越先執行
}

/**
 * 事件訂閱
 */
interface EventSubscription {
  handler: EventHandler;
  once: boolean;
  priority: number;
  id: string;
}

/**
 * 事件總線
 */
class EventBus {
  private events: Map<EventType, EventSubscription[]> = new Map();
  private subscriptionId = 0;

  /**
   * 訂閱事件
   */
  on<T = any>(
    event: EventType,
    handler: EventHandler<T>,
    options: SubscribeOptions = {}
  ): () => void {
    const subscription: EventSubscription = {
      handler,
      once: options.once || false,
      priority: options.priority || 0,
      id: `sub_${++this.subscriptionId}`,
    };

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const subscriptions = this.events.get(event)!;
    subscriptions.push(subscription);

    // 按優先級排序
    subscriptions.sort((a, b) => b.priority - a.priority);

    // 返回取消訂閱函數
    return () => {
      this.off(event, subscription.id);
    };
  }

  /**
   * 訂閱事件（只執行一次）
   */
  once<T = any>(
    event: EventType,
    handler: EventHandler<T>,
    priority?: number
  ): () => void {
    return this.on(event, handler, { once: true, priority });
  }

  /**
   * 取消訂閱
   */
  off(event: EventType, handlerOrId?: EventHandler | string): void {
    const subscriptions = this.events.get(event);
    if (!subscriptions) return;

    if (!handlerOrId) {
      // 取消所有訂閱
      this.events.delete(event);
      return;
    }

    // 移除指定的訂閱
    const index = subscriptions.findIndex(
      (sub) =>
        sub.handler === handlerOrId || sub.id === handlerOrId
    );
    if (index > -1) {
      subscriptions.splice(index, 1);
      if (subscriptions.length === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * 發送事件
   */
  async emit<T = any>(event: EventType, data?: T): Promise<void> {
    const subscriptions = this.events.get(event);
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    // 複製訂閱列表以避免在執行過程中修改
    const subscriptionsToExecute = [...subscriptions];

    // 執行所有處理函數
    for (const subscription of subscriptionsToExecute) {
      try {
        await subscription.handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error);
      }

      // 如果是一次性訂閱，移除它
      if (subscription.once) {
        this.off(event, subscription.id);
      }
    }
  }

  /**
   * 清除所有事件
   */
  clear(): void {
    this.events.clear();
  }

  /**
   * 取得事件訂閱數量
   */
  listenerCount(event: EventType): number {
    return this.events.get(event)?.length || 0;
  }

  /**
   * 取得所有事件類型
   */
  eventNames(): EventType[] {
    return Array.from(this.events.keys());
  }
}

// 單例實例
export const eventBus = new EventBus();

/**
 * 預定義事件類型
 */
export const Events = {
  // 認證相關
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_TOKEN_REFRESHED: 'auth:token_refreshed',

  // 訂單相關
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_DELETED: 'order:deleted',
  ORDER_STATUS_CHANGED: 'order:status_changed',

  // 報價相關
  QUOTATION_CREATED: 'quotation:created',
  QUOTATION_UPDATED: 'quotation:updated',
  QUOTATION_CONVERTED: 'quotation:converted',

  // 團次相關
  SESSION_CREATED: 'session:created',
  SESSION_UPDATED: 'session:updated',
  SESSION_STATUS_CHANGED: 'session:status_changed',

  // 客戶相關
  CUSTOMER_CREATED: 'customer:created',
  CUSTOMER_UPDATED: 'customer:updated',

  // 通知相關
  NOTIFICATION_RECEIVED: 'notification:received',
  TOAST_SHOW: 'toast:show',

  // 數據同步相關
  DATA_SYNC_STARTED: 'data:sync_started',
  DATA_SYNC_COMPLETED: 'data:sync_completed',
  DATA_SYNC_FAILED: 'data:sync_failed',

  // 離線相關
  OFFLINE_MODE_ENABLED: 'offline:enabled',
  OFFLINE_MODE_DISABLED: 'offline:disabled',
} as const;
