import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Mic,
  Send,
  X,
  Sparkles,
  Copy,
  Check,
  Code,
  FileText,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  GripVertical,
  PanelRightClose,
  PanelRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'suggestion';
  language?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

interface FloatingCopilotProps {
  initialMessages?: Message[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  className?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'analyze', label: '分析數據', icon: <Lightbulb size={14} />, prompt: '幫我分析這個團體的利潤率' },
  { id: 'generate', label: '生成報告', icon: <FileText size={14} />, prompt: '幫我生成本月營收報告' },
  { id: 'code', label: '寫程式碼', icon: <Code size={14} />, prompt: '幫我寫一個計算利潤的函數' },
  { id: 'optimize', label: '優化建議', icon: <RefreshCw size={14} />, prompt: '有什麼可以優化的地方？' },
];

/**
 * GitHub Copilot 風格的 AI 助手面板
 *
 * 特點：
 * - 可調整大小 (拖曳邊框)
 * - 可停靠側邊或浮動
 * - 支援代碼格式化顯示
 * - 快速操作按鈕
 * - 複製功能
 */
const FloatingCopilot: React.FC<FloatingCopilotProps> = ({
  initialMessages = [],
  onSendMessage,
  isLoading = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [panelHeight, setPanelHeight] = useState(500);
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const [messages, setMessages] = useState<Message[]>(
    initialMessages.length > 0
      ? initialMessages
      : [
          {
            id: '1',
            role: 'assistant',
            content: '嗨！我是 Trip Copilot，你的 AI 旅遊助手。\n\n我可以幫你：\n• 分析團體利潤\n• 生成報表\n• 回答業務問題\n• 提供優化建議\n\n有什麼需要幫忙的嗎？',
            timestamp: new Date(),
            type: 'text',
          },
        ]
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent, direction: 'height' | 'width' | 'both') => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startHeight = panelHeight;
    const startWidth = panelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      if (direction === 'height' || direction === 'both') {
        const deltaY = startY - e.clientY;
        setPanelHeight(Math.min(Math.max(startHeight + deltaY, 300), 800));
      }
      if (direction === 'width' || direction === 'both') {
        const deltaX = startX - e.clientX;
        setPanelWidth(Math.min(Math.max(startWidth + deltaX, 320), 600));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panelHeight, panelWidth]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    onSendMessage?.(inputValue);
    setInputValue('');
    setShowQuickActions(false);

    // 模擬 AI 回覆
    setTimeout(() => {
      const isCodeRequest = inputValue.includes('程式') || inputValue.includes('函數') || inputValue.includes('code');

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isCodeRequest
          ? '好的，這是一個計算利潤的函數：\n\n```typescript\nfunction calculateProfit(\n  revenue: number,\n  cost: number\n): { profit: number; margin: number } {\n  const profit = revenue - cost;\n  const margin = (profit / revenue) * 100;\n  \n  return {\n    profit,\n    margin: Math.round(margin * 100) / 100\n  };\n}\n```\n\n使用方式：\n```typescript\nconst result = calculateProfit(100000, 75000);\nconsole.log(result);\n// { profit: 25000, margin: 25 }\n```'
          : '收到！讓我幫你分析一下...\n\n根據目前的數據：\n• 本月營收：$2.4M\n• 成本支出：$1.8M\n• 淨利潤：$600K\n• 利潤率：25%\n\n建議關注以下幾點：\n1. 東京團的利潤率較低，可以優化\n2. 歐洲團需求增加，考慮加開\n3. 機票成本有上升趨勢',
        timestamp: new Date(),
        type: isCodeRequest ? 'code' : 'text',
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.prompt);
    inputRef.current?.focus();
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 解析消息內容，處理代碼塊
  const renderMessageContent = (message: Message) => {
    const content = message.content;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // 添加代碼塊之前的文字
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex} className="whitespace-pre-wrap text-sm">
            {content.slice(lastIndex, match.index)}
          </span>
        );
      }

      // 添加代碼塊
      const language = match[1] || 'code';
      const code = match[2];
      parts.push(
        <div key={match.index} className="my-2 rounded-lg overflow-hidden bg-card border border-border">
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border">
            <span className="text-sm text-muted-foreground font-mono">{language}</span>
            <button
              onClick={() => handleCopy(code, `${message.id}-${match!.index}`)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {copiedId === `${message.id}-${match!.index}` ? (
                <>
                  <Check size={12} className="text-success" />
                  <span className="text-success">已複製</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>複製</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 text-sm overflow-x-auto">
            <code className="text-card-foreground font-mono">{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // 添加剩餘的文字
    if (lastIndex < content.length) {
      parts.push(
        <span key={lastIndex} className="whitespace-pre-wrap text-sm">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap text-sm">{content}</span>;
  };

  const panelClasses = cn(
    "flex flex-col overflow-hidden shadow-2xl border border-border backdrop-blur-3xl bg-background/95",
    isDocked
      ? "fixed right-0 top-0 h-full rounded-none border-r-0 border-t-0 border-b-0"
      : "rounded-[24px]",
    isResizing && "select-none"
  );

  return (
    <div className={cn("fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4", className)}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 56 : panelHeight,
              width: isDocked ? 380 : panelWidth,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={panelClasses}
            style={{
              height: isMinimized ? 56 : panelHeight,
              width: isDocked ? 380 : panelWidth,
            }}
          >
            {/* Resize handles */}
            {!isMinimized && !isDocked && (
              <>
                {/* Top resize */}
                <div
                  className="absolute top-0 left-4 right-4 h-1 cursor-ns-resize hover:bg-primary/30 transition-colors"
                  onMouseDown={(e) => handleMouseDown(e, 'height')}
                />
                {/* Left resize */}
                <div
                  className="absolute left-0 top-4 bottom-4 w-1 cursor-ew-resize hover:bg-primary/30 transition-colors"
                  onMouseDown={(e) => handleMouseDown(e, 'width')}
                />
                {/* Corner resize */}
                <div
                  className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize"
                  onMouseDown={(e) => handleMouseDown(e, 'both')}
                >
                  <GripVertical size={12} className="absolute top-1 left-1 text-muted-foreground rotate-45" />
                </div>
              </>
            )}

            {/* Header */}
            <div className="flex-shrink-0 p-3 border-b border-border bg-background/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/40 blur-lg opacity-40 animate-pulse" />
                  <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-primary-dark flex items-center justify-center shadow-lg">
                    <Sparkles size={16} className="text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h4 className="text-foreground font-medium text-sm">Trip Copilot</h4>
                  <p className="text-sm text-primary/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    AI 助手
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsDocked(!isDocked)}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  title={isDocked ? '浮動模式' : '停靠側邊'}
                >
                  {isDocked ? <PanelRightClose size={14} /> : <PanelRight size={14} />}
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <>
                {/* Quick Actions */}
                {showQuickActions && messages.length <= 1 && (
                  <div className="flex-shrink-0 p-3 border-b border-border bg-background/10">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">快速操作</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-sm text-secondary-foreground hover:bg-accent hover:border-primary/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "group",
                        msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "relative max-w-[90%] rounded-2xl text-sm leading-relaxed",
                          msg.role === 'user'
                            ? "bg-primary text-primary-foreground px-4 py-3 rounded-br-md"
                            : "bg-card border border-border text-card-foreground px-4 py-3 rounded-bl-md"
                        )}
                      >
                        {renderMessageContent(msg)}

                        {/* Copy button for assistant messages */}
                        {msg.role === 'assistant' && (
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                          >
                            {copiedId === msg.id ? (
                              <Check size={12} className="text-success" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex-shrink-0 p-3 border-t border-border bg-primary/20">
                  <div className="relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="輸入訊息或問題..."
                      className="w-full bg-secondary border border-border rounded-lg py-2.5 px-4 pr-20 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:bg-secondary/70 transition-all"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                        <Mic size={16} />
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className={cn(
                          "p-1.5 rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                          inputValue.trim()
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "text-muted-foreground"
                        )}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5 text-center">
                    按 Enter 發送 · 支援 Markdown 格式
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative w-14 h-14 rounded-full text-primary-foreground shadow-lg flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
          "bg-gradient-to-br from-primary to-primary-dark",
          isOpen && "ring-2 ring-primary/50"
        )}
      >
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
        <div className="relative z-10">
          {isOpen ? <X size={24} /> : <Bot size={24} />}
        </div>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" />
        )}
      </motion.button>
    </div>
  );
};

export default FloatingCopilot;