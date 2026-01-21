/**
 * AI Copilot Chat Widget
 *
 * 功能：
 * - 五大專家模式切換
 * - 後端狀態監控（Online/Offline）
 * - 智能回應與建議操作
 *
 * @version 1.0.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Map,
  PenTool,
  Scale,
  Calculator,
  Briefcase,
  AlertTriangle,
  Server,
  WifiOff,
  Sparkles,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  aiCopilotService,
  ExpertMode,
  ExpertModeInfo,
  AIResponse,
  AISuggestion,
} from '../../services/aiCopilotService';

// =============================================================================
// Types & Config
// =============================================================================

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  mode?: string;
  suggestion?: AISuggestion;
  timestamp: Date;
}

const MODE_CONFIG: Record<
  string,
  { icon: typeof Map; color: string; bg: string; border: string }
> = {
  itinerary: {
    icon: Map,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  marketing: {
    icon: PenTool,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
  costing: {
    icon: Calculator,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  legal: {
    icon: Scale,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  general: {
    icon: Briefcase,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
};

// =============================================================================
// Component
// =============================================================================

export default function AIChatWidget() {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: '您好！我是 Trvic AI 助手。\n\n請選擇上方的專家模式，我會根據您的需求提供專業建議：\n\n📅 **行程** - 景點規劃、路線優化\n💰 **成本** - 報價試算、隱藏成本檢查\n✨ **行銷** - 文案撰寫、廣告素材\n⚖️ **法規** - 退費規範、合規檢查\n🧭 **通用** - 一般問題諮詢',
      mode: 'general',
      timestamp: new Date(),
    },
  ]);

  // Mode & Backend State
  const [currentMode, setCurrentMode] = useState<ExpertMode>('general');
  const [availableModes, setAvailableModes] = useState<ExpertModeInfo[]>([]);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ===========================================================================
  // Effects
  // ===========================================================================

  // 初始化
  useEffect(() => {
    const init = async () => {
      setIsCheckingHealth(true);
      try {
        const [modes, health] = await Promise.all([
          aiCopilotService.getAvailableModes(),
          aiCopilotService.checkBackendHealth(),
        ]);
        setAvailableModes(modes);
        setIsBackendOnline(health);
      } catch (error) {
        console.error('[AIChatWidget] Init failed:', error);
      } finally {
        setIsCheckingHealth(false);
      }
    };
    init();
  }, []);

  // 自動捲動到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 開啟時 focus 輸入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ===========================================================================
  // Handlers
  // ===========================================================================

  // 取得模擬的業務 Context（實際專案請從 Store 取得）
  const getContext = () => ({
    tourInfo: {
      團號: 'JP-20250401',
      團名: '北海道五日遊',
      出發日: '2025-04-01',
      回程日: '2025-04-05',
      人數: 30,
      目的地: '日本北海道',
    },
    itinerary: [],
    cost: [],
    passengers: [],
  });

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: trimmedInput,
      mode: currentMode,
      timestamp: new Date(),
    };

    setInput('');
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response: AIResponse = await aiCopilotService.processRequest(
        trimmedInput,
        getContext(),
        currentMode
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        text: response.content,
        mode: response.mode || currentMode,
        suggestion: response.suggestion,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[AIChatWidget] Send error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: '抱歉，系統發生錯誤。請稍後再試，或切換到離線模式使用基本功能。',
          mode: 'general',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    // 這裡實作將建議操作套用到實際資料的邏輯
    console.log('[AIChatWidget] Applying suggestion:', suggestion);

    // 顯示確認訊息
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: `✅ 已套用建議：${suggestion.description || '操作完成'}`,
        mode: currentMode,
        timestamp: new Date(),
      },
    ]);
  };

  const handleModeChange = (mode: ExpertMode) => {
    setCurrentMode(mode);
    const modeInfo = availableModes.find((m) => m.id === mode);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: `已切換到 ${modeInfo?.label || mode} 模式。請問有什麼可以幫您的？`,
        mode: mode,
        timestamp: new Date(),
      },
    ]);
  };

  // ===========================================================================
  // Render Helpers
  // ===========================================================================

  const activeConfig = MODE_CONFIG[currentMode] || MODE_CONFIG['general'];
  const ActiveIcon = activeConfig.icon;

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const modeConfig = MODE_CONFIG[message.mode || 'general'] || MODE_CONFIG['general'];
    const ModeIcon = modeConfig.icon;

    return (
      <div
        key={index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
      >
        <div
          className={`max-w-[85%] rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-sm px-4 py-3'
              : `${modeConfig.bg} text-gray-800 border ${modeConfig.border} rounded-bl-sm px-4 py-3`
          }`}
        >
          {/* AI 模式標籤 */}
          {!isUser && index > 0 && (
            <div
              className={`flex items-center gap-1.5 mb-2 pb-2 border-b ${modeConfig.border} opacity-70`}
            >
              <ModeIcon size={12} className={modeConfig.color} />
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {availableModes.find((m) => m.id === message.mode)?.label || message.mode}
              </span>
            </div>
          )}

          {/* 訊息內容 */}
          <div className="whitespace-pre-wrap">{message.text}</div>

          {/* 建議操作按鈕 */}
          {message.suggestion && (
            <button
              onClick={() => handleApplySuggestion(message.suggestion!)}
              className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isUser
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Check size={14} />
              {message.suggestion.description || '套用建議'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // ===========================================================================
  // Main Render
  // ===========================================================================

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end gap-3">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          <Sparkles size={24} className="group-hover:animate-pulse" />
          <span className="hidden group-hover:inline text-sm font-medium pr-1">
            AI 助手
          </span>
          {/* 狀態指示燈 */}
          <span
            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow ${
              isCheckingHealth
                ? 'bg-yellow-400 animate-pulse'
                : isBackendOnline
                ? 'bg-green-400'
                : 'bg-gray-400'
            }`}
          />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="bg-white w-[420px] h-[650px] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${activeConfig.bg} bg-opacity-20 backdrop-blur`}
              >
                <ActiveIcon size={20} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-base flex items-center gap-2">
                  Trvic AI Copilot
                  {isCheckingHealth ? (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                      檢查中
                    </span>
                  ) : isBackendOnline ? (
                    <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Server size={10} />
                      Online
                    </span>
                  ) : (
                    <span className="text-[10px] bg-gray-500/30 text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <WifiOff size={10} />
                      Offline
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {availableModes.find((m) => m.id === currentMode)?.description ||
                    '智能助手'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode Selector */}
          <div className="bg-slate-50 px-3 py-2.5 border-b border-gray-200">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {availableModes.map((mode) => {
                const config = MODE_CONFIG[mode.id] || MODE_CONFIG['general'];
                const Icon = config.icon;
                const isActive = currentMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md scale-105'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={14} />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Body */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-slate-50"
          >
            {messages.map(renderMessage)}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-slate-100 text-slate-500 text-xs px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2 border border-slate-200">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span className="ml-1">
                    {availableModes.find((m) => m.id === currentMode)?.label || 'AI'}{' '}
                    專家思考中...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 px-4 py-2 text-[11px] text-amber-700 flex items-center justify-center gap-2 border-t border-amber-100">
            <AlertTriangle size={14} />
            <span>AI 生成內容僅供參考，重要決策請人工複核</span>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <input
                ref={inputRef}
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`向 ${
                  availableModes.find((m) => m.id === currentMode)?.label || 'AI'
                } 專家提問...`}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className={`p-2.5 rounded-xl transition-all ${
                  input.trim() && !loading
                    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
