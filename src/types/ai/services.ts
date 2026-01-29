/**
 * AI Service Types
 * Request and response types for AI service communications
 */

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  id: string;
  content: string;
  reply?: string;
  model: string;
  function_calls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
  rag_sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  pending_actions?: Array<{
    id: string;
    action: string;
    status: string;
  }>;
  blocked_actions?: Array<{
    id: string;
    reason: string;
  }>;
  image_url?: string;
  image_prompt?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  timestamp: number;
}

export interface ModesResponse {
  modes: AIModeOption[];
  defaultMode: string;
}

export interface AIModeOption {
  id: string;
  name: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface StructuredOutputRequest {
  prompt: string;
  schema: Record<string, unknown>;
  model?: string;
}

export interface StructuredOutputResponse<T = Record<string, unknown>> {
  id: string;
  data: T;
  raw: string;
}

// Function argument types for AI functions
export interface NavigateArguments {
  page: string;
  viewKey?: string;
  params?: Record<string, unknown>;
}

export interface ShowCustomerDataArguments {
  customerId: string;
}

export interface ShowQuotationArguments {
  quotationId: string;
}

export interface ShowItineraryArguments {
  itineraryId: string;
  sessionId?: string;
}

export interface SetDashboardEditModeArguments {
  enabled: boolean;
}

export interface AddDashboardWidgetArguments {
  type: string;
  config: Record<string, unknown>;
}

export interface RemoveDashboardWidgetArguments {
  id?: string;
  widgetId: string;
}

export interface UpdateDashboardWidgetArguments {
  id?: string;
  widgetId: string;
  config: Record<string, unknown>;
}
