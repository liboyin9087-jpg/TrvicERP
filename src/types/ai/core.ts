/**
 * Core AI types and interfaces
 */

export type AIMode = 'chat' | 'analysis' | 'generation' | 'suggestion' | 'general' | 'itinerary' | 'marketing' | 'costing' | 'legal' | 'green';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  functionCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
  ragSources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  pendingActions?: Array<{
    id: string;
    action: string;
    status: string;
  }>;
  blockedActions?: Array<{
    id: string;
    reason: string;
  }>;
  pendingResolved?: boolean;
}

export interface FunctionCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

export interface PendingAction {
  id: string;
  type?: string;
  action?: string;
  description?: string;
  requiredApproval?: boolean;
  status?: string;
  data?: Record<string, unknown>;
  reason?: string;
  call?: FunctionCall;
}

export interface AIContext {
  mode: AIMode;
  userId: string;
  userRole: 'admin' | 'staff' | 'traveler';
  conversationId?: string;
  sessionData?: Record<string, unknown>;
}
