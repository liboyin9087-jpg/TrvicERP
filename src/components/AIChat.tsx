/**
 * AI Assistant Chat Component
 * 
 * Conversational AI interface with intent recognition,
 * policy search, and task automation capabilities
 */

import React, { useState, useRef, useEffect } from 'react';
import { aiAgentService, ragService } from '../../services';
import type { ConversationMessage } from '../../services/aiAgentService';

interface AIChatProps {
  onClose?: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize services
  useEffect(() => {
    const init = async () => {
      try {
        await ragService.initialize();
        setIsInitialized(true);
        
        // Add welcome message
        const welcomeMessage: ConversationMessage = {
          id: 'welcome',
          role: 'assistant',
          content: '您好！我是 TrvicERP AI 助理。我可以協助您：\n\n' +
                   '• 查詢差旅政策和報銷規範\n' +
                   '• 預訂行程和機票\n' +
                   '• 檢查預算額度\n' +
                   '• 建立旅遊提案\n\n' +
                   '請問有什麼我可以幫助您的嗎？',
          timestamp: Date.now(),
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Failed to initialize AI services:', error);
      }
    };

    init();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !isInitialized) return;

    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Process user input
      const response = await aiAgentService.processInput(userInput);
      
      // Update messages
      setMessages(aiAgentService.getConversationHistory());

      // If action requires confirmation, focus input for user response
      if (response.action?.requiresConfirmation) {
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Error processing input:', error);
      
      const errorMessage: ConversationMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，處理您的請求時發生錯誤。請稍後再試。',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (actionId: string) => {
    setIsLoading(true);

    try {
      const result = await aiAgentService.confirmAction(actionId);
      setMessages(aiAgentService.getConversationHistory());
    } catch (error) {
      console.error('Error confirming action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    aiAgentService.clearConversation();
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI 助理</h3>
            <p className="text-sm text-gray-500">
              {isInitialized ? '線上' : '初始化中...'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearChat}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            清除對話
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {/* Action confirmation buttons */}
              {message.action?.requiresConfirmation && message.action.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleConfirm(message.action!.id)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    確認執行
                  </button>
                  <button
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                  >
                    取消
                  </button>
                </div>
              )}

              {/* Timestamp */}
              <p className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString('zh-TW', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="輸入您的問題或需求..."
            disabled={!isInitialized || isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isInitialized || isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            發送
          </button>
        </form>

        {/* Quick actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setInput('差旅住宿費用標準是多少？')}
            disabled={!isInitialized || isLoading}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            💰 查詢報銷標準
          </button>
          <button
            onClick={() => setInput('員工旅遊補助有多少？')}
            disabled={!isInitialized || isLoading}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            🎫 員工旅遊補助
          </button>
          <button
            onClick={() => setInput('查詢我的預算額度')}
            disabled={!isInitialized || isLoading}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            📊 預算查詢
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
