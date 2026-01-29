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
  model: string;
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
  description: string;
  enabled: boolean;
}

export interface StructuredOutputRequest {
  prompt: string;
  schema: Record<string, unknown>;
  model?: string;
}

export interface StructuredOutputResponse {
  id: string;
  data: Record<string, unknown>;
  raw: string;
}

// Function argument types for AI functions
export interface NavigateArguments {
  page: string;
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
}

export interface SetDashboardEditModeArguments {
  enabled: boolean;
}

export interface AddDashboardWidgetArguments {
  type: string;
  config: Record<string, unknown>;
}

export interface RemoveDashboardWidgetArguments {
  widgetId: string;
}

export interface UpdateDashboardWidgetArguments {
  widgetId: string;
  config: Record<string, unknown>;
}
