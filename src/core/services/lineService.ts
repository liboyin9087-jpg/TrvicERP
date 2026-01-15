/**
 * Line Messaging API 服務
 * Line Messaging API Service
 */

import { api } from '@/lib/api';

// Line API 端點
const LINE_API_BASE = import.meta.env.VITE_LINE_API_URL || '/api/v1/line';

/**
 * Line 訊息類型
 */
export type LineMessageType = 'text' | 'image' | 'flex' | 'template';

/**
 * Line 訊息
 */
export interface LineMessage {
  type: LineMessageType;
  text?: string;
  imageUrl?: string;
  altText?: string;
  contents?: any; // Flex Message contents
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
 */
export interface DocumentSendOptions {
  sessionId: string;
  documentType: 'itinerary' | 'room_list' | 'seat_chart' | 'roster' | 'meeting_info';
  recipients: LineSendTarget[];
  customMessage?: string;
}

/**
 * Line 服務
 */
export class LineService {
  /**
   * 發送文字訊息
   */
  static async sendTextMessage(
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
  static async sendImageMessage(
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
   */
  static async sendFlexMessage(
    targets: LineSendTarget[],
    altText: string,
    contents: any
  ): Promise<LineSendResult> {
    const request: LineSendRequest = {
      targets,
      messages: [{ type: 'flex', altText, contents }],
    };
    return this.send(request);
  }

  /**
   * 發送出團文件通知
   */
  static async sendDocumentNotification(
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
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const documentUrl = `${baseUrl}/documents/${sessionId}/${documentType}`;

    // 建立 Flex Message
    const flexContents = {
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
            color: '#1a1a1a',
          },
        ],
        backgroundColor: '#f0f9ff',
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
                  color: '#666666',
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
            color: '#06c167',
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
   */
  static async sendMeetingReminder(
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
    const flexContents = {
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
            color: '#ffffff',
          },
          {
            type: 'text',
            text: `團號：${meetingInfo.groupNumber}`,
            size: 'sm',
            color: '#ffffff',
            margin: 'sm',
          },
        ],
        backgroundColor: '#06c167',
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
              { type: 'text', text: '集合地點', size: 'sm', color: '#666666', flex: 0 },
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
                  color: '#999999',
                  margin: 'sm',
                  wrap: true,
                },
              ]
            : []),
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '集合時間', size: 'sm', color: '#666666', flex: 0 },
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
              { type: 'text', text: '聯絡人', size: 'sm', color: '#666666', flex: 0 },
              { type: 'text', text: meetingInfo.contactPerson, size: 'sm', align: 'end', flex: 1 },
            ],
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '聯絡電話', size: 'sm', color: '#666666', flex: 0 },
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
  static async sendItineraryChangeNotification(
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
   */
  private static async send(request: LineSendRequest): Promise<LineSendResult> {
    // 檢查是否為 Mock 模式
    const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

    if (useMock) {
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
    const response = await api.post<LineSendResult>(`${LINE_API_BASE}/send`, request);

    if (response.error) {
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
