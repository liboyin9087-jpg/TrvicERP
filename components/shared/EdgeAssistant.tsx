import React, { useState, useMemo, memo } from 'react';
import { Bot, Send, X, Maximize2, Minimize2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EdgeAssistantProps {
  initialMessage?: string;
}

const EdgeAssistant: React.FC<EdgeAssistantProps> = memo(({ initialMessage = '您好！我是 TrvicERP AI 助理，有什麼可以幫助您的嗎？' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: initialMessage, timestamp: new Date() }
  ]);

  const quickPrompts = useMemo(() => ['推薦熱門行程', '查詢客戶資料', '計算報價'], []);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(input),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (query: string): string => {
    if (query.includes('行程') || query.includes('推薦')) {
      return '根據您的需求，我推薦「東京五日深度遊」行程，包含淺草、晴空塔、築地市場等熱門景點，目前3月15日出發的團次還有8個名額。';
    }
    if (query.includes('客戶') || query.includes('VIP')) {
      return '目前系統中有 4 位白金會員，其中李小華的總消費金額最高，達 NT$ 520,000。建議可以針對 VIP 客戶推送專屬優惠。';
    }
    if (query.includes('報價') || query.includes('價格')) {
      return '5天4夜東京行程建議報價：機票 NT$15,000 + 住宿 NT$12,000 + 其他 NT$10,500 = 總計 NT$37,500/人。加上 15% 利潤後售價為 NT$43,125。';
    }
    return '好的，我已了解您的需求。請問還有什麼需要協助的嗎？';
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-50"
        aria-label="開啟AI助理"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div 
      className={`fixed ${isExpanded ? 'inset-4' : 'bottom-6 right-6 w-96 h-[500px]'} bg-white rounded-2xl shadow-2xl flex flex-col z-50 transition-all`}
      aria-modal="true"
      role="dialog"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" aria-hidden="true" />
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
            aria-label={isExpanded ? '最小化' : '最大化'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${message.role === 'user' ? 'bg-black text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none'}`}
              aria-label={message.role === 'user' ? '使用者訊息' : 'AI助理訊息'}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {quickPrompts.map((quick) => (
            <button
              key={quick}
              onClick={() => setInput(quick)}
              className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700 whitespace-nowrap hover:bg-gray-200 transition-colors"
              aria-label={`快速輸入: ${quick}`}
            >
              {quick}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="輸入訊息..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="輸入訊息"
          />
          <button 
            onClick={handleSend} 
            className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors"
            aria-label="傳送訊息"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default EdgeAssistant;