/**
 * AI Copilot 型別定義
 */

import type { ViewKey } from '../store/useAppStore';
import type { WidgetConfig, WidgetLayout, WidgetType } from '../core/types/dashboard';

// AI 專家模式
export type AIMode = 'itinerary' | 'marketing' | 'costing' | 'legal' | 'general';

// AI 模式選項
export interface AIModeOption {
  id: AIMode;
  label: string;
  description: string;
}

// 函數呼叫型別
export interface FunctionCall {
  name: FunctionName;
  arguments: FunctionArguments;
}

// 可用函數名稱
export type FunctionName =
  | 'navigate'
  | 'showCustomerData'
  | 'showQuotation'
  | 'showItinerary'
  | 'setDashboardEditMode'
  | 'addDashboardWidget'
  | 'removeDashboardWidget'
  | 'updateDashboardWidget';

// 函數參數型別
export type FunctionArguments =
  | NavigateArguments
  | ShowCustomerDataArguments
  | ShowQuotationArguments
  | ShowItineraryArguments
  | SetDashboardEditModeArguments
  | AddDashboardWidgetArguments
  | RemoveDashboardWidgetArguments
  | UpdateDashboardWidgetArguments;

export interface NavigateArguments {
  viewKey: ViewKey;
}

export interface ShowCustomerDataArguments {
  searchQuery?: string;
}

export interface ShowQuotationArguments {
  destination?: string;
}

export interface ShowItineraryArguments {
  sessionId?: string;
}

export interface SetDashboardEditModeArguments {
  enabled: boolean;
}

export interface AddDashboardWidgetArguments {
  type: WidgetType;
  title?: string;
  config?: WidgetConfig;
  layout?: Partial<WidgetLayout>;
}

export interface RemoveDashboardWidgetArguments {
  id: string;
}

export interface UpdateDashboardWidgetArguments {
  id: string;
  title?: string;
  config?: Partial<WidgetConfig>;
  layout?: Partial<WidgetLayout>;
}

// API 請求/回應型別
export interface ChatRequest {
  message: string;
  mode: AIMode;
  context?: string;
}

export interface ChatResponse {
  reply: string;
  mode: AIMode;
  mode_description: string;
  function_calls?: FunctionCall[] | null;
  image_url?: string | null;
  image_prompt?: string | null;
}

// 健康檢查回應
export interface HealthResponse {
  status: string;
  llm_configured: boolean;
  rules_loaded: boolean;
}

// 模式列表回應
export interface ModesResponse {
  modes: AIModeOption[];
}

// 聊天訊息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCalls?: FunctionCall[];
  imageUrl?: string;
  imagePrompt?: string;
}
