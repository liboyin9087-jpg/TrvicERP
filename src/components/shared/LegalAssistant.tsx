import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, X, Send, BookOpen, Sparkles, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LegalDocument } from '@/lib/ai/RAGEngine'; // Assuming LegalDocument is a shared type

// 1. [architect] 定义 RAG 引擎服务接口，实现依赖注入
interface RAGEngineService {
  getLegalAnswer: (query: string) => { documents: LegalDocument[]; summary: string };
}

// 内部 Message 类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  documents?: LegalDocument[];
  timestamp: Date;
}

// 2. [architect] 定义 Config Props 介面
interface LegalAssistantConfig {
  ragEngine: RAGEngineService; // 注入 RAG 引擎
  initialMessages?: Message[]; // 初始消息
  showQuickQuestions?: boolean; // 是否显示快速问题按钮
  quickQuestionsList?: string[]; // 快速问题列表
  typingIndicatorColorClass?: string; // 打字指示器颜色 Tailwind class
}

// 默认快速问题
const DEFAULT_QUICK_QUESTIONS = [
  '護照首次申請要準備什麼？',
  '旅遊取消的退費規定？',
  '航班延誤賠償標準？',
  '領隊未派如何求償？',
  '遊覽車駕駛工時限制？',
];

// Animation variants (保持 framer-motion 用于复杂动画)
const chatWindowVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }
};

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 400 } }
};

const buttonVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring' as const, damping: 20, stiffness: 400 } },
  exit: { scale: 0, opacity: 0 }
};

// Typing indicator component (使用 Tailwind Token 颜色)
function TypingIndicator({ colorClass = 'bg-neutral-300' }: { colorClass?: string }) { // [designer] 使用 Tailwind Token
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn("w-2 h-2 rounded-full", colorClass)} // [designer] 修复硬编码颜色，使用 props 注入的 Tailwind class
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function LegalAssistant({
  ragEngine, // [architect] 注入 RAG 引擎
  initialMessages, // [architect] 可配置的初始消息
  showQuickQuestions = true, // [architect] 可配置是否显示快速问题
  quickQuestionsList = DEFAULT_QUICK_QUESTIONS, // [architect] 可配置的快速问题列表
  typingIndicatorColorClass = 'bg-neutral-300', // [designer] 可配置的打字指示器颜色
}: LegalAssistantConfig) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages || [
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是法規小助理\n\n我可以幫您查詢旅遊相關法規，包括：\n• 護照申請規定\n• 旅遊契約條款\n• 航空公約賠償\n• 消費者保護法\n\n請問有什麼可以幫您的？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // 3. [architect] 业务逻辑 (RAG 查询) 直接处理，但 RAG 引擎是注入的，符合规范
    const { documents, summary } = ragEngine.getLegalAnswer(input.trim());

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: summary,
      documents: documents.length > 0 ? documents : undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl shadow-lg shadow-brand-500/30 flex items-center justify-center
                       focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 transition-all duration-200 ease-in-out"
          >
            <Scale className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window - iMessage Style */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={chatWindowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[580px] glass-panel rounded-3xl flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="w-11 h-11 bg-neutral-0/20 backdrop-blur rounded-lg flex items-center justify-center"
                >
                  <Scale className="w-5 h-5" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-lg">法規小助理</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
                    <p className="text-sm text-white/80">AI 線上服務中</p>
                  </div>
                </div>
              </div>
              {/* 5. [designer] 增加 drag-handle 结构 */}
              <div className="drag-handle cursor-grab flex items-center pr-2">
                <GripVertical className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-neutral-0/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-0/40"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Messages - iMessage Style */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-neutral-50/50 to-neutral-0/30 scrollbar-thin scrollbar-thumb-brand-200 scrollbar-track-brand-50">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm', // [designer] 间距与字号使用 Tailwind class
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-br-md'
                        : 'bg-neutral-0 text-neutral-800 rounded-bl-md border border-neutral-100'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

                    {/* Document References */}
                    {message.documents && message.documents.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-200/50">
                        <p className="text-sm text-neutral-500 mb-2 flex items-center gap-1.5"> {/* [designer] 间距与字号使用 Tailwind class */}
                          <BookOpen className="w-3 h-3" />
                          參考法規：
                        </p>
                        <div className="space-y-1.5">
                          {message.documents.map(doc => (
                            <motion.div
                              key={doc.id}
                              whileHover={{ scale: 1.02 }}
                              className="text-sm bg-brand-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-brand-100 transition-colors
                                         focus:outline-none focus:ring-2 focus:ring-brand-200" // [designer] 间距与字号使用 Tailwind class
                            >
                              <span className="font-medium text-brand-700">{doc.title}</span>
                              <span className="text-brand-400 ml-1.5 text-sm">({doc.category})</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className={cn(
                      'text-xs mt-2', // [designer] 调整为 text-xs，更符合时间戳惯例
                      message.role === 'user' ? 'text-white/60' : 'text-neutral-400'
                    )}>
                      {message.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-neutral-0 rounded-2xl rounded-bl-md shadow-sm border border-neutral-100">
                    <TypingIndicator colorClass={typingIndicatorColorClass} />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            <AnimatePresence>
              {showQuickQuestions && messages.length <= 2 && ( // [architect] 根据 props 控制显示
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-2 bg-neutral-0/50"
                >
                  <p className="text-sm text-neutral-500 mb-2 font-medium">快速提問</p> {/* [designer] 间距与字号使用 Tailwind class */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickQuestionsList.slice(0, 3).map((q, idx) => ( // [architect] 使用可配置的列表
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickQuestion(q)}
                        className="text-sm bg-neutral-0 text-brand-600 px-3 py-1.5 rounded-full border border-brand-100 hover:bg-brand-50 hover:border-brand-200 transition-all shadow-sm
                                   focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-1" // [designer] 间距与字号使用 Tailwind class
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input - iOS Style */}
            <div className="p-4 bg-neutral-0/80 backdrop-blur border-t border-neutral-200/50">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="輸入您的法規問題..."
                    className="w-full px-4 py-3 bg-neutral-100/80 rounded-2xl focus:ring-2 focus:ring-brand-500/30 focus:bg-neutral-0 border-0 text-sm transition-all outline-none" // [designer] 间距与字号使用 Tailwind class
                    disabled={isLoading}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    'w-11 h-11 rounded-lg flex items-center justify-center transition-all',
                    input.trim() && !isLoading
                      ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  )}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-xs text-neutral-400 text-center mt-2"> {/* [designer] 调整为 text-xs */}
                AI 回答僅供參考，實際情況請以主管機關公告為準
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}