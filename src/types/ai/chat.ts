/**
 * Chat and conversation types
 */

export interface ChatSession {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
}

export interface ChatState {
  currentSession?: ChatSession;
  isLoading: boolean;
  error?: string;
  lastActivityTime?: number;
}

export interface ChatConfig {
  maxMessages: number;
  sessionTimeout: number;
  enablePersistence: boolean;
  maxRetries: number;
}
