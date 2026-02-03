import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, X, Maximize2, Minimize2, Sparkles, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { aiService } from '@/lib/ai/aiService';
import { useFunctionExecutor } from '@/hooks/useFunctionExecutor';

// --- Start: Type Definitions (should ideally be in src/types/ai.ts or similar shared file) ---

export type AIMode = 'general' | 'itinerary' | 'marketing' | 'costing' | 'legal';

export interface AIModeOption {
  id: AIMode;
  label: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCalls?: any[]; // For detailed type, define specific function call interfaces
  imageUrl?: string;
  imagePrompt?: string;
  ragSources?: Array<{ title: string; url: string; snippet: string }> | string[];
  pendingActions?: Array<{ id: string; action: string; status: string; reason?: string }>;
  blockedActions?: Array<{ id: string; reason: string; call?: any }>;
  pendingResolved?: boolean;
}

// Minimal type definition for DashboardWidget, based on original usage.
// In a full project, this would likely come from a more central types file.
export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  config: Record<string, any>; // Flexible config, could be more specific
  layout: Record<string, any>; // Flexible layout, could be more specific
}

// --- End: Type Definitions ---


// --- Start: Configuration and i18n Definitions ---

// i18n Interface for all display strings
interface EdgeAssistantI18n {
  title: string;
  subtitle: string;
  closeButtonTitle: string;
  expandButtonTitle: string;
  minimizeButtonTitle: string;
  openAssistantButtonTitle: string;
  inputPlaceholder: string;
  sendButtonTitle: string;
  loadingMessage: string;
  errorMessage: string;
  errorMessageRetry: string; // Placeholder for {error}
  functionExecutedDefaultReply: string; // Default reply if AI doesn't give one
  functionExecutionResults: string;
  functionExecutionSuccess: string; // Placeholder for {name}
  functionExecutionWarning: string; // Placeholder for {name}
  regulatorySources: string;
  blockedActions: string;
  pendingActions: string;
  confirmExecute: string;
  cancel: string;
  pendingActionsResolvedContent: string; // For the message when pending actions are cancelled
  initialWelcomeMessage: string;
  quickActions: string[];
  modes: AIModeOption[]; // Modes are now part of i18n for their labels and descriptions
}

// Default i18n content for the assistant. This can be overridden by props.
const DEFAULT_I18N: EdgeAssistantI18n = {
  title: 'AI 助理',
  subtitle: '隨時為您服務',
  closeButtonTitle: '關閉',
  expandButtonTitle: '放大',
  minimizeButtonTitle: '縮小',
  openAssistantButtonTitle: '開啟 AI 助理',
  inputPlaceholder: '輸入訊息...',
  sendButtonTitle: '發送',
  loadingMessage: '正在處理中...',
  errorMessage: 'AI 服務暫時無法使用',
  errorMessageRetry: '抱歉，發生錯誤：{error}。請稍後再試。',
  functionExecutedDefaultReply: '已完成操作。',
  functionExecutionResults: '執行結果：',
  functionExecutionSuccess: '✅ {name}',
  functionExecutionWarning: '⚠️ {name}',
  regulatorySources: '法規引用：',
  blockedActions: '已阻擋的操作：',
  pendingActions: '待確認操作：',
  confirmExecute: '確認執行',
  cancel: '取消',
  pendingActionsResolvedContent: '\n\n已取消待確認的操作。',
  initialWelcomeMessage: '您好！我是 TrvicERP AI 助理，有什麼可以幫助您的嗎？您可以問我關於行程規劃、報價計算、法規諮詢等問題，或請我幫您導航到特定頁面。',
  quickActions: ['推薦熱門行程', '查詢客戶資料', '計算報價', '法規諮詢'],
  modes: [
    { id: 'general', label: '🧭 通用', description: '團控通用助手' },
    { id: 'itinerary', label: '📅 行程', description: '行程規劃專家' },
    { id: 'marketing', label: '✨ 行銷', description: '行銷文案專家' },
    { id: 'costing', label: '💰 成本', description: '成本試算專家' },
    { id: 'legal', label: '⚖️ 法規', description: '法規諮詢專家' },
  ],
};

// Props interface for the EdgeAssistant component
interface EdgeAssistantProps {
  // Data for AI context and function execution (replaces global store dependencies)
  currentView: string;
  userRole: string;
  userName: string;
  userId?: string;
  widgets: DashboardWidget[]; // Use the defined DashboardWidget type
  isEditMode: boolean;

  // Configuration for the assistant itself
  initialMode?: AIMode; // Initial mode for the AI assistant
  i18n?: Partial<EdgeAssistantI18n>; // i18n overrides
  initialIsOpen?: boolean; // Controls initial open state for embedding
  initialIsExpanded?: boolean; // Controls initial expanded state for embedding

  // Callbacks for external interactions (e.g., if parent needs to know state changes)
  onOpenChange?: (isOpen: boolean) => void;
  onExpandChange?: (isExpanded: boolean) => void;
}

// --- End: Configuration and i18n Definitions ---


export default function EdgeAssistant({
  currentView,
  userRole,
  userName,
  userId,
  widgets,
  isEditMode,
  initialMode = 'general',
  i18n,
  initialIsOpen = false,
  initialIsExpanded = false,
  onOpenChange,
  onExpandChange,
}: EdgeAssistantProps) {
  // Merge default i18n with any provided overrides
  const mergedI18n = useMemo(() => ({ ...DEFAULT_I18N, ...i18n }), [i18n]);

  const [isOpen, setIsOpenState] = useState(initialIsOpen);
  const [isExpanded, setIsExpandedState] = useState(initialIsExpanded);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<AIMode>(initialMode);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: '1',
      role: 'assistant',
      content: mergedI18n.initialWelcomeMessage,
      timestamp: new Date(),
    },
  ]);

  // Handle state changes and propagate via callbacks
  const handleSetIsOpen = useCallback((value: boolean) => {
    setIsOpenState(value);
    onOpenChange?.(value);
  }, [onOpenChange]);

  const handleSetIsExpanded = useCallback((value: boolean) => {
    setIsExpandedState(value);
    onExpandChange?.(value);
  }, [onExpandChange]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);
  const { executeFunctions } = useFunctionExecutor({
    setCurrentView: () => {},
    setSelectedSession: () => {},
    validViewKeys: [],
    getDashboardState: () => ({ widgets: [], availableWidgets: [] }),
    setDashboardEditMode: () => {},
    addDashboardWidget: () => {},
    removeDashboardWidget: () => {},
    updateDashboardWidgetConfig: () => {},
    updateDashboardWidgetLayout: () => {},
    updateDashboardWidgetTitle: () => {},
  });

  // AI Context derived from props
  const aiContext = useMemo(() => {
    // Limit widgets to a reasonable number to prevent excessive context size
    const dashboardWidgets = widgets.slice(0, 12).map((widget) => ({
      id: widget.id,
      type: widget.type,
      title: widget.title,
      config: widget.config,
      layout: widget.layout,
    }));
    return JSON.stringify({
      currentView,
      userRole,
      userName,
      dashboard: {
        editMode: isEditMode,
        widgets: dashboardWidgets,
      },
    });
  }, [currentView, isEditMode, userName, userRole, widgets]);

  // Scroll to latest message when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close mode selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target as Node)) {
        setShowModeSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiService.chat({
        message: input,
        mode: currentMode,
        context: aiContext,
        user_role: userRole,
        user_id: userId || undefined,
      });

      // Execute function calls
      const executionResults =
        response.function_calls && response.function_calls.length > 0
          ? executeFunctions(response.function_calls)
          : [];

      const executionSummary = executionResults.length
        ? `\n\n${mergedI18n.functionExecutionResults}\n${executionResults
            .map((result) =>
              result.success
                ? mergedI18n.functionExecutionSuccess.replace('{name}', result.message || result.functionName)
                : mergedI18n.functionExecutionWarning.replace('{name}', result.message || result.functionName)
            )
            .join('\n')}`
        : '';

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${response.reply || mergedI18n.functionExecutedDefaultReply}${executionSummary}`,
        timestamp: new Date(),
        functionCalls: response.function_calls || undefined,
        imageUrl: response.image_url || undefined,
        imagePrompt: response.image_prompt || undefined,
        ragSources: response.rag_sources || undefined,
        pendingActions: response.pending_actions || undefined,
        blockedActions: response.blocked_actions || undefined,
        pendingResolved: false,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : mergedI18n.errorMessage;
      setError(errorMessage);

      // Add error message to chat
      const errorAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: mergedI18n.errorMessageRetry.replace('{error}', errorMessage),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePending = (messageId: string) => {
    const target = messages.find((message) => message.id === messageId);
    if (!target?.pendingActions || target.pendingActions.length === 0) return;
    const calls = target.pendingActions.map((pending) => pending.call);
    const results = executeFunctions(calls);
    const executionSummary = results.length
      ? `\n\n${mergedI18n.functionExecutionResults}\n${results
          .map((result) =>
            `${result.success ? '✅' : '⚠️'} ${result.message || result.functionName}`
          )
          .join('\n')}`
      : '';

    const confirmMessage: ChatMessage = {
      id: `${Date.now()}-confirm`,
      role: 'assistant',
      content: `${mergedI18n.functionExecutedDefaultReply}${executionSummary}`,
      timestamp: new Date(),
    };

    setMessages((prev) =>
      prev
        .map((message) =>
          message.id === messageId
            ? { ...message, pendingActions: undefined, pendingResolved: true }
            : message
        )
        .concat(confirmMessage)
    );
  };

  const handleRejectPending = (messageId: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              pendingActions: undefined,
              pendingResolved: true,
              content: `${message.content}${mergedI18n.pendingActionsResolvedContent}`,
            }
          : message
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getCurrentModeLabel = () => {
    const mode = mergedI18n.modes.find((m) => m.id === currentMode);
    return mode?.label || mergedI18n.modes.find(m => m.id === 'general')?.label || '通用'; // Fallback
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => handleSetIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-900 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-50 focus:outline-none focus:ring-2 focus:ring-primary-600"
        title={mergedI18n.openAssistantButtonTitle}
        aria-label={mergedI18n.openAssistantButtonTitle}
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed ${
        isExpanded
          ? 'inset-4 min-w-[320px] max-w-screen min-h-[400px] max-h-screen' // Expanded state with min/max for responsiveness
          : 'bottom-6 right-6 w-96 h-[500px] min-w-80 max-w-lg min-h-96 max-h-[700px]' // Collapsed state with min/max limits
      } bg-white rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 ease-in-out`}
    >
      {/* Header - Drag Handle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 drag-handle cursor-move">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-900 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{mergedI18n.title}</h3>
            <p className="text-sm text-gray-500">{mergedI18n.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSetIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            title={isExpanded ? mergedI18n.minimizeButtonTitle : mergedI18n.expandButtonTitle}
            aria-label={isExpanded ? mergedI18n.minimizeButtonTitle : mergedI18n.expandButtonTitle}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleSetIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            title={mergedI18n.closeButtonTitle}
            aria-label={mergedI18n.closeButtonTitle}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0">
        <div className="relative" ref={modeSelectorRef}>
          <button
            onClick={() => setShowModeSelector(!showModeSelector)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600"
            aria-haspopup="true"
            aria-expanded={showModeSelector}
          >
            <span>{getCurrentModeLabel()}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
          </button>

          {showModeSelector && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1" role="menu" aria-orientation="vertical">
              {mergedI18n.modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setCurrentMode(mode.id);
                    setShowModeSelector(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                    currentMode === mode.id ? 'bg-gray-50 font-medium text-primary-800' : 'text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-gray-200`}
                  role="menuitem"
                >
                  <div className="font-medium">{mode.label}</div>
                  <div className="text-xs text-gray-500">{mode.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary-900 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.imageUrl && (
                <div className="mt-3">
                  <img
                    src={message.imageUrl}
                    alt={message.imagePrompt || 'Marketing image'}
                    className="rounded-lg border border-gray-200 max-h-64 object-cover w-full"
                  />
                  {message.imagePrompt && (
                    <p className="mt-2 text-xs text-gray-500">
                      Image prompt: {message.imagePrompt}
                    </p>
                  )}
                </div>
              )}
              {message.functionCalls && message.functionCalls.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    {mergedI18n.functionExecutedDefaultReply}: {message.functionCalls.map((fc) => fc.name).join(', ')}
                  </p>
                </div>
              )}
              {message.ragSources && message.ragSources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">{mergedI18n.regulatorySources}</p>
                  <ul className="space-y-1 text-xs text-gray-500 list-disc list-inside pl-4">
                    {message.ragSources.map((source, index) => (
                      <li key={`${message.id}-rag-${index}`} className="line-clamp-2">
                        {source}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {message.blockedActions && message.blockedActions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm text-red-500 mb-1">{mergedI18n.blockedActions}</p>
                  <ul className="space-y-1 text-xs text-gray-500 list-disc list-inside pl-4">
                    {message.blockedActions.map((action) => (
                      <li key={action.id} className="flex flex-col gap-0.5">
                        <span className="font-medium">{action.call.name}</span>
                        <span className="text-[11px] text-gray-400">{action.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {message.pendingActions && message.pendingActions.length > 0 && !message.pendingResolved && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm text-amber-600 mb-2">{mergedI18n.pendingActions}</p>
                  <ul className="space-y-1 text-xs text-gray-500 mb-3 list-disc list-inside pl-4">
                    {message.pendingActions.map((action) => (
                      <li key={action.id} className="flex flex-col gap-0.5">
                        <span className="font-medium">{action.call.name}</span>
                        <span className="text-[11px] text-gray-400">{action.reason}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleApprovePending(message.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      {mergedI18n.confirmExecute}
                    </button>
                    <button
                      onClick={() => handleRejectPending(message.id)}
                      className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      {mergedI18n.cancel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl rounded-bl-none">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0">
        {/* Quick actions */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          {mergedI18n.quickActions.map((quick) => (
            <button
              key={quick}
              onClick={() => setInput(quick)}
              className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap hover:bg-gray-200 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {quick}
            </button>
          ))}
        </div>

        {/* Input field */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mergedI18n.inputPlaceholder}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50"
            aria-label={mergedI18n.inputPlaceholder}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 bg-primary-900 text-white rounded-lg flex items-center justify-center hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-600"
            title={mergedI18n.sendButtonTitle}
            aria-label={mergedI18n.sendButtonTitle}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}