interface ApiClientInstance {
  post<T>(url: string, data?: any, config?: any): Promise<{ data?: T; error?: { message: string } }>;
}

// Define Line Flex Message types
// These types are derived from Line's official documentation for Flex Message JSON.
// They help provide type safety for the 'contents' property.

interface FlexMessageTextComponent {
  type: 'text';
  text: string;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl' | '4xl' | '5xl';
  weight?: 'regular' | 'bold';
  color?: string; // Hex color code
  align?: 'start' | 'end' | 'center';
  gravity?: 'top' | 'bottom' | 'center';
  wrap?: boolean;
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  flex?: number;
  offsetStart?: string;
  offsetEnd?: string;
}

interface FlexMessageImageComponent {
  type: 'image';
  url: string;
  flex?: number;
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  align?: 'start' | 'end' | 'center';
  gravity?: 'top' | 'bottom' | 'center';
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl' | '4xl' | '5xl' | 'full';
  aspectRatio?: string; // e.g., '1.5:1'
  aspectMode?: 'fit' | 'cover';
  backgroundColor?: string; // Hex color code
}

interface FlexMessageButtonComponent {
  type: 'button';
  action: {
    type: 'uri' | 'postback' | 'message' | 'datetimepicker' | 'camera' | 'cameraRoll' | 'location';
    label: string;
    uri?: string;
    data?: string; // for postback
    text?: string; // for message
    mode?: 'date' | 'time' | 'datetime'; // for datetimepicker
    initial?: string; // for datetimepicker
    max?: string; // for datetimepicker
    min?: string; // for datetimepicker
  };
  style?: 'link' | 'primary' | 'secondary';
  color?: string; // Hex color code
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  height?: 'sm' | 'md';
  gravity?: 'top' | 'bottom' | 'center';
  flex?: number;
  position?: 'relative' | 'absolute';
}

interface FlexMessageSeparatorComponent {
  type: 'separator';
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  color?: string; // Hex color code
}

// Basic Box component. Can contain other components.
interface FlexMessageBoxComponent {
  type: 'box';
  layout: 'horizontal' | 'vertical' | 'baseline';
  contents: FlexMessageComponent[];
  flex?: number;
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  backgroundColor?: string; // Hex color code
  borderColor?: string; // Hex color code
  borderWidth?: string; // e.g., '1px'
  cornerRadius?: string; // e.g., '5px'
  paddingAll?: string; // e.g., '20px'
  paddingTop?: string;
  paddingBottom?: string;
  paddingStart?: string;
  paddingEnd?: string;
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'flex-end' | 'center';
  offsetStart?: string;
  offsetEnd?: string;
  offsetTop?: string;
  offsetBottom?: string;
  position?: 'relative' | 'absolute';
}

// Union type for all possible Flex Message components
type FlexMessageComponent =
  | FlexMessageTextComponent
  | FlexMessageImageComponent
  | FlexMessageButtonComponent
  | FlexMessageSeparatorComponent
  | FlexMessageBoxComponent;

// A Bubble container is typically used for a single rich message.
interface FlexMessageBubbleContainer {
  type: 'bubble';
  header?: FlexMessageBoxComponent;
  hero?: FlexMessageImageComponent | FlexMessageBoxComponent;
  body?: FlexMessageBoxComponent;
  footer?: FlexMessageBoxComponent;
  size?: 'nano' | 'micro' | 'kilo' | 'mega' | 'giga';
  direction?: 'ltr' | 'rtl';
  backgroundColor?: string; // Hex color code
}

// A Carousel container is used for multiple bubbles.
interface FlexMessageCarouselContainer {
  type: 'carousel';
  contents: FlexMessageBubbleContainer[];
}

// Main Flex Message container type
export type FlexMessageContainer = FlexMessageBubbleContainer | FlexMessageCarouselContainer;

/**
 * Line Messaging API 服務
 * Line Messaging API Service
 */

// We assume `api` is an already instantiated API client from '@/lib/api'.
// The actual type of `api` from '@/lib/api' should conform to `ApiClientInstance`.
import { api } from '@/lib/api';

// --- Design Fixes (Tailwind Color Tokens for Line Flex Messages) ---
// Since Line Flex Messages require hex codes directly in their JSON,
// we create a mapping from conceptual "Tailwind-like" tokens to hex values.
// This allows for centralized color management in a way compatible with Line API.
const LINE_COLOR_TOKENS = {
  // Primary (e.g., green for success/action)
  'primary-main': '#06c167', // Corresponds to a strong green
  // Accent/Info (e.g., light blue for headers/notifications)
  'info-background': '#f0f9ff', // Light blue, used for document notification header
  // Text colors
  'text-dark': '#1a1a1a', // Near black, used for main text
  'text-light': '#ffffff', // White, used on dark backgrounds
  'text-muted': '#666666', // Gray, for secondary text
  'text-super-muted': '#999999', // Lighter gray, for tertiary text
} as const;


/**
 * Line 訊息類型
 */
export type LineMessageType = 'text' | 'image' | 'flex' | 'template';

/**
 * Line 訊息
 * Updated: `contents` now uses the specific `FlexMessageContainer` type.
 */
export interface LineMessage {
  type: LineMessageType;
  text?: string;
  imageUrl?: string;
  altText?: string;
  contents?: FlexMessageContainer; // Flex Message contents
}

/**
 * Line 發送目標
 */
export interface LineSendTarget {
  type: 'user' | 'group' | 'room';
  id: string;
  name?: string;
}

/**
 * Line 發送請求
 */
export interface LineSendRequest {
  targets: LineSendTarget[];
  messages: LineMessage[];
}

/**
 * Line 發送結果
 */
export interface LineSendResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors?: { targetId: string; error: string }[];
}

/**
 * 文件發送選項
 * (This interface is domain-specific and could be moved outside a generic LineService
 * if more strict decoupling is desired, but for now, it's used by `sendDocumentNotification`).
 */
export interface DocumentSendOptions {
  sessionId: string;
  documentType: 'itinerary' | 'room_list' | 'seat_chart' | 'roster' | 'meeting_info';
  recipients: LineSendTarget[];
  customMessage?: string;
}

/**
 * Line 服務配置介面
 * 透過建構子注入配置，提升可測試性及環境變數管理。
 */
export interface LineServiceConfig {
  lineApiBaseUrl: string;
  appBaseUrl: string; // Base URL for generating document links
  useMockService: boolean; // Flag to enable/disable mock behavior
}

/**
 * Line 服務
 * Refactored:
 * - Changed to instance methods for better testability (static methods -> instance methods).
 * - Dependencies (api client, config) are injected via constructor.
 * - `LINE_API_BASE` and mock logic are part of the injected config.
 * - Hardcoded colors replaced with `LINE_COLOR_TOKENS`.
 * - Kintone independence: No reliance on global stores; configuration via constructor.
 */
export class LineService {
  private api: ApiClientInstance;
  private config: LineServiceConfig;

  /**
   * 構造 LineService 實例。
   *
   * @param apiClient API 客戶端實例，用於發送 HTTP 請求。
   * @param config Line 服務的配置，包含 API 基礎 URL、應用程式基礎 URL 和模擬模式開關。
   */
  constructor(apiClient: ApiClientInstance, config: LineServiceConfig) {
    this.api = apiClient;
    this.config = config;
  }

  /**
   * 發送文字訊息
   */
  async sendTextMessage(
    targets: LineSendTarget[],
    text: string
  ): Promise<LineSendResult> {
    const request: LineSendRequest = {
      targets,
      messages: [{ type: 'text', text }],
    };
    return this.send(request);
  }

  /**
   * 發送圖片訊息
   */
  async sendImageMessage(
    targets: LineSendTarget[],
    imageUrl: string,
    altText: string = '圖片訊息'
  ): Promise<LineSendResult> {
    const request: LineSendRequest = {
      targets,
      messages: [{ type: 'image', imageUrl, altText }],
    };
    return this.send(request);
  }

  /**
   * 發送 Flex 訊息（用於豐富格式）
   * Contents type is now `FlexMessageContainer`.
   */
  async sendFlexMessage(
    targets: LineSendTarget[],
    altText: string,
    contents: FlexMessageContainer
  ): Promise<LineSendResult> {
    const request: LineSendRequest = {
      targets,
      messages: [{ type: 'flex', altText, contents }],
    };
    return this.send(request);
  }

  /**
   * 發送出團文件通知
   * Refactored: Uses `LINE_COLOR_TOKENS` for colors.
   */
  async sendDocumentNotification(
    options: DocumentSendOptions
  ): Promise<LineSendResult> {
    const { sessionId, documentType, recipients, customMessage } = options;

    const documentLabels: Record<string, string> = {
      itinerary: '團體行程表',
      room_list: '分房表',
      seat_chart: '座位表',
      roster: '名單清冊',
      meeting_info: '集合資訊',
    };

    const documentLabel = documentLabels[documentType] || '文件';
    const documentUrl = `${this.config.appBaseUrl}/documents/${sessionId}/${documentType}`;

    // 建立 Flex Message
    const flexContents: FlexMessageBubbleContainer = {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📄 出團文件通知',
            weight: 'bold',
            size: 'lg',
            color: LINE_COLOR_TOKENS['text-dark'], // Replaced '#1a1a1a'
          },
        ],
        backgroundColor: LINE_COLOR_TOKENS['info-background'], // Replaced '#f0f9ff'
        paddingAll: '15px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `您的${documentLabel}已準備好`,
            size: 'md',
            wrap: true,
          },
          ...(customMessage
            ? [
                {
                  type: 'text',
                  text: customMessage,
                  size: 'sm',
                  color: LINE_COLOR_TOKENS['text-muted'], // Replaced '#666666'
                  margin: 'md',
                  wrap: true,
                },
              ]
            : []),
        ],
        paddingAll: '15px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: `查看${documentLabel}`,
              uri: documentUrl,
            },
            style: 'primary',
            color: LINE_COLOR_TOKENS['primary-main'], // Replaced '#06c167'
          },
        ],
        paddingAll: '15px',
      },
    };

    return this.sendFlexMessage(
      recipients,
      `${documentLabel}已準備好，請點擊查看`,
      flexContents
    );
  }

  /**
   * 發送集合提醒
   * Refactored: Uses `LINE_COLOR_TOKENS` for colors.
   */
  async sendMeetingReminder(
    targets: LineSendTarget[],
    meetingInfo: {
      location: string;
      address?: string;
      meetingTime: string;
      contactPerson: string;
      contactPhone: string;
      groupNumber: string;
    }
  ): Promise<LineSendResult> {
    const flexContents: FlexMessageBubbleContainer = {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📍 集合提醒',
            weight: 'bold',
            size: 'lg',
            color: LINE_COLOR_TOKENS['text-light'], // Replaced '#ffffff'
          },
          {
            type: 'text',
            text: `團號：${meetingInfo.groupNumber}`,
            size: 'sm',
            color: LINE_COLOR_TOKENS['text-light'], // Replaced '#ffffff'
            margin: 'sm',
          },
        ],
        backgroundColor: LINE_COLOR_TOKENS['primary-main'], // Replaced '#06c167'
        paddingAll: '15px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '集合地點', size: 'sm', color: LINE_COLOR_TOKENS['text-muted'], flex: 0 }, // Replaced '#666666'
              { type: 'text', text: meetingInfo.location, size: 'sm', weight: 'bold', align: 'end', flex: 1 },
            ],
            margin: 'md',
          },
          ...(meetingInfo.address
            ? [
                {
                  type: 'text',
                  text: meetingInfo.address,
                  size: 'xs',
                  color: LINE_COLOR_TOKENS['text-super-muted'], // Replaced '#999999'
                  margin: 'sm',
                  wrap: true,
                },
              ]
            : []),
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '集合時間', size: 'sm', color: LINE_COLOR_TOKENS['text-muted'], flex: 0 }, // Replaced '#666666'
              { type: 'text', text: meetingInfo.meetingTime, size: 'sm', weight: 'bold', align: 'end', flex: 1 },
            ],
            margin: 'lg',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '聯絡人', size: 'sm', color: LINE_COLOR_TOKENS['text-muted'], flex: 0 }, // Replaced '#666666'
              { type: 'text', text: meetingInfo.contactPerson, size: 'sm', align: 'end', flex: 1 },
            ],
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '聯絡電話', size: 'sm', color: LINE_COLOR_TOKENS['text-muted'], flex: 0 }, // Replaced '#666666'
              { type: 'text', text: meetingInfo.contactPhone, size: 'sm', align: 'end', flex: 1 },
            ],
            margin: 'sm',
          },
        ],
        paddingAll: '15px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '撥打電話',
              uri: `tel:${meetingInfo.contactPhone}`,
            },
            style: 'secondary',
            height: 'sm',
          },
        ],
        paddingAll: '15px',
      },
    };

    return this.sendFlexMessage(targets, '集合提醒通知', flexContents);
  }

  /**
   * 發送行程變更通知
   */
  async sendItineraryChangeNotification(
    targets: LineSendTarget[],
    change: {
      groupNumber: string;
      changeType: string;
      description: string;
      effectiveDate?: string;
    }
  ): Promise<LineSendResult> {
    const text = `⚠️ 行程變更通知\n\n團號：${change.groupNumber}\n變更類型：${change.changeType}\n${change.effectiveDate ? `生效日期：${change.effectiveDate}\n` : ''}\n${change.description}`;
    return this.sendTextMessage(targets, text);
  }

  /**
   * 核心發送方法
   * Refactored: Uses injected config for `useMock` and `lineApiBaseUrl`.
   */
  private async send(request: LineSendRequest): Promise<LineSendResult> {
    if (this.config.useMockService) {
      // Mock 模式：模擬發送成功
      console.log('[Line Mock] 發送訊息:', request);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        success: true,
        sentCount: request.targets.length,
        failedCount: 0,
      };
    }

    // 真實 API 呼叫
    const response = await this.api.post<LineSendResult>(`${this.config.lineApiBaseUrl}/send`, request);

    // Assuming api.post returns an object with 'data' and 'error' properties
    if (response && response.error) {
      return {
        success: false,
        sentCount: 0,
        failedCount: request.targets.length,
        errors: [{ targetId: 'all', error: response.error.message }],
      };
    }

    return response.data || {
      success: false,
      sentCount: 0,
      failedCount: request.targets.length,
    };
  }

  /**
   * 取得 Line 用戶列表（從訂單中提取）
   * This remains static as it's a pure utility function that doesn't depend on instance state
   * or injected dependencies. It's a helper for preparing data for the service.
   */
  static extractLineTargetsFromBookings(
    bookings: Array<{ id: string; customer_name: string; user_id?: string }>
  ): LineSendTarget[] {
    return bookings
      .filter((b) => b.user_id)
      .map((b) => ({
        type: 'user' as const,
        id: b.user_id!,
        name: b.customer_name,
      }));
  }
}

export default LineService;