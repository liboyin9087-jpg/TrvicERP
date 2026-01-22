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
} from '../../types/ai';

// API 基礎 URL - 可透過環境變數配置
const API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:4000';

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
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: request.message,
        mode: request.mode,
        context: request.context || '',
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
