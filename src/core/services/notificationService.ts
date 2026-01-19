/**
 * 通知服務
 * Notification Service
 */

import { eventBus, Events } from '../events/eventBus';
import { auditLogger } from '../middleware/auditLogger';

/**
 * 通知類型
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * 通知優先級
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * 通知
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

/**
 * 通知服務
 */
class NotificationService {
  private notifications: Notification[] = [];
  private maxNotifications = 100;

  /**
   * 發送通知
   */
  notify(
    type: NotificationType,
    title: string,
    message: string,
    options: {
      priority?: NotificationPriority;
      actionUrl?: string;
      actionLabel?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Notification {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      priority: options.priority || 'normal',
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: options.actionUrl,
      actionLabel: options.actionLabel,
      metadata: options.metadata,
    };

    this.notifications.unshift(notification);

    // 限制通知數量
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // 保存到本地存儲
    this.saveNotifications();

    // 發送事件
    eventBus.emit(Events.NOTIFICATION_RECEIVED, notification);

    // 記錄審計日誌
    auditLogger.log('VIEW', 'notification', {
      details: { type, title, priority: notification.priority },
    });

    return notification;
  }

  /**
   * 標記為已讀
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  /**
   * 標記所有為已讀
   */
  markAllAsRead(): void {
    this.notifications.forEach((n) => {
      n.read = true;
    });
    this.saveNotifications();
  }

  /**
   * 刪除通知
   */
  remove(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveNotifications();
  }

  /**
   * 取得所有通知
   */
  getAll(): Notification[] {
    return [...this.notifications];
  }

  /**
   * 取得未讀通知
   */
  getUnread(): Notification[] {
    return this.notifications.filter((n) => !n.read);
  }

  /**
   * 取得未讀數量
   */
  getUnreadCount(): number {
    return this.getUnread().length;
  }

  /**
   * 清除所有通知
   */
  clear(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  /**
   * 保存通知到本地存儲
   */
  private saveNotifications(): void {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  /**
   * 從本地存儲載入通知
   */
  init(): void {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }
}

// 單例實例
export const notificationService = new NotificationService();

// 初始化
notificationService.init();
