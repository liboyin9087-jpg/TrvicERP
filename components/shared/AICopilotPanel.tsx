import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, X, Sparkles, ChevronRight, ChevronLeft,
  Copy, Check, Loader2, Map, Megaphone, Calculator, Scale, MessageCircle,
  Play, AlertCircle, RefreshCw, Maximize2, Minimize2, Settings, GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
// import { aiService } from '@/lib/ai/aiService'; // Moved to useAICopilotChat hook
import { useFunctionExecutor, type FunctionExecutionResult } from '@/hooks/useFunctionExecutor';
// import { useAppStore } from '@/store/useAppStore'; // Removed direct dependency
import type { AIMode, ChatMessage, FunctionCall, PendingAction } from '@/types/ai';

// ============================================
// Custom Hook for AI Chat Logic (Conceptual, assumed to be in a separate file)
// ============================================

interface UseAICopilotChatProps {
  userRole: string | null;
  userId: string | null;
  initialMessages?: ChatMessage[];
  defaultMode?: AIMode;
}

interface UseAICopilotChatReturn {
  messages: ChatMessage[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  currentMode: AIMode;
  setCurrentMode: (mode: AIMode) => void;
  sendMessage: (messageContent: string) => Promise<void>;
  handleExecuteFunction: (call: FunctionCall) => void;
  handleApprovePending: (action: PendingAction) => void;
  clearHistory: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

// NOTE: In a real project, this hook would be in its own file (e.g., /hooks/useAICopilotChat.ts)
const useAICopilotChat = ({
  userRole,
  userId,
  initialMessages = [
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 TrvicERP AI 助手 ✨\n\n我可以幫你：\n• 規劃行程與景點安排\n• 撰寫行銷文案\n• 計算成本與報價\n• 查詢旅遊法規\n\n請問有什麼需要幫忙的嗎？',
      timestamp: Date.now(),
    },
  ],
  defaultMode = 'general',
}: UseAICopilotChatProps): UseAICopilotChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AIMode>(defaultMode);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Note: useFunctionExecutor is called but may not be actively used in this component.
  // The stub config is provided to satisfy the hook's type requirements.
  // TODO: Either integrate proper function execution or remove this hook if not needed.
  const { executeFunction, executeFunctions } = useFunctionExecutor({
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // NOTE: aiService import must be available within the hook's scope.
      // Assuming '@/lib/ai/aiService' is correctly imported into the hook file.
      const aiService = await import('@/lib/ai/aiService').then(mod => mod.aiService);

      const response = await aiService.chat({
        message: userMessage.content,
        mode: currentMode,
        user_role: userRole,
        user_id: userId || undefined,
      });

      let functionResults: FunctionExecutionResult[] = [];
      if (response.function_calls && response.function_calls.length > 0) {
        functionResults = executeFunctions(response.function_calls);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
        functionCalls: response.function_calls || undefined,
        ragSources: response.rag_sources || undefined,
        pendingActions: response.pending_actions || undefined,
        blockedActions: response.blocked_actions || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，發生了錯誤：${error instanceof Error ? error.message : '未知錯誤'}\n\n請稍後再試。`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentMode, isLoading, userRole, userId, executeFunctions]);

  const handleExecuteFunction = useCallback((call: FunctionCall) => {
    const result = executeFunction(call);
    const feedbackMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: result.success
        ? `✅ 已執行：${result.message}`
        : `❌ 執行失敗：${result.message}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, feedbackMessage]);
  }, [executeFunction]);

  const handleApprovePending = useCallback((action: PendingAction) => {
    const result = executeFunction(action.call);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.pendingActions?.some((a) => a.id === action.id)
          ? { ...msg, pendingResolved: true }
          : msg
      )
    );
    const feedbackMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: result.success
        ? `✅ 已確認執行：${result.message}`
        : `❌ 執行失敗：${result.message}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, feedbackMessage]);
  }, [executeFunction]);

  const clearHistory = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '對話已清除。有什麼需要幫忙的嗎？',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    currentMode,
    setCurrentMode,
    sendMessage,
    handleExecuteFunction,
    handleApprovePending,
    clearHistory,
    messagesEndRef,
    inputRef,
  };
};

// ============================================
// Config Definitions for Dashtail UI
// ============================================

// Standardized mode options using general Tailwind colors for consistency
interface ModeOption {
  id: AIMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  colorClass: string; // Use colorClass instead of color to emphasize Tailwind class
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'general',
    label: '一般諮詢',
    icon: <MessageCircle className="w-4 h-4" />,
    description: '通用問答',
    colorClass: 'bg-gray-600', // Standard gray for neutral/general
  },
  {
    id: 'itinerary',
    label: '行程規劃',
    icon: <Map className="w-4 h-4" />,
    description: '行程建議與安排',
    colorClass: 'bg-blue-600', // Standard blue for info/primary related tasks
  },
  {
    id: 'marketing',
    label: '行銷文案',
    icon: <Megaphone className="w-4 h-4" />,
    description: '文案生成與優化',
    colorClass: 'bg-purple-600', // Standard purple for secondary/accent related tasks
  },
  {
    id: 'costing',
    label: '成本估算',
    icon: <Calculator className="w-4 h-4" />,
    description: '報價與成本分析',
    colorClass: 'bg-green-600', // Standard green for success/positive related tasks
  },
  {
    id: 'legal',
    label: '法規諮詢',
    icon: <Scale className="w-4 h-4" />,
    description: '旅遊法規查詢',
    colorClass: 'bg-yellow-600', // Standard yellow for warning/caution related tasks
  },
];

// ============================================
// Message Component
// ============================================

interface MessageBubbleProps {
  message: ChatMessage;
  onExecuteFunction?: (call: FunctionCall) => void;
  onApprovePending?: (action: PendingAction) => void;
}

function MessageBubble({ message, onExecuteFunction, onApprovePending }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-3 font-sans text-base', // Added font and base text size
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        isUser
          ? 'bg-primary-500 text-primary-foreground' // Use primary token for user avatar
          : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white' // Standardized gradient using common shades
      )}>
        {isUser ? (
          <span className="text-sm font-semibold">U</span>
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 max-w-[85%]',
        isUser ? 'text-right' : 'text-left'
      )}>
        <div className={cn(
          'inline-block px-4 py-3 rounded-2xl',
          isUser
            ? 'bg-primary-500 text-primary-foreground rounded-br-md' // Use primary token for user bubble
            : 'bg-gradient-to-br from-primary-700 to-primary-800 text-white rounded-bl-md border border-primary-600'
        )}>
          {/* Message Content */}
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>

          {/* Function Calls */}
          {message.functionCalls && message.functionCalls.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
              <div className="text-sm text-white/60 mb-2">執行的操作：</div>
              {message.functionCalls.map((call, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2 py-1.5 bg-white/10 rounded-lg text-sm"
                >
                  <Play className="w-3 h-3 text-green-400" /> {/* Standard green for success/play */}
                  <span className="font-mono">{call.name}</span>
                  {onExecuteFunction && (
                    <button
                      onClick={() => onExecuteFunction(call)}
                      className="ml-auto text-primary-300 hover:text-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1 py-0.5 transition-colors duration-200 ease-in-out" // Use primary token
                    >
                      重新執行
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pending Actions */}
          {message.pendingActions && message.pendingActions.length > 0 && !message.pendingResolved && (
            <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
              <div className="text-sm text-yellow-400 mb-2 flex items-center gap-1"> {/* Standard yellow for warning */}
                <AlertCircle className="w-3 h-3" />
                需要確認的操作：
              </div>
              {message.pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center gap-2 px-2 py-1.5 bg-yellow-500/20 rounded-lg text-sm border border-yellow-500/30" // Standard yellow for warning
                >
                  <span className="flex-1">{action.reason}</span>
                  {onApprovePending && (
                    <button
                      onClick={() => onApprovePending(action)}
                      className="px-2 py-0.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200 ease-in-out" // Standard yellow for warning
                    >
                      確認執行
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* RAG Sources */}
          {message.ragSources && message.ragSources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="text-sm text-white/60 mb-1">參考來源：</div>
              <div className="text-sm text-white/40 space-y-1">
                {message.ragSources.map((source, idx) => (
                  <div key={idx} className="truncate">• {source}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-1 px-2">
            <button
              onClick={handleCopy}
              className="p-1 text-white/40 hover:text-white/80 rounded transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500" // Use primary token
              title="複製"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
            <span className="text-xs text-white/30"> {/* Changed to xs for better hierarchy */}
              {new Date(message.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

interface AICopilotPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  userRole?: string | null; // Config prop from parent
  userId?: string | null;   // Config prop from parent
}

export default function AICopilotPanel({ isOpen, onToggle, userRole = null, userId = null }: AICopilotPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    currentMode,
    setCurrentMode,
    sendMessage,
    handleExecuteFunction,
    handleApprovePending,
    clearHistory,
    messagesEndRef,
    inputRef,
  } = useAICopilotChat({ userRole, userId });

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const panelWidth = isExpanded ? 'w-[60%]' : 'w-1/2'; // Max 800px, min 400px constraint is already there

  return (
    <>
      {/* Toggle Button (when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={onToggle}
            className="fixed right-6 bottom-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-primary-foreground rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out text-base font-sans focus:outline-none focus:ring-2 focus:ring-primary-500" // Use primary token
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">AI 助手</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed right-0 top-0 bottom-0 z-50 flex flex-col',
              'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950', // Standardized dark neutral background
              'border-l border-border shadow-2xl', // Using a generic border token
              panelWidth,
              'min-w-[400px] max-w-[800px] font-sans text-base' // Added font and base text size
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border text-foreground"> {/* Using generic border and foreground token */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center"> {/* Standardized gradient */}
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">AI Copilot</h2>
                  <p className="text-sm text-muted-foreground">智慧旅遊助手</p> {/* Using muted-foreground token */}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Drag Handle */}
                <div className="drag-handle p-2 text-muted-foreground hover:text-foreground cursor-grab transition-colors duration-200 ease-in-out" title="拖曳">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Expand/Collapse */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500" // Use primary token
                  title={isExpanded ? '縮小' : '放大'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Clear */}
                <button
                  onClick={clearHistory}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500" // Use primary token
                  title="清除對話"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Close */}
                <button
                  onClick={onToggle}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500" // Use primary token
                  title="關閉"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {MODE_OPTIONS.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setCurrentMode(mode.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500', // Use primary token
                      currentMode === mode.id
                        ? 'bg-accent text-accent-foreground border border-border' // Use accent tokens
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50' // Use muted/foreground and accent tokens
                    )}
                  >
                    <div className={cn('w-5 h-5 rounded-md flex items-center justify-center text-white', mode.colorClass)}>
                      {mode.icon}
                    </div>
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onExecuteFunction={handleExecuteFunction}
                  onApprovePending={handleApprovePending}
                />
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 font-sans text-base"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center"> {/* Standardized gradient */}
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="px-4 py-3 bg-accent rounded-2xl rounded-bl-md"> {/* Use accent token */}
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /> {/* Use muted-foreground */}
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="輸入訊息... (Shift+Enter 換行)"
                    rows={1}
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ease-in-out text-sm font-sans" // Use standard input, border, foreground, muted-foreground, primary tokens
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    'px-4 py-3 rounded-lg font-semibold transition-all duration-200 ease-in-out flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500', // Use primary token
                    inputValue.trim() && !isLoading
                      ? 'bg-primary-500 text-primary-foreground hover:bg-primary-600' // Use primary token
                      : 'bg-muted text-muted-foreground cursor-not-allowed' // Use muted tokens
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Mode indicator */}
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground font-sans"> {/* Changed to xs */}
                <span>
                  模式：{MODE_OPTIONS.find(m => m.id === currentMode)?.label}
                </span>
                <span>按 Enter 發送</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40" // Standardized dark overlay
          />
        )}
      </AnimatePresence>
    </>
  );
}