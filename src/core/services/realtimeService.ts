/**
 * 即時通訊服務
 * Real-time Communication Service (WebSocket)
 */

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
 * 內部 WebSocket 訊息類型
 * 定義從 WebSocket 接收和發送的通用訊息結構
 */
interface WebSocketMessage<T = any> {
  type: string;
  channel?: string; // 用於訂閱/取消訂閱
  data?: T;         // 實際的資料 payload
  // 根據後端協定，可能還需要額外的欄位
}

/**
 * 定義 RealtimeService 可能發射的所有事件及其數據類型。
 * 提高了事件處理的類型安全。
 */
export interface RealtimeEventsMap {
  'status_change': { status: ConnectionStatus };
  'notification': RealtimeNotification;
  'location_update': LocationUpdate;
  'error': { message: string; originalError?: Event | Error | CloseEvent };
  'heartbeat_sent': { timestamp: string }; // 當發送 ping 時
  'heartbeat_received': { timestamp: string }; // 當收到 pong 時
  [key: string]: any; // 如果有未明確定義的事件類型，則允許任意數據
}

/**
 * RealtimeService 的配置接口。
 * 移除了直接對 `import.meta.env` 的依賴，使得服務的配置更加靈活，易於測試。
 */
export interface RealtimeServiceConfig {
  wsUrl: string;
  useMock: boolean;
  reconnectMaxAttempts: number;
  reconnectInitialDelayMs: number; // 初始重連延遲（毫秒）
  reconnectMaxDelayMs: number;    // 最大重連延遲（毫秒）
  heartbeatIntervalMs: number;    // 心跳間隔（毫秒），0 表示禁用
}

/**
 * 抽象 WebSocket 客戶端接口。
 * 用於分離實際 WebSocket 通訊和模擬邏輯，符合單一職責原則。
 * 方便測試和替換底層通訊實現。
 */
interface IRealtimeClient {
  connect(url: string, token?: string): void;
  disconnect(): void;
  send(message: string): void;
  getReadyState(): number; // 返回 WebSocket.readyState (0:CONNECTING, 1:OPEN, 2:CLOSING, 3:CLOSED)

  onOpen(callback: () => void): void;
  onMessage(callback: (event: MessageEvent) => void): void;
  onClose(callback: (event: CloseEvent) => void): void;
  onError(callback: (event: Event) => void): void;
}

/**
 * 實際 WebSocket 客戶端實現。
 * 封裝了瀏覽器的 `WebSocket` API。
 */
class WebSocketClient implements IRealtimeClient {
  private ws: WebSocket | null = null;
  private openCallback: (() => void) | null = null;
  private messageCallback: ((event: MessageEvent) => void) | null = null;
  private closeCallback: ((event: CloseEvent) => void) | null = null;
  private errorCallback: ((event: Event) => void) | null = null;

  connect(baseUrl: string, token?: string): void {
    const url = token ? `${baseUrl}?token=${token}` : baseUrl;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.warn('[WebSocketClient] WebSocket is already connected or connecting. Disconnecting current.');
      this.disconnect();
    }
    this.ws = new WebSocket(url);

    this.ws.onopen = () => { this.openCallback?.(); };
    this.ws.onmessage = (event) => { this.messageCallback?.(event); };
    this.ws.onclose = (event) => { this.closeCallback?.(event); };
    this.ws.onerror = (event) => { this.errorCallback?.(event); };
  }

  disconnect(): void {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close(1000, 'Explicit disconnect'); // 使用標準代碼 1000 表示正常關閉
      this.ws = null;
    }
  }

  send(message: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.warn('[WebSocketClient] Attempted to send message while WebSocket is not open:', message);
    }
  }

  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  onOpen(callback: () => void): void { this.openCallback = callback; }
  onMessage(callback: (event: MessageEvent) => void): void { this.messageCallback = callback; }
  onClose(callback: (event: CloseEvent) => void): void { this.closeCallback = callback; }
  onError(callback: (event: Event) => void): void { this.errorCallback = callback; }
}

/**
 * 模擬 WebSocket 客戶端實現。
 * 用於開發、測試或無網路環境。
 */
class MockWebSocketClient implements IRealtimeClient {
  private readyState: number = WebSocket.CLOSED;
  private openCallback: (() => void) | null = null;
  private messageCallback: ((event: MessageEvent) => void) | null = null;
  private closeCallback: ((event: CloseEvent) => void) | null = null;
  private errorCallback: ((event: Event) => void) | null = null;
  private mockMessageInterval: NodeJS.Timeout | null = null;
  private mockHeartbeatInterval: NodeJS.Timeout | null = null;

  connect(baseUrl: string, token?: string): void {
    console.log(`[Realtime Mock] Simulating connection to ${baseUrl} with token: ${token ? 'yes' : 'no'}`);
    this.readyState = WebSocket.CONNECTING;
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      console.log('[Realtime Mock] Mock connection opened.');
      this.openCallback?.();
      this.startMockMessageGenerator();
      this.startMockHeartbeatResponder();
    }, 500); // Simulate connection delay
  }

  disconnect(): void {
    console.log('[Realtime Mock] Mock connection closed.');
    this.readyState = WebSocket.CLOSED;
    this.closeCallback?.(new CloseEvent('close', { wasClean: true, code: 1000, reason: 'Mock disconnect' }));
    if (this.mockMessageInterval) clearInterval(this.mockMessageInterval);
    if (this.mockHeartbeatInterval) clearInterval(this.mockHeartbeatInterval);
    this.mockMessageInterval = null;
    this.mockHeartbeatInterval = null;
  }

  send(message: string): void {
    if (this.readyState === WebSocket.OPEN) {
      const parsed = JSON.parse(message) as WebSocketMessage;
      console.log('[Realtime Mock] Mock message sent:', parsed);
      // 模擬某些發送行為的回應或內部處理
      if (parsed.type === 'subscribe') {
        console.log(`[Realtime Mock] Subscribed to channel: ${parsed.channel}`);
      } else if (parsed.type === 'notification' && parsed.data) {
        // 模擬接收自己發送的通知
        setTimeout(() => {
          this.messageCallback?.(new MessageEvent('message', { data: JSON.stringify({ type: 'notification', data: parsed.data }) }));
        }, 50);
      } else if (parsed.type === 'ping') {
        // 模擬 pong 回應
        setTimeout(() => {
          this.messageCallback?.(new MessageEvent('message', { data: JSON.stringify({ type: 'pong' }) }));
        }, 100);
      }
    } else {
      console.warn('[Realtime Mock] Attempted to send message while mock WebSocket is not open.');
    }
  }

  getReadyState(): number {
    return this.readyState;
  }

  onOpen(callback: () => void): void { this.openCallback = callback; }
  onMessage(callback: (event: MessageEvent) => void): void { this.messageCallback = callback; }
  onClose(callback: (event: CloseEvent) => void): void { this.closeCallback = callback; }
  onError(callback: (event: Event) => void): void { this.errorCallback = callback; }

  private startMockMessageGenerator(): void {
    if (this.mockMessageInterval) clearInterval(this.mockMessageInterval);
    this.mockMessageInterval = setInterval(() => {
      if (this.readyState === WebSocket.OPEN) {
        // 模擬一個通知
        const randomType: NotificationType = ['tour_update', 'emergency', 'location_update', 'message', 'announcement'][Math.floor(Math.random() * 5)] as NotificationType;
        const mockNotification: RealtimeNotification = {
          id: `mock_notif_${Date.now()}`,
          type: randomType,
          sessionId: 'mock_session_123',
          title: `Mock ${randomType} Title`,
          message: `這是來自模擬服務器的一個隨機 ${randomType} 訊息，時間: ${new Date().toLocaleTimeString()}`,
          severity: 'info',
          timestamp: new Date().toISOString(),
          sender: { id: 'mock_system', name: 'Mock System', role: 'system' }
        };
        this.messageCallback?.(new MessageEvent('message', { data: JSON.stringify({ type: 'notification', data: mockNotification }) }));
      }
    }, 15000); // 每 15 秒發送一個模擬通知
  }

  private startMockHeartbeatResponder(): void {
    if (this.mockHeartbeatInterval) clearInterval(this.mockHeartbeatInterval);
    // 模擬後端主動發送 ping 或回應 pong
    this.mockHeartbeatInterval = setInterval(() => {
      if (this.readyState === WebSocket.OPEN) {
        // 模擬服務端主動發送 ping
        this.messageCallback?.(new MessageEvent('message', { data: JSON.stringify({ type: 'ping' }) }));
      }
    }, 30000); // 每 30 秒模擬一個心跳
  }
}

/**
 * 泛型事件回調類型，確保事件數據類型正確。
 */
type EventCallback<K extends keyof RealtimeEventsMap> = (data: RealtimeEventsMap[K]) => void;

/**
 * 即時通訊服務類。
 *
 * 核心改進點:
 * 1.  **移除單例模式**: `RealtimeService` 現在是一個普通的類，可以按需實例化。
 *     這提高了模組的獨立性、測試性，並避免了全局狀態問題。
 * 2.  **配置注入**: 透過建構子接收 `RealtimeServiceConfig`，將 WebSocket URL、
 *     模擬開關、重連策略等配置從程式碼中解耦，增加了靈活性。
 * 3.  **分離 WebSocket 與模擬邏輯 (SRP)**: 引入 `IRealtimeClient` 接口，
 *     並實現 `WebSocketClient` 和 `MockWebSocketClient`。`RealtimeService` 依賴這個接口，
 *     實現了職責分離，並允許輕鬆切換真實與模擬環境。
 * 4.  **類型安全事件處理**: `RealtimeEventsMap` 確保了 `on` 和 `emit` 方法
 *     在處理不同事件時，其數據類型是強類型檢查的。
 * 5.  **增強重連邏輯**: 實現了帶有指數退避機制的重連策略，更穩定地處理網路波動。
 * 6.  **全面錯誤處理**: 覆蓋了 WebSocket 的 `onopen`, `onmessage`, `onclose`, `onerror`
 *     所有事件，並提供更詳細的日誌和錯誤事件發射。
 * 7.  **生命週期管理**: 提供明確的 `connect` 和 `disconnect` 方法，方便在應用層管理服務的生命週期。
 */
export class RealtimeService {
  private client: IRealtimeClient;
  private config: RealtimeServiceConfig;
  private status: ConnectionStatus = 'disconnected';
  // 使用 Map 儲存事件監聽器，key 為事件名稱，value 為一個 Set 包含所有回調函數
  private eventListeners: Map<keyof RealtimeEventsMap, Set<EventCallback<any>>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscribedSessions: Set<string> = new Set();
  private lastConnectToken: string | undefined; // 保存上次連接時使用的 token

  /**
   * 構造函數，初始化 RealtimeService。
   * @param config RealtimeService 的配置。
   * @param client 可選的 IRealtimeClient 實例，用於依賴注入（例如測試時注入 MockWebSocketClient）。
   */
  constructor(config: RealtimeServiceConfig, client?: IRealtimeClient) {
    this.config = config;
    // 根據配置或注入的 client 選擇實際的 WebSocket 實現
    this.client = client || (this.config.useMock ? new MockWebSocketClient() : new WebSocketClient());
    this.setupClientListeners();
  }

  /**
   * 設定內部 WebSocket 客戶端的事件監聽器，將其橋接到 RealtimeService 的處理邏輯。
   */
  private setupClientListeners(): void {
    this.client.onOpen(() => this.handleOpen());
    this.client.onMessage((event) => this.handleMessage(event.data));
    this.client.onClose((event) => this.handleClose(event));
    this.client.onError((event) => this.handleError(event));
  }

  /**
   * 連接 WebSocket 服務。
   * @param token 可選的認證 token。
   */
  connect(token?: string): void {
    if (this.client.getReadyState() === WebSocket.OPEN || this.client.getReadyState() === WebSocket.CONNECTING) {
      console.log('[RealtimeService] Already connected or connecting. Skipping connection attempt.');
      return;
    }

    // 清除任何掛起的重連計時器
    this.stopReconnectTimeout();

    this.setStatus('connecting');
    console.log(`[RealtimeService] Attempting to connect to ${this.config.wsUrl}...`);
    this.lastConnectToken = token; // 保存 token 以便重連時使用

    try {
      this.client.connect(this.config.wsUrl, token);
    } catch (error) {
      console.error('[RealtimeService] Connection initiation failed:', error);
      this.setStatus('error');
      this.emit('error', { message: 'WebSocket connection initiation failed', originalError: error as Error });
      this.attemptReconnect(token); // 即使初始化連接失敗也嘗試重連
    }
  }

  /**
   * 斷開 WebSocket 連接。
   */
  disconnect(): void {
    if (this.client.getReadyState() === WebSocket.CLOSED) {
      console.log('[RealtimeService] Already disconnected. No action needed.');
      return;
    }
    console.log('[RealtimeService] Disconnecting...');
    this.client.disconnect(); // 這將觸發 onclose 事件
    this.stopHeartbeat();
    this.stopReconnectTimeout(); // 清除任何重連計時器
    this.setStatus('disconnected');
    this.reconnectAttempts = 0; // 顯式斷開連接時重置重連嘗試次數
  }

  /**
   * 訂閱團次即時更新。
   * @param sessionId 要訂閱的團次 ID。
   */
  subscribeToSession(sessionId: string): void {
    this.subscribedSessions.add(sessionId);

    if (this.client.getReadyState() === WebSocket.OPEN) {
      this.client.send(
        JSON.stringify({
          type: 'subscribe',
          channel: `session:${sessionId}`,
        } as WebSocketMessage)
      );
      console.log(`[RealtimeService] Subscribed to session: ${sessionId}`);
    } else {
      console.warn(`[RealtimeService] Not connected, session ${sessionId} will be subscribed on successful reconnect.`);
    }
  }

  /**
   * 取消訂閱團次。
   * @param sessionId 要取消訂閱的團次 ID。
   */
  unsubscribeFromSession(sessionId: string): void {
    this.subscribedSessions.delete(sessionId);

    if (this.client.getReadyState() === WebSocket.OPEN) {
      this.client.send(
        JSON.stringify({
          type: 'unsubscribe',
          channel: `session:${sessionId}`,
        } as WebSocketMessage)
      );
      console.log(`[RealtimeService] Unsubscribed from session: ${sessionId}`);
    }
  }

  /**
   * 發送即時通知。
   * @param notification 不包含 `id` 和 `timestamp` 的通知數據。
   */
  sendNotification(notification: Omit<RealtimeNotification, 'id' | 'timestamp'>): void {
    const fullNotification: RealtimeNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    if (this.client.getReadyState() === WebSocket.OPEN) {
      this.client.send(
        JSON.stringify({
          type: 'notification',
          data: fullNotification,
        } as WebSocketMessage<RealtimeNotification>)
      );
      console.log('[RealtimeService] Notification sent:', fullNotification.type);
    } else {
      console.warn('[RealtimeService] Cannot send notification, not connected. Notification:', fullNotification);
    }
  }

  /**
   * 發送緊急通報。
   * @param sessionId 通報所屬的團次 ID。
   * @param message 通報內容。
   * @param metadata 可選的元數據。
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
   * 發送位置更新。
   * @param location 不包含 `timestamp` 的位置更新數據。
   */
  sendLocationUpdate(location: Omit<LocationUpdate, 'timestamp'>): void {
    const update: LocationUpdate = {
      ...location,
      timestamp: new Date().toISOString(),
    };

    if (this.client.getReadyState() === WebSocket.OPEN) {
      this.client.send(
        JSON.stringify({
          type: 'location_update',
          data: update,
        } as WebSocketMessage<LocationUpdate>)
      );
      console.log('[RealtimeService] Location update sent:', update.userId);
    } else {
      console.warn('[RealtimeService] Cannot send location update, not connected. Update:', update);
    }
  }

  /**
   * 發送公告。
   * @param sessionId 公告所屬的團次 ID。
   * @param title 公告標題。
   * @param message 公告內容。
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
   * 監聽特定事件。
   * @template K 事件名稱的類型，必須是 RealtimeEventsMap 的鍵。
   * @param event 事件名稱。
   * @param callback 回調函數，接收與事件類型匹配的數據。
   */
  on<K extends keyof RealtimeEventsMap>(event: K, callback: EventCallback<K>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as EventCallback<any>);
  }

  /**
   * 移除特定事件監聽。
   * @template K 事件名稱的類型。
   * @param event 事件名稱。
   * @param callback 要移除的回調函數。
   */
  off<K extends keyof RealtimeEventsMap>(event: K, callback: EventCallback<K>): void {
    this.eventListeners.get(event)?.delete(callback as EventCallback<any>);
  }

  /**
   * 取得當前連接狀態。
   * @returns 當前的連接狀態。
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * 內部方法：發射事件到所有註冊的監聽器。
   * @template K 事件名稱的類型。
   * @param event 事件名稱。
   * @param data 事件數據。
   */
  private emit<K extends keyof RealtimeEventsMap>(event: K, data: RealtimeEventsMap[K]): void {
    this.eventListeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (e) {
        console.error(`[RealtimeService] Error in event handler for ${String(event)}:`, e);
      }
    });
  }

  /**
   * 更新服務的連接狀態並發射 'status_change' 事件。
   * @param newStatus 新的連接狀態。
   */
  private setStatus(newStatus: ConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.emit('status_change', { status: newStatus });
      console.log(`[RealtimeService] Status changed to: ${newStatus}`);
    }
  }

  /**
   * 處理 WebSocket 連接成功事件。
   */
  private handleOpen(): void {
    console.log('[RealtimeService] Connected successfully.');
    this.setStatus('connected');
    this.reconnectAttempts = 0; // 成功連接後重置重連嘗試次數
    this.stopReconnectTimeout(); // 清除任何掛起的重連計時器
    this.startHeartbeat();

    // 在重連後重新訂閱所有之前訂閱的 session
    this.subscribedSessions.forEach((sessionId) => {
      this.subscribeToSession(sessionId);
    });
  }

  /**
   * 處理 WebSocket 接收到的訊息。
   * @param messageData 原始訊息數據（通常為 JSON 字串）。
   */
  private handleMessage(messageData: string): void {
    try {
      const parsedData: WebSocketMessage = JSON.parse(messageData);
      const { type, data, ...rest } = parsedData; // 解構出 type 和 data

      switch (type) {
        case 'notification':
          this.emit('notification', data as RealtimeNotification);
          break;
        case 'location_update':
          this.emit('location_update', data as LocationUpdate);
          break;
        case 'pong':
          // 收到 pong 響應，記錄心跳時間
          this.emit('heartbeat_received', { timestamp: new Date().toISOString() });
          break;
        default:
          // 對於其他未知或通用的訊息類型，直接發射
          this.emit(type, data || rest);
          break;
      }
    } catch (e) {
      console.error('[RealtimeService] Failed to parse message:', e, 'Raw data:', messageData);
      this.emit('error', { message: 'Failed to parse incoming message', originalError: e as Error });
    }
  }

  /**
   * 處理 WebSocket 連接關閉事件。
   * @param event CloseEvent 物件，包含關閉原因和代碼。
   */
  private handleClose(event: CloseEvent): void {
    console.log(`[RealtimeService] Disconnected. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
    this.stopHeartbeat();
    this.setStatus('disconnected');

    // 只有在非預期關閉（不是 clean close 或代碼不是 1000）時才嘗試重連
    if (!event.wasClean || event.code !== 1000) {
      this.attemptReconnect(this.lastConnectToken);
    } else {
      console.log('[RealtimeService] Clean disconnect, no reconnect attempt needed.');
    }
  }

  /**
   * 處理 WebSocket 錯誤事件。
   * @param event Event 物件，表示錯誤。
   */
  private handleError(event: Event): void {
    console.error('[RealtimeService] WebSocket Error event:', event);
    this.setStatus('error');
    this.emit('error', { message: 'WebSocket connection error', originalError: event });
    // 通常錯誤事件會緊接著關閉事件，重連邏輯主要由 handleClose 觸發
    // 但為確保覆蓋所有情況，也在此處觸發重連
    this.attemptReconnect(this.lastConnectToken);
  }

  /**
   * 開始心跳機制，定期發送 ping 訊息。
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // 確保沒有重複的計時器
    if (this.config.heartbeatIntervalMs > 0) {
      this.heartbeatInterval = setInterval(() => {
        if (this.client.getReadyState() === WebSocket.OPEN) {
          this.client.send(JSON.stringify({ type: 'ping' } as WebSocketMessage));
          this.emit('heartbeat_sent', { timestamp: new Date().toISOString() });
        }
      }, this.config.heartbeatIntervalMs);
      console.log(`[RealtimeService] Heartbeat started, interval: ${this.config.heartbeatIntervalMs}ms`);
    } else {
      console.log('[RealtimeService] Heartbeat is disabled by configuration.');
    }
  }

  /**
   * 停止心跳機制。
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('[RealtimeService] Heartbeat stopped.');
    }
  }

  /**
   * 嘗試重新連接，使用指數退避機制來增加重試間隔。
   * @param token 可選的認證 token，用於重新連接。
   */
  private attemptReconnect(token?: string): void {
    if (this.reconnectTimeout) {
      console.log('[RealtimeService] Reconnect attempt already scheduled.');
      return;
    }

    if (this.reconnectAttempts >= this.config.reconnectMaxAttempts) {
      console.error('[RealtimeService] Max reconnect attempts reached. Giving up on reconnection.');
      this.setStatus('disconnected'); // 達到最大重連次數後設置為斷開狀態
      return;
    }

    this.reconnectAttempts++;
    // 計算指數退避延遲
    const delay = Math.min(
      this.config.reconnectMaxDelayMs,
      this.config.reconnectInitialDelayMs * Math.pow(2, this.reconnectAttempts - 1)
    );

    console.log(`[RealtimeService] Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.config.reconnectMaxAttempts})`);
    this.setStatus('connecting'); // 在重連延遲期間也設置為 connecting 狀態

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null; // 在實際連接前清除計時器 ID
      // 確保底層客戶端在重新連接前已完全關閉，避免狀態不一致
      this.client.disconnect();
      this.connect(token); // 再次嘗試連接
    }, delay);
  }

  /**
   * 停止任何正在進行的重連計時器。
   */
  private stopReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
      console.log('[RealtimeService] Reconnect timeout cleared.');
    }
  }
}

// 根據 Kintone 獨立性規範，不應該在此處直接匯出單例。
// RealtimeService 實例的生命週期和配置應由應用程序的更高層次（例如 React Context, 自定義 Hook, 服務容器）負責管理。
// 以下提供一個在應用程式層次如何實例化和使用的範例，但不會直接包含在最終輸出中。

/*
// 範例：如何在應用程序入口點或配置模組中創建和提供 RealtimeService
// 通常會在主應用程式文件或一個專門的配置/服務提供者文件中處理這些。

// 假設環境變數已透過 Vite 或其他工具注入
// declare const import.meta.env: {
//   VITE_WS_URL?: string;
//   VITE_USE_MOCK?: string;
// };

// 配置物件，從環境變數中讀取
export const appRealtimeServiceConfig: RealtimeServiceConfig = {
  wsUrl: import.meta.env.VITE_WS_URL || 'wss://api.example.com/ws',
  useMock: import.meta.env.VITE_USE_MOCK === 'true', // 明確檢查 'true'
  reconnectMaxAttempts: 10,
  reconnectInitialDelayMs: 1000, // 1 秒
  reconnectMaxDelayMs: 60000,    // 1 分鐘
  heartbeatIntervalMs: 30000,   // 30 秒
};

// 在應用程式啟動時，你可以這樣創建 RealtimeService 實例：
// import React, { createContext, useContext, useEffect, useState } from 'react';
// export const realtimeServiceInstance = new RealtimeService(appRealtimeServiceConfig);

// 或者在一個 React Context 或自定義 Hook 中管理它：
// const RealtimeServiceContext = createContext<RealtimeService | null>(null);
// export const RealtimeServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [service] = useState(() => new RealtimeService(appRealtimeServiceConfig));
//
//   useEffect(() => {
//     service.connect();
//     return () => service.disconnect();
//   }, [service]);
//
//   return (
//     <RealtimeServiceContext.Provider value={service}>
//       {children}
//     </RealtimeServiceContext.Provider>
//   );
// };
//
// export const useRealtimeService = () => {
//   const service = useContext(RealtimeServiceContext);
//   if (!service) {
//     throw new Error('useRealtimeService must be used within a RealtimeServiceProvider');
//   }
//   return service;
// };
*/