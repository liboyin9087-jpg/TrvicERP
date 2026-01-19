import { WebSocket } from 'ws';

type EventCallback<T = unknown> = (data: T) => void;

export type NotificationType =
  | 'tour_update'
  | 'emergency'
  | 'location_update'
  | 'message'
  | 'announcement'
  | 'status_change';

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
  metadata?: Record<string, unknown>;
}

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

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type WebSocketMessage = {
  type: string;
  data?: unknown;
  channel?: string;
};

export class RealtimeService {
  private static instance: RealtimeService | null = null;
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscribedSessions: Set<string> = new Set();

  private constructor() {}

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

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

        this.subscribedSessions.forEach((sessionId) => {
          this.subscribeToSession(sessionId);
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.toString()) as WebSocketMessage;
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

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    this.status = 'disconnected';
    this.emit('status_change', { status: 'disconnected' });
  }

  subscribeToSession(sessionId: string): void {
    this.subscribedSessions.add(sessionId);

    const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
    if (useMock) {
      console.log(`[Realtime Mock] 訂閱團次: ${sessionId}`);
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'subscribe',
        channel: `session:${sessionId}`
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  unsubscribeFromSession(sessionId: string): void {
    this.subscribedSessions.delete(sessionId);

    const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
    if (useMock) {
      console.log(`[Realtime Mock] 取消訂閱團次: ${sessionId}`);
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'unsubscribe',
        channel: `session:${sessionId}`
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  sendNotification(notification: Omit<RealtimeNotification, 'id' | 'timestamp'>): void {
    const fullNotification: RealtimeNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
    if (useMock) {
      console.log('[Realtime Mock] 發送通知:', fullNotification);
      setTimeout(() => {
        this.emit('notification', fullNotification);
      }, 100);
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'notification',
        data: fullNotification
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  sendEmergency(sessionId: string, message: string, metadata?: Record<string, unknown>): void {
    this.sendNotification({
      type: 'emergency',
      sessionId,
      title: '緊急通報',
      message,
      severity: 'error',
      metadata,
    });
  }

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
      const message: WebSocketMessage = {
        type: 'location_update',
        data: update
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  sendAnnouncement(sessionId: string, title: string, message: string): void {
    this.sendNotification({
      type: 'announcement',
      sessionId,
      title,
      message,
      severity: 'info',
    });
  }

  on<T>(event: string, callback: EventCallback<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback as EventCallback);
  }

  off<T>(event: string, callback: EventCallback<T>): void {
    this.eventListeners.get(event)?.delete(callback as EventCallback);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private handleMessage(data: WebSocketMessage): void {
    const { type, ...payload } = data;

    switch (type) {
      case 'notification':
        this.emit('notification', payload.data as RealtimeNotification);
        break;
      case 'location_update':
        this.emit('location_update', payload.data as LocationUpdate);
        break;
      case 'pong':
        break;
      default:
        this.emit(type, payload);
    }
  }

  private emit<T>(event: string, data: T): void {
    this.eventListeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (e) {
        console.error(`[Realtime] Error in event handler for ${event}:`, e);
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private startMockHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      console.log('[Realtime Mock] Heartbeat');
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

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

export const realtimeService = RealtimeService.getInstance();
export default RealtimeService;