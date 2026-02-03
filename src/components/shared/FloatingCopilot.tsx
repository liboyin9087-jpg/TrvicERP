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
  Move, // Added for drag handle icon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Interfaces and Constants ---

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

// New Config interface for external control and defaults
interface FloatingCopilotConfig {
  // External control for visibility and state (controlled/uncontrolled pattern)
  open?: boolean; // Controlled open state
  onOpenChange?: (isOpen: boolean) => void;
  minimized?: boolean; // Controlled minimized state
  onMinimizedChange?: (isMinimized: boolean) => void;
  docked?: boolean; // Controlled docked state
  onDockedChange?: (isDocked: boolean) => void;

  // Initial dimensions and constraints (can be overridden by user resizing)
  defaultHeight?: number;
  defaultWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  minWidth?: number;
  maxWidth?: number;

  // Chat specific props
  initialMessages?: Message[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  className?: string; // Additional class for the wrapper div (FAB button + panel container)
  panelClassName?: string; // Additional class for the main panel itself
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'analyze', label: '分析數據', icon: <Lightbulb size={14} />, prompt: '幫我分析這個團體的利潤率' },
  { id: 'generate', label: '生成報告', icon: <FileText size={14} />, prompt: '幫我生成本月營收報告' },
  { id: 'code', label: '寫程式碼', icon: <Code size={14} />, prompt: '幫我寫一個計算利潤的函數' },
  { id: 'optimize', label: '優化建議', icon: <RefreshCw size={14} />, prompt: '有什麼可以優化的地方？' },
];

const DEFAULT_INITIAL_MESSAGE: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: '嗨！我是 Trip Copilot，你的 AI 旅遊助手。\n\n我可以幫你：\n• 分析團體利潤\n• 生成報表\n• 回答業務問題\n• 提供優化建議\n\n有什麼需要幫忙的嗎？',
    timestamp: new Date(),
    type: 'text',
  },
];

// --- Component ---

/**
 * GitHub Copilot 風格的 AI 助手面板
 *
 * 特點：
 * - 可調整大小 (拖曳邊框)
 * - 可停靠側邊或浮動
 * - 支援代碼格式化顯示
 * - 快速操作按鈕
 * - 複製功能
 * - Kintone Widget 兼容性：所有關鍵狀態皆可透過 Props 傳入控制，或使用內部狀態。
 * - Dashtail UI 規範：使用標準 Card 結構、Tailwind 顏色 token、drag-handle。
 */
const FloatingCopilot: React.FC<FloatingCopilotConfig> = ({
  // Control props (controlled/uncontrolled pattern)
  open,
  onOpenChange,
  minimized,
  onMinimizedChange,
  docked,
  onDockedChange,

  // Dimension props
  defaultHeight = 500,
  defaultWidth = 400,
  minHeight = 300,
  maxHeight = 800,
  minWidth = 320,
  maxWidth = 600,

  // Chat specific props
  initialMessages,
  onSendMessage,
  isLoading = false,
  className,
  panelClassName,
}) => {
  // Internal state for uncontrolled behavior or when props are not provided
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [internalIsMinimized, setInternalIsMinimized] = useState(false);
  const [internalIsDocked, setInternalIsDocked] = useState(false);
  const [internalPanelHeight, setInternalPanelHeight] = useState(defaultHeight);
  const [internalPanelWidth, setInternalPanelWidth] = useState(defaultWidth);

  // Determine actual state based on props or internal state (controlled vs. uncontrolled)
  const isComponentOpen = open !== undefined ? open : internalIsOpen;
  const isComponentMinimized = minimized !== undefined ? minimized : internalIsMinimized;
  const isComponentDocked = docked !== undefined ? docked : internalIsDocked;
  const currentPanelHeight = internalPanelHeight;
  const currentPanelWidth = internalPanelWidth;

  // State setters that also call onChange callbacks
  const setIsOpen = useCallback((value: boolean) => {
    setInternalIsOpen(value);
    onOpenChange?.(value);
  }, [onOpenChange]);

  const setIsMinimized = useCallback((value: boolean) => {
    setInternalIsMinimized(value);
    onMinimizedChange?.(value);
  }, [onMinimizedChange]);

  const setIsDocked = useCallback((value: boolean) => {
    setInternalIsDocked(value);
    onDockedChange?.(value);
  }, [onDockedChange]);

  const setPanelHeight = useCallback((value: number) => {
    setInternalPanelHeight(Math.min(Math.max(value, minHeight), maxHeight));
  }, [minHeight, maxHeight]);

  const setPanelWidth = useCallback((value: number) => {
    setInternalPanelWidth(Math.min(Math.max(value, minWidth), maxWidth));
  }, [minWidth, maxWidth]);

  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length > 0
      ? initialMessages
      : DEFAULT_INITIAL_MESSAGE
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null); // Ref for the draggable panel

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isComponentOpen && !isComponentMinimized) {
      inputRef.current?.focus();
    }
  }, [isComponentOpen, isComponentMinimized]);

  // Handle panel drag (for moving the widget when floating)
  // Initial position is bottom-right-8, so panelPosition adjusts transform for floating.
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });

  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (isComponentDocked || isComponentMinimized) return; // Cannot drag if docked or minimized
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPanelX = panelPosition.x;
    const initialPanelY = panelPosition.y;

    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX;
      const deltaY = ev.clientY - startY;
      setPanelPosition({
        x: initialPanelX + deltaX,
        y: initialPanelY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panelPosition, isComponentDocked, isComponentMinimized]);

  // Handle resize logic
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: 'height' | 'width' | 'both') => {
    if (isComponentMinimized || isComponentDocked) return; // Cannot resize if minimized or docked
    e.preventDefault();
    e.stopPropagation(); // Prevent drag handle or other mouse events from interfering
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startHeight = currentPanelHeight;
    const startWidth = currentPanelWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      // For a bottom-right anchored panel, resizing from top-left effectively increases height upwards and width leftwards.
      // The delta calculations remain correct for this behavior.
      if (direction === 'height' || direction === 'both') {
        const deltaY = startY - ev.clientY; // Moving cursor up increases height
        setPanelHeight(startHeight + deltaY);
      }
      if (direction === 'width' || direction === 'both') {
        const deltaX = startX - ev.clientX; // Moving cursor left increases width
        setPanelWidth(startWidth + deltaX);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentPanelHeight, currentPanelWidth, isComponentMinimized, isComponentDocked, setPanelHeight, setPanelWidth]);


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
    onSendMessage?.(inputValue); // Notify parent component
    setInputValue('');
    setShowQuickActions(false);

    // Simulated AI response for demonstration.
    // In a real application, this would come from the parent component
    // after `onSendMessage` triggers an API call.
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

  // Parses message content to render code blocks and plain text
  const renderMessageContent = (message: Message) => {
    const content = message.content;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-pre-${lastIndex}`} className="whitespace-pre-wrap text-sm">
            {content.slice(lastIndex, match.index)}
          </span>
        );
      }

      // Add the code block
      const language = match[1] || 'code';
      const code = match[2];
      parts.push(
        <div key={`code-block-${match.index}`} className="my-2 rounded-lg overflow-hidden bg-card border border-border">
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border">
            <span className="text-sm text-muted-foreground font-mono">{language}</span>
            <button
              onClick={() => handleCopy(code, `${message.id}-${match!.index}`)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              title="複製代碼"
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

    // Add remaining text after the last code block
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-post-${lastIndex}`} className="whitespace-pre-wrap text-sm">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap text-sm">{content}</span>;
  };

  // Main panel styling
  const panelClasses = cn(
    "flex flex-col overflow-hidden shadow-xl border border-border backdrop-blur-3xl bg-card/95", // Standard card structure
    isComponentDocked
      ? "fixed right-0 top-0 h-full rounded-none border-r-0 border-t-0 border-b-0"
      : "rounded-xl", // Use rounded-xl for standard card look
    (isResizing || isDragging) && "select-none", // Prevent text selection during drag/resize
    panelClassName // Allow custom panel class overrides
  );

  return (
    <div
      className={cn("fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4", className)}
      style={!isComponentDocked ? { transform: `translate(${panelPosition.x}px, ${panelPosition.y}px)` } : {}}
    >
      <AnimatePresence mode="wait">
        {isComponentOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isComponentMinimized ? 56 : currentPanelHeight,
              width: isComponentDocked ? maxWidth : currentPanelWidth, // Use maxWidth as fixed docked width
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={panelClasses}
            style={{
              height: isComponentMinimized ? 56 : currentPanelHeight,
              width: isComponentDocked ? maxWidth : currentPanelWidth,
            }}
          >
            {/* Resize handles - only active when floating and not minimized */}
            {!isComponentMinimized && !isComponentDocked && (
              <>
                {/* Top resize handle */}
                <div
                  className="absolute top-0 left-4 right-4 h-1.5 cursor-ns-resize hover:bg-primary/50 transition-colors rounded-b-sm z-10"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'height')}
                />
                {/* Left resize handle */}
                <div
                  className="absolute left-0 top-4 bottom-4 w-1.5 cursor-ew-resize hover:bg-primary/50 transition-colors rounded-r-sm z-10"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'width')}
                />
                {/* Top-left corner resize handle */}
                <div
                  className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-20"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'both')}
                >
                  {/* Grip icon for visual cue of corner resize */}
                  <GripVertical size={12} className="absolute top-1 left-1 text-muted-foreground rotate-45" />
                </div>
              </>
            )}

            {/* Header */}
            <div className="flex-shrink-0 p-3 border-b border-border bg-card/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/40 blur-lg opacity-40 animate-pulse" />
                  <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-primary-600 flex items-center justify-center shadow-lg">
                    <Sparkles size={16} className="text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h4 className="text-foreground font-semibold text-base">Trip Copilot</h4> {/* Adjusted font styles */}
                  <p className="text-xs text-primary/80 flex items-center gap-1 mt-0.5"> {/* Adjusted font styles and spacing */}
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    AI 助手
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Drag handle for moving the entire widget (only when floating) */}
                {!isComponentDocked && (
                  <button
                    className="drag-handle p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleDragMouseDown}
                    title="移動面板"
                  >
                    <Move size={14} />
                  </button>
                )}

                <button
                  onClick={() => setIsDocked(!isComponentDocked)}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  title={isComponentDocked ? '浮動模式' : '停靠側邊'}
                >
                  {isComponentDocked ? <PanelRightClose size={14} /> : <PanelRight size={14} />}
                </button>
                <button
                  onClick={() => setIsMinimized(!isComponentMinimized)}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  title={isComponentMinimized ? '展開面板' : '最小化面板'}
                >
                  {isComponentMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  title="關閉面板"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content - Hidden when minimized */}
            {!isComponentMinimized && (
              <>
                {/* Quick Actions */}
                {showQuickActions && messages.length <= 1 && (
                  <div className="flex-shrink-0 p-4 border-b border-border bg-card/10"> {/* Adjusted padding */}
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">快速操作</p> {/* Adjusted font styles */}
                    <div className="flex flex-wrap gap-2"> {/* Adjusted gap */}
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-secondary-foreground hover:bg-accent hover:border-primary/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent"> {/* Added custom scrollbar styles */}
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }} // Added framer-motion transition duration
                      className={cn(
                        "group",
                        msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "relative max-w-[90%] rounded-xl text-sm leading-relaxed", // Changed to rounded-xl for consistency
                          msg.role === 'user'
                            ? "bg-primary text-primary-foreground px-4 py-3 rounded-br-none" // Adjusted specific corner rounding
                            : "bg-secondary border border-border text-secondary-foreground px-4 py-3 rounded-bl-none" // Adjusted bg, specific corner rounding
                        )}
                      >
                        {renderMessageContent(msg)}

                        {/* Copy button for assistant messages */}
                        {msg.role === 'assistant' && (
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-background text-muted-foreground hover:text-foreground transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 shadow-sm" // Changed bg, added shadow
                            title="複製訊息"
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
                      <div className="bg-secondary border border-border px-4 py-3 rounded-xl rounded-bl-none"> {/* Changed bg, rounded-xl */}
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

                {/* Input Area */}
                <div className="flex-shrink-0 p-3 border-t border-border bg-card/20"> {/* Changed bg for consistency */}
                  <div className="relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="輸入訊息或問題..."
                      className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 pr-20 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:bg-muted/70 transition-all" // Changed bg, focus border
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" title="語音輸入">
                        <Mic size={16} />
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className={cn(
                          "p-1.5 rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                          inputValue.trim()
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "text-muted-foreground cursor-not-allowed opacity-70" // Added disabled styles
                        )}
                        title="發送訊息"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-center"> {/* Adjusted font size */}
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
        onClick={() => setIsOpen(!isComponentOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative w-14 h-14 rounded-full text-primary-foreground shadow-lg flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
          "bg-gradient-to-br from-primary to-primary-600", // Using a Tailwind color token (assuming primary-600 is defined)
          isComponentOpen && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" // Added ring-offset for better visibility
        )}
        title={isComponentOpen ? '關閉 Copilot' : '開啟 Copilot'}
      >
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
        <div className="relative z-10">
          {isComponentOpen ? <X size={24} /> : <Bot size={24} />}
        </div>
        {!isComponentOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" />
        )}
      </motion.button>
    </div>
  );
};

export default FloatingCopilot;