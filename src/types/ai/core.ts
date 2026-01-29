/**
 * Core AI types and interfaces
 */

export type AIMode = 'chat' | 'analysis' | 'generation' | 'suggestion' | 'general' | 'itinerary' | 'marketing' | 'costing' | 'legal';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  functionCalls?: FunctionCall[];
  ragSources?: string[];
  pendingActions?: PendingAction[];
  blockedActions?: string[];
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
  type: string;
  description: string;
  requiredApproval: boolean;
  data: Record<string, unknown>;
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
