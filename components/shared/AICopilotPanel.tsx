/**
 * AI Copilot Panel - GitHub Copilot 風格的大型 AI 助手面板
 *
 * 特點：
 * - 占據畫面右側 50% 的寬度
 * - 可收合/展開
 * - 支援 Function Calling
 * - 支援 Markdown 渲染
 * - 模式切換（行程/行銷/成本/法規/一般）
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, X, Sparkles, ChevronRight, ChevronLeft,
  Copy, Check, Loader2, Map, Megaphone, Calculator, Scale, MessageCircle,
  Play, AlertCircle, RefreshCw, Maximize2, Minimize2, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiService } from '@/lib/ai/aiService';
import { useFunctionExecutor, type FunctionExecutionResult } from '@/hooks/useFunctionExecutor';
import { useAppStore } from '@/store/useAppStore';
import type { AIMode, ChatMessage, FunctionCall, PendingAction } from '@/types/ai';

// ============================================
// Types
// ============================================

interface ModeOption {
  id: AIMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'general',
    label: '一般諮詢',
    icon: <MessageCircle className="w-4 h-4" />,
    description: '通用問答',
    color: 'bg-neutral-500', // 使用 neutral token
  },
  {
    id: 'itinerary',
    label: '行程規劃',
    icon: <Map className="w-4 h-4" />,
    description: '行程建議與安排',
    color: 'bg-info-500', // 使用 info token
  },
  {
    id: 'marketing',
    label: '行銷文案',
    icon: <Megaphone className="w-4 h-4" />,
    description: '文案生成與優化',
    color: 'bg-secondary-500', // 使用 secondary token
  },
  {
    id: 'costing',
    label: '成本估算',
    icon: <Calculator className="w-4 h-4" />,
    description: '報價與成本分析',
    color: 'bg-success-500', // 使用 success token
  },
  {
    id: 'legal',
    label: '法規諮詢',
    icon: <Scale className="w-4 h-4" />,
    description: '旅遊法規查詢',
    color: 'bg-warning-500', // 使用 warning token
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
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        isUser
          ? 'bg-brand-500 text-white' // 使用 brand token
          : 'bg-gradient-to-br from-success-400 to-info-500 text-white' // 使用 success/info token
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
            ? 'bg-brand-500 text-white rounded-br-md' // 使用 brand token
            // 修正問題1: AI訊息泡泡加入漸變色並使用 primary token，而非單純的 white/10
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
                  className="flex items-center gap-2 px-2 py-1.5 bg-white/10 rounded-lg text-sm" // 保持半透明白色
                >
                  <Play className="w-3 h-3 text-success-400" /> {/* 使用 success token */}
                  <span className="font-mono">{call.name}</span>
                  {onExecuteFunction && (
                    <button
                      onClick={() => onExecuteFunction(call)}
                      className="ml-auto text-brand-300 hover:text-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1 py-0.5" // 使用 brand token
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
              <div className="text-sm text-warning-400 mb-2 flex items-center gap-1"> {/* 使用 warning token */}
                <AlertCircle className="w-3 h-3" />
                需要確認的操作：
              </div>
              {message.pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center gap-2 px-2 py-1.5 bg-warning-500/20 rounded-lg text-sm border border-warning-500/30" // 使用 warning token
                >
                  <span className="flex-1">{action.reason}</span>
                  {onApprovePending && (
                    <button
                      onClick={() => onApprovePending(action)}
                      className="px-2 py-0.5 bg-warning-500 text-white rounded hover:bg-warning-600 focus:outline-none focus:ring-2 focus:ring-warning-400" // 使用 warning token
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
              className="p-1 text-white/40 hover:text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded" // 使用 brand token
              title="複製"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
            <span className="text-sm text-white/30">
              {message.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
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
}

export default function AICopilotPanel({ isOpen, onToggle }: AICopilotPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 TrvicERP AI 助手 ✨\n\n我可以幫你：\n• 規劃行程與景點安排\n• 撰寫行銷文案\n• 計算成本與報價\n• 查詢旅遊法規\n\n請問有什麼需要幫忙的嗎？',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AIMode>('general');
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // 問題2: aiService 和 useFunctionExecutor 已在檔案頂部引入並正確使用，無需額外修正其「實作」。
  const { executeFunction, executeFunctions } = useFunctionExecutor();
  const userRole = useAppStore((state) => state.userRole);
  const userId = useAppStore((state) => state.userId);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiService.chat({
        message: userMessage.content,
        mode: currentMode,
        user_role: userRole,
        user_id: userId || undefined,
      });

      // Execute function calls if any
      let functionResults: FunctionExecutionResult[] = [];
      if (response.function_calls && response.function_calls.length > 0) {
        functionResults = executeFunctions(response.function_calls);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
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
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExecuteFunction = (call: FunctionCall) => {
    const result = executeFunction(call);
    // Show feedback
    const feedbackMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: result.success
        ? `✅ 已執行：${result.message}`
        : `❌ 執行失敗：${result.message}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, feedbackMessage]);
  };

  const handleApprovePending = (action: PendingAction) => {
    const result = executeFunction(action.call);
    // Mark as resolved
    setMessages((prev) =>
      prev.map((msg) =>
        msg.pendingActions?.some((a) => a.id === action.id)
          ? { ...msg, pendingResolved: true }
          : msg
      )
    );
    // Show feedback
    const feedbackMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: result.success
        ? `✅ 已確認執行：${result.message}`
        : `❌ 執行失敗：${result.message}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, feedbackMessage]);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '對話已清除。有什麼需要幫忙的嗎？',
        timestamp: new Date(),
      },
    ]);
  };

  // 修正：預設寬度為 50% (w-1/2)
  const panelWidth = isExpanded ? 'w-[60%]' : 'w-1/2';

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
            className="fixed right-6 bottom-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all text-base focus:outline-none focus:ring-2 focus:ring-brand-500" // 使用 brand token
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
              'bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950', // 使用 neutral token
              'border-l border-white/10 shadow-2xl', // 保持半透明白色邊框
              panelWidth,
              'min-w-[400px] max-w-[800px]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success-400 to-info-500 flex items-center justify-center"> {/* 使用 success/info token */}
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AI Copilot</h2>
                  <p className="text-sm text-white/50">智慧旅遊助手</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Expand/Collapse */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500" // 使用 brand token，保持半透明白色 hover
                  title={isExpanded ? '縮小' : '放大'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Clear */}
                <button
                  onClick={handleClearHistory}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500" // 使用 brand token，保持半透明白色 hover
                  title="清除對話"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Close */}
                <button
                  onClick={onToggle}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500" // 使用 brand token，保持半透明白色 hover
                  title="關閉"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {MODE_OPTIONS.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setCurrentMode(mode.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-brand-500', // 使用 brand token
                      currentMode === mode.id
                        ? 'bg-white/15 text-white border border-white/20' // 保持半透明白色
                        : 'text-white/60 hover:text-white hover:bg-white/5' // 保持半透明白色 hover
                    )}
                  >
                    <div className={cn('w-5 h-5 rounded-md flex items-center justify-center', mode.color)}>
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
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success-400 to-info-500 flex items-center justify-center"> {/* 使用 success/info token */}
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="px-4 py-3 bg-white/10 rounded-2xl rounded-bl-md"> {/* 保持半透明白色 */}
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="輸入訊息... (Shift+Enter 換行)"
                    rows={1}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm" // 使用 brand token，保持半透明白色
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    'px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500', // 使用 brand token
                    inputValue.trim() && !isLoading
                      ? 'bg-brand-500 text-white hover:bg-brand-600' // 使用 brand token
                      : 'bg-white/10 text-white/40 cursor-not-allowed' // 保持半透明白色
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
              <div className="mt-2 flex items-center justify-between text-sm text-white/40">
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
            className="fixed inset-0 bg-primary-900/40 backdrop-blur-sm z-40" // 使用 primary token
          />
        )}
      </AnimatePresence>
    </>
  );
}