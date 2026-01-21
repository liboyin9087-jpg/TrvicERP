import { ApiError } from '@/core/types/api';

// =============================================================================
// SiliconFlow LLM Service
// =============================================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

class SiliconFlowService {
  private static instance: SiliconFlowService;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      baseURL: 'https://api.siliconflow.cn/v1',
      model: 'Qwen/Qwen2.5-32B-Instruct',
      temperature: 0.3,
      maxTokens: 4000,
      ...config
    };
  }

  static getInstance(config?: LLMConfig): SiliconFlowService {
    if (!SiliconFlowService.instance) {
      if (!config) {
        throw new Error('SiliconFlowService requires config on first instantiation');
      }
      SiliconFlowService.instance = new SiliconFlowService(config);
    }
    return SiliconFlowService.instance;
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`SiliconFlow API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage
      };
    } catch (error) {
      console.error('SiliconFlow API error:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'LLM service error',
        'LLM_SERVICE_ERROR'
      );
    }
  }

  async chatWithSystemPrompt(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    return this.chat(messages);
  }

  updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// 初始化 LLM 服務
let llmService: SiliconFlowService | null = null;

export function initializeLLMService(config: LLMConfig): SiliconFlowService {
  llmService = SiliconFlowService.getInstance(config);
  return llmService;
}

export function getLLMService(): SiliconFlowService {
  if (!llmService) {
    throw new Error('LLM service not initialized. Call initializeLLMService first.');
  }
  return llmService;
}

// 環境變數配置
export function getLLMConfigFromEnv(): LLMConfig {
  const apiKey = import.meta.env.VITE_SILICONFLOW_API_KEY || 
                 process.env.SILICONFLOW_API_KEY || 
                 '';

  if (!apiKey) {
    console.warn('SiliconFlow API key not found in environment variables');
  }

  return {
    apiKey,
    baseURL: import.meta.env.VITE_SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
    model: import.meta.env.VITE_SILICONFLOW_MODEL || 'Qwen/Qwen2.5-32B-Instruct',
    temperature: parseFloat(import.meta.env.VITE_LLM_TEMPERATURE || '0.3'),
    maxTokens: parseInt(import.meta.env.VITE_LLM_MAX_TOKENS || '4000')
  };
}
