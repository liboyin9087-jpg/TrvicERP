/**
 * AI Service Types
 * Request and response types for AI service communications
 */

export interface ChatRequest {
  message?: string;
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  mode?: string;
  context?: string;
  user_role?: string;
  user_id?: string;
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
    id?: string;
    name: string;
    arguments: Record<string, unknown>;
    status?: string;
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
    reason?: string;
  }>;
  blocked_actions?: Array<{
    id: string;
    reason: string;
    call?: any;
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
  llm_configured?: boolean;
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
  message?: string;
  prompt?: string;
  schema?: Record<string, unknown>;
  mode?: string;
  context?: string;
  user_role?: string;
  user_id?: string;
  max_attempts?: number;
  model?: string;
}

export interface StructuredOutputResponse<T = Record<string, unknown>> {
  id: string;
  data: T;
  raw: string;
  schema?: Record<string, unknown>;
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
