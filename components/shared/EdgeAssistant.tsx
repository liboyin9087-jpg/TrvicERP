import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Maximize2, Minimize2, Sparkles, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { aiService } from '../../src/lib/ai/aiService';
import { useFunctionExecutor } from '../../src/hooks/useFunctionExecutor';
import { useAppStore } from '../../src/store/useAppStore';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import type { AIMode, ChatMessage, AIModeOption } from '../../src/types/ai';

// 預設模式選項
const DEFAULT_MODES: AIModeOption[] = [
  { id: 'general', label: '🧭 通用', description: '團控通用助手' },
  { id: 'itinerary', label: '📅 行程', description: '行程規劃專家' },
  { id: 'marketing', label: '✨ 行銷', description: '行銷文案專家' },
  { id: 'costing', label: '💰 成本', description: '成本試算專家' },
  { id: 'legal', label: '⚖️ 法規', description: '法規諮詢專家' },
];

export default function EdgeAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<AIMode>('general');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '您好！我是 TrvicERP AI 助理，有什麼可以幫助您的嗎？您可以問我關於行程規劃、報價計算、法規諮詢等問題，或請我幫您導航到特定頁面。',
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);
  const { executeFunctions } = useFunctionExecutor();
  const { currentView, userRole, userName } = useAppStore((state) => ({
    currentView: state.currentView,
    userRole: state.userRole,
    userName: state.userName,
  }));
  const { widgets, isEditMode } = useDashboardStore((state) => ({
    widgets: state.widgets,
    isEditMode: state.isEditMode,
  }));

  const aiContext = useMemo(() => {
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

  // 滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 點擊外部關閉模式選擇器
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
      });

      // 執行函數呼叫
      const executionResults =
        response.function_calls && response.function_calls.length > 0
          ? executeFunctions(response.function_calls)
          : [];

      const executionSummary = executionResults.length
        ? `\n\n執行結果：\n${executionResults
            .map((result) => `${result.success ? '✅' : '⚠️'} ${result.message || result.functionName}`)
            .join('\n')}`
        : '';

      if (response.function_calls && response.function_calls.length > 0) {
        // already executed above
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${response.reply || '已完成操作。'}${executionSummary}`,
        timestamp: new Date(),
        functionCalls: response.function_calls || undefined,
        imageUrl: response.image_url || undefined,
        imagePrompt: response.image_prompt || undefined,
        ragSources: response.rag_sources || undefined,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI 服務暫時無法使用';
      setError(errorMessage);

      // 加入錯誤訊息到對話
      const errorAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，發生錯誤：${errorMessage}。請稍後再試。`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorAiMessage]);
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

  const getCurrentModeLabel = () => {
    const mode = DEFAULT_MODES.find((m) => m.id === currentMode);
    return mode?.label || '🧭 通用';
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-50"
        title="開啟 AI 助理"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed ${
        isExpanded ? 'inset-4' : 'bottom-6 right-6 w-96 h-[500px]'
      } bg-white rounded-2xl shadow-2xl flex flex-col z-50 transition-all`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI 助理</h3>
            <p className="text-xs text-gray-500">隨時為您服務</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title={isExpanded ? '縮小' : '放大'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="relative" ref={modeSelectorRef}>
          <button
            onClick={() => setShowModeSelector(!showModeSelector)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <span>{getCurrentModeLabel()}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
          </button>

          {showModeSelector && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {DEFAULT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setCurrentMode(mode.id);
                    setShowModeSelector(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                    currentMode === mode.id ? 'bg-gray-50 font-medium' : ''
                  }`}
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
                  ? 'bg-black text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.imageUrl && (
                <div className="mt-3">
                  <img
                    src={message.imageUrl}
                    alt={message.imagePrompt || 'Marketing image'}
                    className="rounded-xl border border-gray-200 max-h-64 object-cover"
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
                  <p className="text-xs text-gray-500">
                    已執行: {message.functionCalls.map((fc) => fc.name).join(', ')}
                  </p>
                </div>
              )}
              {message.ragSources && message.ragSources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">法規引用：</p>
                  <ul className="space-y-1 text-xs text-gray-500">
                    {message.ragSources.map((source, index) => (
                      <li key={`${message.id}-rag-${index}`} className="line-clamp-2">
                        {source}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl rounded-bl-none">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-gray-100">
        {/* Quick actions */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {['推薦熱門行程', '查詢客戶資料', '計算報價', '法規諮詢'].map((quick) => (
            <button
              key={quick}
              onClick={() => setInput(quick)}
              className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700 whitespace-nowrap hover:bg-gray-200 transition-colors"
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
            placeholder="輸入訊息..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
