/**
 * Notification Service - 通知服務
 * 
 * 支援：
 * - Browser Push Notifications (PWA)
 * - In-App Notifications
 * - Email Notifications (via API)
 */

// ==============================================
// Types
// ==============================================

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  tripReminders: boolean;
  priceAlerts: boolean;
  rfpUpdates: boolean;
  votingReminders: boolean;
}

// ==============================================
// Push Notification Setup
// ==============================================

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID public key not configured');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Send subscription to backend
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      
      // Notify backend
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
}

// ==============================================
// In-App Notifications
// ==============================================

const notificationListeners = new Set<(notification: Notification) => void>();

export function onNotification(callback: (notification: Notification) => void): () => void {
  notificationListeners.add(callback);
  return () => notificationListeners.delete(callback);
}

export function showNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
  const fullNotification: Notification = {
    ...notification,
    id: generateId(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  notificationListeners.forEach(listener => listener(fullNotification));

  // Also show browser notification if permitted
  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: fullNotification.id,
    });
  }

  return fullNotification;
}

// ==============================================
// Notification Templates
// ==============================================

export const NotificationTemplates = {
  tripReminder: (tripName: string, daysUntil: number) => ({
    type: 'info' as const,
    title: '行程提醒',
    message: `「${tripName}」將在 ${daysUntil} 天後出發，請確認準備事項。`,
  }),

  priceAlert: (tripName: string, priceDiff: number) => ({
    type: priceDiff < 0 ? 'success' as const : 'warning' as const,
    title: '價格變動',
    message: `「${tripName}」價格${priceDiff < 0 ? '下降' : '上漲'} ${Math.abs(priceDiff)} 元。`,
  }),

  rfpUpdate: (rfpTitle: string, status: string) => ({
    type: 'info' as const,
    title: 'RFP 狀態更新',
    message: `「${rfpTitle}」狀態已更新為：${status}`,
  }),

  votingDeadline: (votingTitle: string, hoursLeft: number) => ({
    type: 'warning' as const,
    title: '投票即將截止',
    message: `「${votingTitle}」將在 ${hoursLeft} 小時後截止，趕快投票！`,
  }),

  newSupplierWarning: (supplierName: string) => ({
    type: 'error' as const,
    title: '供應商警示',
    message: `新增反雷供應商：「${supplierName}」，請注意避免合作。`,
  }),
};

// ==============================================
// Email Notifications (via API)
// ==============================================

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

// ==============================================
// Utility Functions
// ==============================================

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// ==============================================
// Notification Preferences Storage
// ==============================================

const PREFERENCES_KEY = 'trvicerp_notification_preferences';

export function getNotificationPreferences(): NotificationPreferences {
  const stored = localStorage.getItem(PREFERENCES_KEY);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid JSON, return defaults
    }
  }

  return {
    pushEnabled: false,
    emailEnabled: true,
    tripReminders: true,
    priceAlerts: true,
    rfpUpdates: true,
    votingReminders: true,
  };
}

export function saveNotificationPreferences(preferences: NotificationPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export default {
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  onNotification,
  showNotification,
  sendEmailNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  NotificationTemplates,
};
