import { eventBus, Events } from '../events/eventBus';
import { auditLogger } from '../middleware/auditLogger';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationMetadata {
  [key: string]: unknown;
}

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
  metadata?: NotificationMetadata;
}

interface NotificationOptions {
  priority?: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: NotificationMetadata;
}

class NotificationService {
  private notifications: Notification[] = [];
  private readonly maxNotifications = 100;

  notify(
    type: NotificationType,
    title: string,
    message: string,
    options: NotificationOptions = {}
  ): Notification {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
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

    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    this.saveNotifications();
    eventBus.emit(Events.NOTIFICATION_RECEIVED, notification);

    auditLogger.log('VIEW', 'notification', {
      details: { type, title, priority: notification.priority },
    });

    return notification;
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach((n) => {
      n.read = true;
    });
    this.saveNotifications();
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveNotifications();
  }

  getAll(): Notification[] {
    return [...this.notifications];
  }

  getUnread(): Notification[] {
    return this.notifications.filter((n) => !n.read);
  }

  getUnreadCount(): number {
    return this.getUnread().length;
  }

  clear(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  init(): void {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const parsedNotifications = JSON.parse(stored) as Notification[];
        this.notifications = parsedNotifications;
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
notificationService.init();