/**
 * WebSocket 實時通信服務
 * Real-time communication service for TrvicERP
 */

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
  session_id?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

export type MessageHandler = (message: WebSocketMessage) => void;

/**
 * WebSocket 連線管理器
 * Handles WebSocket connection lifecycle and message routing
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private heartbeatTimeoutTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 3000,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      heartbeatTimeout: config.heartbeatTimeout ?? 5000,
    };
  }

  /**
   * 連接到 WebSocket 服務器
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isIntentionallyClosed = false;
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected to', this.config.url);
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', event.data, error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Connection error:', error);
          this.emit('error', { error });
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Connection closed');
          this.stopHeartbeat();
          this.emit('disconnected');

          if (!this.isIntentionallyClosed && this.reconnectAttempts < this.config.reconnectAttempts) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('[WebSocket] Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * 嘗試重新連接
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay * this.reconnectAttempts;
    console.log(`[WebSocket] Attempting to reconnect (${this.reconnectAttempts}/${this.config.reconnectAttempts}) in ${delay}ms...`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * 斷開連接
   */
  public disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 發送消息
   */
  public send(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] WebSocket is not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        ...message,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
    }
  }

  /**
   * 訂閱特定類型的消息
   */
  public on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)!.add(handler);

    // 返回取消訂閱函數
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  /**
   * 一次性訂閱消息
   */
  public once(type: string, handler: MessageHandler): () => void {
    const wrappedHandler = (message: WebSocketMessage) => {
      handler(message);
      unsubscribe();
    };

    const unsubscribe = this.on(type, wrappedHandler);
    return unsubscribe;
  }

  /**
   * 取消訂閱所有特定類型的消息
   */
  public off(type: string): void {
    this.messageHandlers.delete(type);
  }

  /**
   * 處理接收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    // 處理心跳
    if (message.type === 'ping') {
      this.send({ type: 'pong' });
      this.resetHeartbeatTimeout();
      return;
    }

    if (message.type === 'pong') {
      this.resetHeartbeatTimeout();
      return;
    }

    // 分發給訂閱者
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`[WebSocket] Error in message handler for type "${message.type}":`, error);
        }
      });
    }

    // 分發給通用訊號器
    const wildcard = this.messageHandlers.get('*');
    if (wildcard) {
      wildcard.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WebSocket] Error in wildcard message handler:', error);
        }
      });
    }
  }

  /**
   * 啟動心跳
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
      this.startHeartbeatTimeout();
    }, this.config.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.resetHeartbeatTimeout();
  }

  /**
   * 啟動心跳超時檢查
   */
  private startHeartbeatTimeout(): void {
    this.heartbeatTimeoutTimer = setTimeout(() => {
      console.warn('[WebSocket] Heartbeat timeout, reconnecting...');
      this.disconnect();
      this.connect().catch(() => {
        console.error('[WebSocket] Failed to reconnect after heartbeat timeout');
      });
    }, this.config.heartbeatTimeout);
  }

  /**
   * 重置心跳超時
   */
  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  /**
   * 廣播事件給內部訂閱者（用於連接狀態變更）
   */
  private emit(type: string, data?: any): void {
    this.handleMessage({ type, data });
  }

  /**
   * 取得連接狀態
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 銷毀實例
   */
  public destroy(): void {
    this.disconnect();
    this.messageHandlers.clear();
  }
}

/**
 * 全局 WebSocket 管理器實例
 */
let wsManager: WebSocketManager | null = null;

/**
 * 初始化全局 WebSocket 連接
 */
export function initializeWebSocket(url: string, config?: Partial<WebSocketConfig>): WebSocketManager {
  if (wsManager) {
    console.warn('[WebSocket] WebSocket manager already initialized');
    return wsManager;
  }

  wsManager = new WebSocketManager({
    url,
    ...config,
  });

  return wsManager;
}

/**
 * 取得全局 WebSocket 管理器
 */
export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}

/**
 * 銷毀全局 WebSocket 連接
 */
export function destroyWebSocket(): void {
  if (wsManager) {
    wsManager.destroy();
    wsManager = null;
  }
}

/**
 * WebSocket 連接狀態 Hook（React）
 */
export function useWebSocket(url: string, config?: Partial<WebSocketConfig>) {
  const [isConnected, setIsConnected] = React.useState(false);
  const managerRef = React.useRef<WebSocketManager | null>(null);

  React.useEffect(() => {
    const manager = new WebSocketManager({
      url,
      ...config,
    });

    managerRef.current = manager;

    const unsubscribeConnected = manager.on('connected', () => {
      setIsConnected(true);
    });

    const unsubscribeDisconnected = manager.on('disconnected', () => {
      setIsConnected(false);
    });

    manager.connect().catch((error) => {
      console.error('[WebSocket] Failed to connect:', error);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      manager.disconnect();
    };
  }, [url, config]);

  return {
    isConnected,
    manager: managerRef.current,
    send: (message: WebSocketMessage) => managerRef.current?.send(message),
    on: (type: string, handler: MessageHandler) => managerRef.current?.on(type, handler),
    once: (type: string, handler: MessageHandler) => managerRef.current?.once(type, handler),
  };
}

// 需要導入 React
import React from 'react';
