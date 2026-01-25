import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Mic, Send, X, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FloatingCopilotProps {
  initialMessages?: Message[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * 浮動 AI Copilot 面板
 *
 * 特點：
 * - 可拖曳的浮動面板
 * - 呼吸感光暈動畫
 * - 流動背景效果
 * - 極致 Glassmorphism 質感
 */
const FloatingCopilot: React.FC<FloatingCopilotProps> = ({
  initialMessages = [],
  onSendMessage,
  isLoading = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.length > 0
      ? initialMessages
      : [
          {
            id: '1',
            role: 'assistant',
            content: '嗨！我是 Trip Copilot，你的 AI 旅遊助手。今天需要幫你檢查團體行程或分析利潤嗎？ 🌏',
            timestamp: new Date(),
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

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    onSendMessage?.(inputValue);
    setInputValue('');

    // 模擬 AI 回覆
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '收到！讓我幫你分析一下...',
        timestamp: new Date(),
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

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
      className={cn(
        "fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 64 : 500,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[380px] rounded-[32px] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/[0.08] backdrop-blur-3xl bg-[#050505]/70"
          >
            {/* 背景流動光效 (Animated Gradient Mesh) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(59,130,246,0.1)_360deg)] animate-spin-slow opacity-50" />
            </div>

            {/* 標頭區域 */}
            <div className="relative z-10 p-4 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* AI Avatar with glow */}
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 animate-breathe" />
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg">
                    <Sparkles size={18} className="text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Trip Copilot</h4>
                  <p className="text-xs text-blue-300/80 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    AI 助手在線
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* 聊天內容區 */}
            {!isMinimized && (
              <>
                <div className="relative z-10 p-4 h-[340px] overflow-y-auto scrollbar-thin space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                          msg.role === 'user'
                            ? "bg-blue-600/90 text-white rounded-br-none"
                            : "bg-white/[0.06] border border-white/[0.05] text-gray-200 rounded-bl-none"
                        )}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/[0.06] border border-white/[0.05] p-4 rounded-2xl rounded-bl-none">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 輸入區 */}
                <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent z-20">
                  <div className="relative flex items-center group">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="輸入訊息..."
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-full py-3 px-5 pr-20 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <Mic size={16} />
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className={cn(
                          "p-2 rounded-full transition-all",
                          inputValue.trim()
                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                            : "text-gray-500"
                        )}
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 浮動觸發按鈕 (Floating Action Button) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative w-14 h-14 rounded-full text-white shadow-glow-lg flex items-center justify-center transition-all",
          "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800",
          isOpen && "rotate-0"
        )}
      >
        {/* Breathing glow effect */}
        <div className="absolute inset-0 rounded-full bg-blue-500/50 blur-xl animate-breathe" />
        <div className="relative z-10">
          <Bot size={26} />
        </div>
      </motion.button>
    </motion.div>
  );
};

export default FloatingCopilot;
