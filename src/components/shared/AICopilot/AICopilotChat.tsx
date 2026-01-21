import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { aiCopilotService, AIResponse, AISuggestion, AIContext } from '@/services/aiCopilotService';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Card } from '../../ui/Card';
import { useToast } from '@/store/useToastStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionType: 'info' | 'warning' | 'success' | 'error';
  suggestion?: AISuggestion;
}

interface AICopilotChatProps {
  context: AIContext;
  onSuggestionExecute?: (suggestion: AISuggestion) => void;
  className?: string;
}

export function AICopilotChat({ context, onSuggestionExecute, className }: AICopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是 TrvicERP AI Copilot 🤖\n\n我可以協助您：\n• 📅 編排與優化行程\n• 💰 試算成本與報價\n• ⚖️ 檢查法規合規性\n• 📝 撰寫行銷文案\n\n請告訴我您需要什麼協助？',
      timestamp: new Date(),
      actionType: 'info'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      actionType: 'info'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: AIResponse = await aiCopilotService.processRequest(input, context);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        actionType: response.actionType,
        suggestion: response.suggestion
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('AI 處理請求時發生錯誤');
      console.error('AI Copilot error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionExecute = (suggestion: AISuggestion) => {
    if (onSuggestionExecute) {
      onSuggestionExecute(suggestion);
      toast.success('已執行 AI 建議的操作');
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div className={`flex flex-col h-full bg-white border border-neutral-300 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-neutral-200">
        <Bot className="h-5 w-5 text-primary-900" />
        <h3 className="text-lg font-bold text-neutral-900">AI Copilot</h3>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 mt-1">
                <Bot className="h-6 w-6 text-neutral-500" />
              </div>
            )}
            
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary-900 text-white'
                  : 'bg-neutral-100 text-neutral-900'
              }`}
            >
              <div className="flex items-start gap-2 mb-1">
                {message.role === 'assistant' && getActionIcon(message.actionType)}
                <span className={`text-xs px-2 py-1 rounded-full ${getActionBadgeColor(message.actionType)}`}>
                  {message.actionType}
                </span>
              </div>
              
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>
              
              {/* AI Suggestion Button */}
              {message.suggestion && (
                <div className="mt-3 pt-3 border-t border-neutral-300">
                  <div className="text-xs text-neutral-600 mb-2">
                    建議操作：
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSuggestionExecute(message.suggestion!)}
                    className="w-full"
                  >
                    {message.suggestion.description || '執行建議'}
                  </Button>
                </div>
              )}
            </div>
            
            {message.role === 'user' && (
              <div className="flex-shrink-0 mt-1">
                <User className="h-6 w-6 text-neutral-500" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 mt-1">
              <Bot className="h-6 w-6 text-neutral-500" />
            </div>
            <div className="bg-neutral-100 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-900"></div>
                <span className="text-sm text-neutral-600">AI 思考中...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-neutral-200">
        <div className="flex gap-2 mb-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickAction('請檢查目前的行程安排是否合理')}
            disabled={isLoading}
          >
            📅 檢查行程
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickAction('請根據目前的成本計算建議售價')}
            disabled={isLoading}
          >
            💰 計算報價
          </Button>
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-neutral-200">
        <div className="flex gap-2">
          <Input
            placeholder="輸入指令（例：新增清水寺到 Day 3、幫我算報價...）"
            value={input}
            onChange={(value) => setInput(value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}