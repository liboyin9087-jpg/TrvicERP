/**
 * AI API and service types
 */

export interface AIAPIRequest {
  type: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AIAPIResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  requestId?: string;
}

export interface AIServiceConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export interface AIStreamEvent {
  type: 'start' | 'data' | 'end' | 'error';
  data?: unknown;
  error?: string;
}
