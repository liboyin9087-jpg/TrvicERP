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
import { apiRequest, ApiError, ApiErrorType } from '../apiError'; // Assuming RetryConfig is also exported from apiError

// Define the RetryConfig type if it's not explicitly exported from apiError.ts
// If it is, this can be removed and imported directly.
interface RetryConfig {
  maxRetries: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

// Configuration interface for the AI service.
// This allows external configuration without direct dependency on environment variables.
export interface AIServiceConfig {
  baseUrl: string;
  useMock: boolean;
  retryConfig?: RetryConfig;
}

// Custom error type for consistency within the AI service layer.
export class AIServiceError extends Error {
  public readonly originalError?: unknown;
  public readonly apiErrorType?: ApiErrorType;

  constructor(message: string, originalError?: unknown, apiErrorType?: ApiErrorType) {
    super(message);
    this.name = 'AIServiceError';
    this.originalError = originalError;
    this.apiErrorType = apiErrorType;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIServiceError);
    }
  }
}

// Define the interface for the AI API client (Single Responsibility Principle)
interface IAIApiClient {
  chat(request: ChatRequest): Promise<ChatResponse>;
  healthCheck(): Promise<HealthResponse>;
  getModes(): Promise<ModesResponse>;
  generateStructured<T = ProposalComparisonOutput>(
    request: StructuredOutputRequest
  ): Promise<StructuredOutputResponse<T>>;
}

// --- Mock Data and Client (Separation of Concerns) ---
const MOCK_MODE_OPTIONS: AIModeOption[] = [
  { id: 'general', name: 'general', label: '一般諮詢', description: 'Mock 模式 (無後端)', enabled: true },
  { id: 'itinerary', name: 'itinerary', label: '行程規劃', description: 'Mock 模式 (無後端)', enabled: true },
  { id: 'marketing', name: 'marketing', label: '行銷文案', description: 'Mock 模式 (無後端)', enabled: true },
  { id: 'costing', name: 'costing', label: '成本估算', description: 'Mock 模式 (無後端)', enabled: true },
  { id: 'legal', name: 'legal', label: '法規諮詢', description: 'Mock 模式 (無後端)', enabled: true },
];

const MOCK_MODE_DESCRIPTIONS = MOCK_MODE_OPTIONS.reduce<Record<AIMode, string>>(
  (acc, mode) => {
    acc[mode.id as AIMode] = mode.label;
    return acc;
  },
  {} as Record<AIMode, string>
);

class MockAIApiClient implements IAIApiClient {
  private simulateDelay(min: number = 100, max: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    await this.simulateDelay();
    return {
      id: '1',
      content: '目前為 Mock 模式，尚未連接 AI 後端。',
      reply: '目前為 Mock 模式，尚未連接 AI 後端。',
      model: 'mock',
    };
  }

  async healthCheck(): Promise<HealthResponse> {
    await this.simulateDelay(50, 200);
    return {
      status: 'healthy',
      timestamp: Date.now(),
      llm_configured: false,
    };
  }

  async getModes(): Promise<ModesResponse> {
    await this.simulateDelay(100, 300);
    return { 
      modes: MOCK_MODE_OPTIONS,
      defaultMode: 'general',
    };
  }

  async generateStructured<T = ProposalComparisonOutput>(
    request: StructuredOutputRequest
  ): Promise<StructuredOutputResponse<T>> {
    await this.simulateDelay(500, 1500);

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
      id: '1',
      data: mockData as T,
      raw: JSON.stringify(mockData),
    };
  }
}

// --- Real API Client (Single Responsibility Principle & Consistent Error Handling) ---
class RealAIApiClient implements IAIApiClient {
  private baseUrl: string;
  private defaultRetryConfig: RetryConfig;

  constructor(baseUrl: string, defaultRetryConfig: RetryConfig) {
    if (!baseUrl) {
      throw new AIServiceError('RealAIApiClient requires a baseUrl.');
    }
    this.baseUrl = baseUrl;
    this.defaultRetryConfig = defaultRetryConfig;
  }

  // Centralized API call logic to ensure consistent error handling
  private async callApi<T>(
    path: string,
    options: RequestInit,
    timeout: number,
    retryConfig?: RetryConfig
  ): Promise<T> {
    try {
      return await apiRequest<T>(
        `${this.baseUrl}${path}`,
        {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        },
        {
          timeout: timeout,
          retry: retryConfig || this.defaultRetryConfig,
        }
      );
    } catch (error) {
      // Wrap all errors into AIServiceError for consistent error handling by consumers
      if (error instanceof ApiError) {
        throw new AIServiceError(error.message, error, error.type);
      }
      throw new AIServiceError('AI 服務請求失敗', error);
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.callApi<ChatResponse>(
      '/api/chat',
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
      60000, // AI response can be slow
      this.defaultRetryConfig
    );
  }

  async healthCheck(): Promise<HealthResponse> {
    return this.callApi<HealthResponse>(
      '/health',
      { method: 'GET' },
      10000,
      { maxRetries: 1, baseDelay: 500 } // Health check specific retry, fewer retries and shorter timeout
    );
  }

  async getModes(): Promise<ModesResponse> {
    return this.callApi<ModesResponse>(
      '/api/modes',
      { method: 'GET' },
      10000
    );
  }

  async generateStructured<T = ProposalComparisonOutput>(
    request: StructuredOutputRequest
  ): Promise<StructuredOutputResponse<T>> {
    return this.callApi<StructuredOutputResponse<T>>(
      '/api/structured',
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
      90000, // Structured output can take longer
      this.defaultRetryConfig
    );
  }
}

/**
 * AI 服務類別
 * 負責根據配置選擇實際或模擬的 API 客戶端
 * 並提供統一的接口給應用程式使用。
 *
 * This class now adheres to the Single Responsibility Principle by delegating
 * the actual API interaction (mock or real) to an injected client.
 */
class AIService implements IAIApiClient {
  private apiClient: IAIApiClient;

  constructor(config: AIServiceConfig, client?: IAIApiClient) {
    if (client) {
      // Allows injecting a specific client (e.g., for testing)
      this.apiClient = client;
    } else if (config.useMock) {
      this.apiClient = new MockAIApiClient();
    } else {
      if (!config.baseUrl) {
        throw new AIServiceError('Real AI service requires a baseUrl in config.');
      }
      this.apiClient = new RealAIApiClient(config.baseUrl, config.retryConfig || DEFAULT_AI_RETRY_CONFIG);
    }
  }

  chat(request: ChatRequest): Promise<ChatResponse> {
    return this.apiClient.chat(request);
  }

  healthCheck(): Promise<HealthResponse> {
    return this.apiClient.healthCheck();
  }

  getModes(): Promise<ModesResponse> {
    return this.apiClient.getModes();
  }

  generateStructured<T = ProposalComparisonOutput>(
    request: StructuredOutputRequest
  ): Promise<StructuredOutputResponse<T>> {
    return this.apiClient.generateStructured(request);
  }
}

// --- Dependency Setup and Singleton Export ---
// Environment variables are accessed only in this section, centralizing their use.
const API_BASE_URL_ENV = import.meta.env.VITE_AI_API_URL || 'http://localhost:4000';
// Explicitly check for 'true' to enable mock mode. Other values (undefined, false, '') will disable it.
const USE_MOCK_ENV = import.meta.env.VITE_USE_MOCK === 'true';

// Default retry configuration for the AI service.
const DEFAULT_AI_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 2,
};

const serviceConfig: AIServiceConfig = {
  baseUrl: API_BASE_URL_ENV,
  useMock: USE_MOCK_ENV,
  retryConfig: DEFAULT_AI_RETRY_CONFIG,
};

// Export singleton instance of AIService
export const aiService = new AIService(serviceConfig);

// Export the class itself for advanced use cases like testing or custom instantiation
export { AIService };

// --- Convenient helper functions (now use the singleton instance) ---
export async function sendChatMessage(
  message: string,
  mode: AIMode = 'general',
  context?: string,
  user_role?: string,
  user_id?: string
): Promise<ChatResponse> {
  return aiService.chat({ message, mode, context, user_role, user_id });
}

export async function checkAIHealth(): Promise<boolean> {
  try {
    const health = await aiService.healthCheck();
    return health.status === 'healthy' && health.llm_configured;
  } catch (error) {
    // Catch AIServiceError or any other error from healthCheck
    console.error('AI Health Check failed:', error instanceof AIServiceError ? error.message : error);
    return false;
  }
}