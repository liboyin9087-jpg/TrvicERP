/**
 * LLM Service - 完整的 AI 整合
 * 
 * 支援的服務:
 * 1. Vercel Proxy (生產環境推薦)
 * 2. Ollama (本地開發推薦)
 * 3. GitHub Models
 * 4. Hugging Face
 * 5. OpenAI Compatible
 */

import { SelectionState, Category, TripConfig, Option, AudienceType } from '../types';
import { buildProposalPrompt, buildCompetitorWarningPrompt, buildRFPSummaryPrompt, buildMessages } from '../constants/prompts';
import { getSupabaseClient } from '../lib/supabase';

// ==============================================
// Types
// ==============================================

type LLMProvider = 'supabase-edge' | 'vercel-proxy' | 'huggingface' | 'github-models' | 'ollama' | 'openai-compatible';

interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseURL?: string;
  model: string;
}

interface LLMResponse {
  text: string;
  provider?: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// ==============================================
// Configuration
// ==============================================

const getLLMConfig = (): LLMConfig => {
  const provider = (import.meta.env.VITE_LLM_PROVIDER || 'supabase-edge') as LLMProvider;

  // 生產環境：建議用 Supabase Edge Function 代理（API key 不落地到前端）
  // 仍允許 ollama 走內網/本地端（例如公司內部環境）
  if (import.meta.env.MODE === 'production' && provider !== 'supabase-edge' && provider !== 'ollama') {
    console.warn('Production should use supabase-edge for security. Forcing supabase-edge.');
    return {
      provider: 'supabase-edge',
      model: import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini',
    };
  }

  return {
    provider,
    apiKey: import.meta.env.VITE_LLM_API_KEY || '',
    baseURL: import.meta.env.VITE_LLM_BASE_URL || getDefaultBaseURL(provider),
    model: import.meta.env.VITE_LLM_MODEL || getDefaultModel(provider),
  };
};

function getDefaultBaseURL(provider: LLMProvider): string {
  switch (provider) {
    case 'supabase-edge':
      // Supabase Edge Function via supabase.functions.invoke
      return '';
    case 'vercel-proxy':
      return '/api';
    case 'huggingface':
      return 'https://api-inference.huggingface.co/models';
    case 'github-models':
      return 'https://models.inference.ai.azure.com';
    case 'ollama':
      return 'http://localhost:11434/api';
    case 'openai-compatible':
      return 'https://api.openai.com/v1';
    default:
      return '/api';
  }
}

function getDefaultModel(provider: LLMProvider): string {
  switch (provider) {
    case 'supabase-edge':
      return 'gpt-4o-mini';
    case 'vercel-proxy':
      return 'gpt-4o-mini';
    case 'huggingface':
      return 'meta-llama/Llama-3.2-3B-Instruct';
    case 'github-models':
      return 'meta-llama/Llama-3.2-11B-Vision-Instruct';
    case 'ollama':
      return 'llama3.2:3b';
    case 'openai-compatible':
      return 'gpt-4o-mini';
    default:
      return 'llama3.2:3b';
  }
}

// ==============================================
// Provider Implementations
// ==============================================

async function callSupabaseEdge(
  messages: Array<{ role: string; content: string }>,
  config: LLMConfig
): Promise<LLMResponse> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }

  const { data, error } = await supabase.functions.invoke('llm', {
    body: {
      model: config.model,
      messages,
      provider: 'openai',
    },
  });

  if (error) {
    // Supabase Functions error shape differs depending on network/runtime
    throw new Error(`Supabase Edge LLM error: ${error.message || String(error)}`);
  }

  return {
    text: (data as any)?.text || '',
    provider: (data as any)?.provider,
    model: (data as any)?.model,
    usage: (data as any)?.usage,
  };
}

async function callVercelProxy(
  messages: Array<{ role: string; content: string }>,
  config: LLMConfig
): Promise<LLMResponse> {
  const response = await fetch(`${config.baseURL}/llm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      provider: 'openai', // Can be extended to support other providers
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Vercel LLM proxy error: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data?.text || '',
    provider: data?.provider,
    model: data?.model,
    usage: data?.usage,
  };
}

async function callHuggingFace(
  prompt: string,
  config: LLMConfig
): Promise<LLMResponse> {
  const response = await fetch(`${config.baseURL}/${config.model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data[0]?.generated_text || '',
    provider: 'huggingface',
    model: config.model,
  };
}

async function callGitHubModels(
  messages: Array<{ role: string; content: string }>,
  config: LLMConfig
): Promise<LLMResponse> {
  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: config.model,
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub Models API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    provider: 'github-models',
    model: config.model,
    usage: data.usage,
  };
}

async function callOllama(
  messages: Array<{ role: string; content: string }>,
  config: LLMConfig
): Promise<LLMResponse> {
  const response = await fetch(`${config.baseURL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 500,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.message?.content || '',
    provider: 'ollama',
    model: config.model,
  };
}

async function callOpenAICompatible(
  messages: Array<{ role: string; content: string }>,
  config: LLMConfig
): Promise<LLMResponse> {
  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    provider: 'openai-compatible',
    model: config.model,
    usage: data.usage,
  };
}

// ==============================================
// Main LLM Call Function
// ==============================================

async function callLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const config = getLLMConfig();
  const messages = buildMessages(systemPrompt, userPrompt);

  // Check API key requirement
  if (!config.apiKey && config.provider !== 'ollama' && config.provider !== 'vercel-proxy') {
    console.warn(`LLM_API_KEY not set for provider: ${config.provider}. Using fallback.`);
    return '';
  }

  try {
    let response: LLMResponse;

    switch (config.provider) {
      case 'supabase-edge':
        response = await callSupabaseEdge(messages, config);
        break;
      case 'vercel-proxy':
        response = await callVercelProxy(messages, config);
        break;
      case 'huggingface':
        // HuggingFace uses single prompt format
        const combinedPrompt = `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`;
        response = await callHuggingFace(combinedPrompt, config);
        break;
      case 'github-models':
        response = await callGitHubModels(messages, config);
        break;
      case 'ollama':
        response = await callOllama(messages, config);
        break;
      case 'openai-compatible':
        response = await callOpenAICompatible(messages, config);
        break;
      default:
        throw new Error(`Unknown LLM provider: ${config.provider}`);
    }

    console.log(`[LLM] Response from ${response.provider || config.provider}: ${response.text.length} chars`);
    return response.text;

  } catch (error) {
    console.error('[LLM] API Error:', error);
    return '';
  }
}

// ==============================================
// Public API Functions
// ==============================================

export const generateProposalPitch = async (
  selections: SelectionState,
  categories: Category[],
  tripConfig: TripConfig,
  totalPrice: number,
  audience: AudienceType = 'GENERAL'
): Promise<string> => {
  // Build configurations summary
  let configurationsText = '';
  categories.forEach(cat => {
    const selected = selections[cat.id];
    if (selected) {
      configurationsText += `- ${cat.title}: ${selected.title} (${selected.description})\n`;
    }
  });

  const { system, user } = buildProposalPrompt({
    destination: tripConfig.tripName.split(' ')[0] || '日本',
    duration: '5天4夜',
    headcount: 50,
    budgetMin: tripConfig.basePrice,
    budgetMax: totalPrice,
    currency: tripConfig.currency,
    requirements: '無特殊需求',
    audience,
    configurations: configurationsText || '標準配置',
  });

  try {
    const result = await callLLM(system, user);

    if (result) {
      return result;
    }

    // Fallback responses
    const mockPitches: Record<AudienceType, string> = {
      'TECH': '這趟旅程結合了頂尖科技與傳統文化，讓您的團隊在高效能環境中充電，體驗日本職人精神。精選的行程配置確保每位成員都能在放鬆中激發靈感，是科技人最需要的 Digital Detox。',
      'SALES': '精選的行程配置確保每位貴賓都能感受尊榮禮遇，是犒賞業績達標團隊的最佳選擇。豐富的夜生活安排與社交場合，讓團隊凝聚力更上層樓。',
      'EXECUTIVE': '行程設計兼顧商務效率與文化深度，適合高階主管放鬆身心並拓展視野。獨家安排的私人導覽與尊榮禮遇，彰顯您對團隊的重視。',
      'GENERAL': '我們為您精心規劃的黃金路線，涵蓋必訪景點與在地體驗，讓旅程充滿驚喜與感動。專業領隊全程服務，確保每位團員都能盡興而歸。',
    };
    return mockPitches[audience] || mockPitches.GENERAL;

  } catch (error) {
    console.error('[LLM] generateProposalPitch Error:', error);
    return '體驗一生難忘的旅程。您的客製化配置已準備就緒，請檢閱詳細行程。';
  }
};

export const generateKillerCopy = async (
  targetOption: Option
): Promise<string> => {
  const { system, user } = buildCompetitorWarningPrompt({
    optionTitle: targetOption.title,
    optionDescription: targetOption.description,
  });

  try {
    const result = await callLLM(system, user);

    if (result) {
      return result;
    }

    return `警告：選擇低價替代方案可能讓您錯失「${targetOption.title}」帶來的獨特體驗與安心保障。`;

  } catch (error) {
    console.error('[LLM] generateKillerCopy Error:', error);
    return '與此選項相比，一般的替代方案可能無法達到相同的高標準舒適度與服務。';
  }
};

export const generateRFPSummary = async (rfpData: {
  companyName: string;
  contactPerson: string;
  headcount: number;
  budgetMin: number;
  budgetMax: number;
  destination: string;
  duration: number;
  departureDate?: string;
  deadline: string;
  specialRequirements?: string;
  notes?: string;
}): Promise<string> => {
  const { system, user } = buildRFPSummaryPrompt(rfpData);

  try {
    const result = await callLLM(system, user);

    if (result) {
      return result;
    }

    // Fallback summary
    return `【RFP 摘要】
客戶：${rfpData.companyName}
人數：${rfpData.headcount} 人
預算：${rfpData.budgetMin.toLocaleString()} - ${rfpData.budgetMax.toLocaleString()} TWD/人
目的地：${rfpData.destination}（${rfpData.duration} 天）
截止日：${rfpData.deadline}

建議密切關注截止日期，並準備競爭力報價。`;

  } catch (error) {
    console.error('[LLM] generateRFPSummary Error:', error);
    return '無法生成 RFP 摘要，請稍後再試。';
  }
};

export const generateItineraryDescription = async (params: {
  dayNumber: number;
  location: string;
  activities: string;
  meals?: string;
  accommodation?: string;
}): Promise<string> => {
  const systemPrompt = `你是一位經驗豐富的行程規劃師，專長撰寫生動的行程描述。
使用繁體中文，控制在 50-80 字，語氣專業但溫暖。`;

  const userPrompt = `請為以下行程日撰寫描述：
日期：第 ${params.dayNumber} 天
地點：${params.location}
主要活動：${params.activities}
${params.meals ? `餐食安排：${params.meals}` : ''}
${params.accommodation ? `住宿：${params.accommodation}` : ''}

只輸出描述文字。`;

  try {
    const result = await callLLM(systemPrompt, userPrompt);
    return result || `第 ${params.dayNumber} 天將在${params.location}展開精彩旅程，${params.activities}。`;
  } catch (error) {
    console.error('[LLM] generateItineraryDescription Error:', error);
    return `第 ${params.dayNumber} 天：${params.location} - ${params.activities}`;
  }
};

// ==============================================
// Export
// ==============================================

export default {
  generateProposalPitch,
  generateKillerCopy,
  generateRFPSummary,
  generateItineraryDescription,
};
