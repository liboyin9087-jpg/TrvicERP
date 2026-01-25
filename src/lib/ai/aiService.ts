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
  StructuredOutputRequest,
  StructuredOutputResponse,
  ProposalComparisonOutput,
} from '../../types/ai';
import { apiRequest, ApiError, ApiErrorType, withRetry } from '../apiError';

// API 基礎 URL - 可透過環境變數配置
const API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:4000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// 重試配置
const AI_RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 2,
};

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

    try {
      return await apiRequest<ChatResponse>(
        `${this.baseUrl}/api/chat`,
        {
          method: 'POST',
          body: JSON.stringify({
            message: request.message,
            mode: request.mode,
            context: request.context || '',
            user_role: request.user_role,
            user_id: request.user_id,
          }),
        },
        {
          timeout: 60000, // AI 回應可能較慢
          retry: AI_RETRY_CONFIG,
        }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.userMessage);
      }
      throw error;
    }
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

    try {
      return await apiRequest<HealthResponse>(
        `${this.baseUrl}/health`,
        { method: 'GET' },
        { timeout: 10000, retry: { maxRetries: 1 } }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.userMessage);
      }
      throw new Error('AI 服務無法連線');
    }
  }

  /**
   * 取得可用模式列表
   */
  async getModes(): Promise<ModesResponse> {
    if (USE_MOCK) {
      return { modes: MOCK_MODE_OPTIONS };
    }

    try {
      return await apiRequest<ModesResponse>(
        `${this.baseUrl}/api/modes`,
        { method: 'GET' },
        { timeout: 10000 }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.userMessage);
      }
      throw new Error('無法取得模式列表');
    }
  }

  /**
   * Structured output generation (Pydantic-backed)
   */
  async generateStructured<T = ProposalComparisonOutput>(
    request: StructuredOutputRequest
  ): Promise<StructuredOutputResponse<T>> {
    if (USE_MOCK) {
      const mockData: ProposalComparisonOutput = {
        title: '東京五日企業團 - 三版本提案',
        summary: '依預算與需求提供三版方案，兼顧成本與體驗差異。',
        tiers: [
          {
            name: '經濟版',
            price_per_person: 42000,
            margin_percent: 12,
            lodging: '商務飯店 3-4 星',
            transport: '標準遊覽車',
            meals: '在地風味 8 餐',
            highlights: ['市區精華景點', '固定行程'],
          },
          {
            name: '豪華版',
            price_per_person: 52000,
            margin_percent: 15,
            lodging: '四星飯店 + 1 晚溫泉',
            transport: '舒適座椅巴士',
            meals: '特色餐廳 10 餐',
            highlights: ['溫泉體驗', '半天自由活動'],
          },
          {
            name: '旗艦版',
            price_per_person: 65000,
            margin_percent: 18,
            lodging: '五星飯店 + 2 晚溫泉',
            transport: '豪華巴士 + 專屬領隊',
            meals: '米其林或高級料亭',
            highlights: ['VIP 接送', '高端團體客製'],
          },
        ],
        inclusions: ['機票', '住宿', '餐食', '交通', '保險'],
        exclusions: ['私人消費', '小費', '自由行程費用'],
        safety_commitments: ['全員保險', '緊急支援 24/7', '法規合規流程'],
      };

      return {
        schema: request.schema,
        data: mockData as T,
        raw_text: JSON.stringify(mockData),
        attempts: 1,
        provider: 'mock',
      };
    }

    try {
      return await apiRequest<StructuredOutputResponse<T>>(
        `${this.baseUrl}/api/structured`,
        {
          method: 'POST',
          body: JSON.stringify({
            message: request.message,
            mode: request.mode,
            context: request.context || '',
            schema: request.schema,
            user_role: request.user_role,
            user_id: request.user_id,
            max_attempts: request.max_attempts,
          }),
        },
        {
          timeout: 90000, // 結構化輸出可能需要更長時間
          retry: AI_RETRY_CONFIG,
        }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.userMessage);
      }
      throw error;
    }
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
