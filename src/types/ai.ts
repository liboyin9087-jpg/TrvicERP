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

export interface PendingAction {
  id: string;
  call: FunctionCall;
  reason: string;
}

export interface ProposalTier {
  name: string;
  price_per_person: number;
  margin_percent: number;
  lodging: string;
  transport: string;
  meals: string;
  highlights: string[];
}

export interface ProposalComparisonOutput {
  title: string;
  summary: string;
  tiers: ProposalTier[];
  inclusions: string[];
  exclusions: string[];
  safety_commitments: string[];
}

export interface ItineraryActivity {
  time: string;
  title: string;
  stay_hours: number;
  notes?: string | null;
}

export interface ItineraryDay {
  day: number;
  title: string;
  meals: string[];
  lodging: string;
  activities: ItineraryActivity[];
}

export interface ItineraryOutput {
  title: string;
  days: ItineraryDay[];
  highlights: string[];
  cautions: string[];
}

export interface NpsInsightOutput {
  nps_score: number;
  response_count: number;
  promoter_ratio: number;
  detractor_ratio: number;
  key_themes: string[];
  improvement_actions: string[];
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
  user_role?: string;
  user_id?: string;
}

export interface StructuredOutputRequest {
  message: string;
  mode: AIMode;
  context?: string;
  schema: 'itinerary' | 'proposal_comparison' | 'nps_insight';
  user_role?: string;
  user_id?: string;
  max_attempts?: number;
}

export interface StructuredOutputResponse<T = Record<string, any>> {
  schema: string;
  data: T;
  raw_text: string;
  attempts: number;
  provider: string;
}

export interface ChatResponse {
  reply: string;
  mode: AIMode;
  mode_description: string;
  function_calls?: FunctionCall[] | null;
  image_url?: string | null;
  image_prompt?: string | null;
  rag_sources?: string[] | null;
  pending_actions?: PendingAction[] | null;
  blocked_actions?: PendingAction[] | null;
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
  ragSources?: string[];
  pendingActions?: PendingAction[];
  blockedActions?: PendingAction[];
  pendingResolved?: boolean;
}
