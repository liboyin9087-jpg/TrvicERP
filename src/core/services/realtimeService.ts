/**
 * 即時通訊服務
 * Real-time Communication Service (WebSocket)
 */

type EventCallback = (data: any) => void;

/**
 * 通知類型
 */
export type NotificationType =
  | 'tour_update'      // 行程更新
  | 'emergency'        // 緊急通報
  | 'location_update'  // 位置更新
  | 'message'          // 訊息
  | 'announcement'     // 公告
  | 'status_change';   // 狀態變更

/**
 * 即時通知
 */
export interface RealtimeNotification {
  id: string;
  type: NotificationType;
  sessionId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  sender?: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
}

/**
 * 位置更新
 */
export interface LocationUpdate {
  sessionId: string;
  userId: string;
  userName: string;
  role: 'leader' | 'traveler';
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

/**
 * 即時服務狀態
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * 即時通訊服務
 */
export class RealtimeService {
  private static instance: RealtimeService | null = null;
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscribedSessions: Set<string> = new Set();

  private constructor() {}

  /**
   * 取得單例實例
   */
  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * 連接 WebSocket
   */
  connect(token?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[Realtime] Already connected');
      return;
    }

    const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

    if (useMock) {
      console.log('[Realtime Mock] 模擬連接成功');
      this.status = 'connected';
      this.emit('status_change', { status: 'connected' });
      this.startMockHeartbeat();
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api.example.com/ws';
    const url = token ? `${wsUrl}?token=${token}` : wsUrl;

    this.status = 'connecting';
    this.emit('status_change', { status: 'connecting' });

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[Realtime] Connected');
        this.status = 'connected';
        this.reconnectAttempts = 0;
        this.emit('status_change', { status: 'connected' });
        this.startHeartbeat();

        // 重新訂閱之前的 sessions
        this.subscribedSessions.forEach((sessionId) => {
          this.subscribeToSession(sessionId);
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error('[Realtime] Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[Realtime] Disconnected');
        this.status = 'disconnected';
        this.emit('status_change', { status: 'disconnected' });
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[Realtime] Error:', error);
        this.status = 'error';
        this.emit('status_change', { status: 'error' });
      };
    } catch (error) {
      console.error('[Realtime] Connection failed:', error);
      this.status = 'error';
      this.emit('status_change', { status: 'error' });
    }
  }

  /**
   * 斷開連接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    this.status = 'disconnected';
    this.emit('status_change', { status: 'disconnected' });
  }

  /**
   * 訂閱團次即時更新
   */
  subscribeToSession(sessionId: string): void {
    this.subscribedSessions.add(sessionId);

    const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
    if (useMock) {
      console.log(`[Realtime Mock] 訂閱團次: ${sessionId}`);
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'subscribe',
          channel: `session:${sessionId}`,
        })
      );
    }
  }

  /**
   * 取消訂閱團次
   */
  unsubscribeFromSession(sessionId: string): void {
    this.subscribedSessions.delete(sessionId);

    const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
    if (useMock) {
      console.log(`[Realtime Mock] 取消訂閱團次: ${sessionId}`);
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'unsubscribe',
          channel: `session:${sessionId}`,
        })
      );
    }
  }

  /**
   * 發送即時通知（領隊用）
   */
  sendNotification(notification: Omit<RealtimeNotification, 'id' | 'timestamp'>): void {
    const fullNotification: RealtimeNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
    if (useMock) {
      console.log('[Realtime Mock] 發送通知:', fullNotification);
      // 模擬接收自己發送的通知
      setTimeout(() => {
        this.emit('notification', fullNotification);
      }, 100);
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'notification',
          data: fullNotification,
        })
      );
    }
  }

  /**
   * 發送緊急通報
   */
  sendEmergency(sessionId: string, message: string, metadata?: Record<string, any>): void {
    this.sendNotification({
      type: 'emergency',
      sessionId,
      title: '緊急通報',
      message,
      severity: 'error',
      metadata,
    });
  }

  /**
   * 發送位置更新（領隊用）
   */
  sendLocationUpdate(location: Omit<LocationUpdate, 'timestamp'>): void {
    const update: LocationUpdate = {
      ...location,
      timestamp: new Date().toISOString(),
    };

    const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
    if (useMock) {
      console.log('[Realtime Mock] 發送位置更新:', update);
      this.emit('location_update', update);
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'location_update',
          data: update,
        })
      );
    }
  }

  /**
   * 發送公告
   */
  sendAnnouncement(sessionId: string, title: string, message: string): void {
    this.sendNotification({
      type: 'announcement',
      sessionId,
      title,
      message,
      severity: 'info',
    });
  }

  /**
   * 監聽事件
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * 移除事件監聽
   */
  off(event: string, callback: EventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * 取得連接狀態
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * 處理接收到的訊息
   */
  private handleMessage(data: any): void {
    const { type, ...payload } = data;

    switch (type) {
      case 'notification':
        this.emit('notification', payload.data);
        break;
      case 'location_update':
        this.emit('location_update', payload.data);
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        this.emit(type, payload);
    }
  }

  /**
   * 發射事件
   */
  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (e) {
        console.error(`[Realtime] Error in event handler for ${event}:`, e);
      }
    });
  }

  /**
   * 開始心跳
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  /**
   * Mock 心跳
   */
  private startMockHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      console.log('[Realtime Mock] Heartbeat');
    }, 30000);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 嘗試重新連接
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[Realtime] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[Realtime] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }
}

// 匯出單例
export const realtimeService = RealtimeService.getInstance();

export default RealtimeService;
