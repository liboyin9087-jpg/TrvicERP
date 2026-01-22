/**
 * AI Copilot API 服務
 * 負責與後端 AI 服務通訊
 */

import type {
  ChatRequest,
  ChatResponse,
  HealthResponse,
  ModesResponse,
  AIMode,
  AIModeOption,
} from '../../types/ai';

// API 基礎 URL - 可透過環境變數配置
const API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:4000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const MOCK_MODE_OPTIONS: AIModeOption[] = [
  { id: 'general', label: '一般諮詢', description: 'Mock 模式 (無後端)' },
  { id: 'itinerary', label: '行程規劃', description: 'Mock 模式 (無後端)' },
  { id: 'marketing', label: '行銷文案', description: 'Mock 模式 (無後端)' },
  { id: 'costing', label: '成本估算', description: 'Mock 模式 (無後端)' },
  { id: 'legal', label: '法規諮詢', description: 'Mock 模式 (無後端)' },
];

const MOCK_MODE_DESCRIPTIONS = MOCK_MODE_OPTIONS.reduce<Record<AIMode, string>>(
  (acc, mode) => {
    acc[mode.id] = mode.label;
    return acc;
  },
  {
    general: '一般諮詢',
    itinerary: '行程規劃',
    marketing: '行銷文案',
    costing: '成本估算',
    legal: '法規諮詢',
  }
);

/**
 * AI 服務類別
 */
class AIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * 發送聊天訊息
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (USE_MOCK) {
      return {
        reply: '目前為 Mock 模式，尚未連接 AI 後端。',
        mode: request.mode,
        mode_description: MOCK_MODE_DESCRIPTIONS[request.mode],
        function_calls: null,
      };
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: request.message,
        mode: request.mode,
        context: request.context || '',
        user_role: request.user_role,
        user_id: request.user_id,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '未知錯誤' }));
      throw new Error(error.detail || `AI 服務錯誤: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 健康檢查
   */
  async healthCheck(): Promise<HealthResponse> {
    if (USE_MOCK) {
      return {
        status: 'healthy',
        llm_configured: false,
        rules_loaded: false,
      };
    }

    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error('AI 服務無法連線');
    }

    return response.json();
  }

  /**
   * 取得可用模式列表
   */
  async getModes(): Promise<ModesResponse> {
    if (USE_MOCK) {
      return { modes: MOCK_MODE_OPTIONS };
    }

    const response = await fetch(`${this.baseUrl}/api/modes`);

    if (!response.ok) {
      throw new Error('無法取得模式列表');
    }

    return response.json();
  }
}

// 匯出單例實例
export const aiService = new AIService();

// 匯出類別供測試或自訂配置使用
export { AIService };

// 便捷函式
export async function sendChatMessage(
  message: string,
  mode: AIMode = 'general',
  context?: string
): Promise<ChatResponse> {
  return aiService.chat({ message, mode, context });
}

export async function checkAIHealth(): Promise<boolean> {
  try {
    const health = await aiService.healthCheck();
    return health.status === 'healthy' && health.llm_configured;
  } catch {
    return false;
  }
}
