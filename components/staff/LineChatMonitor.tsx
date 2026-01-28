import React, { useState } from 'react';
import { MessageCircle, Search, Send, User, Clock, CheckCheck } from 'lucide-react';

interface ChatThread {
  id: string;
  customerName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  status: 'active' | 'resolved';
}

const MOCK_THREADS: ChatThread[] = [
  { id: '1', customerName: '王大明', lastMessage: '請問東京團還有名額嗎？', timestamp: '10:30', unreadCount: 2, status: 'active' },
  { id: '2', customerName: '李小華', lastMessage: '好的，謝謝您的回覆', timestamp: '09:45', unreadCount: 0, status: 'resolved' },
  { id: '3', customerName: '張美玲', lastMessage: '我想更改房型', timestamp: '昨天', unreadCount: 1, status: 'active' },
];

export default function LineChatMonitor() {
  const [threads] = useState<ChatThread[]>(MOCK_THREADS);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  return (
    <div className="h-full flex bg-gray-50 animate-fade-in">
      {/* Thread List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">LINE 客服</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋對話..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => setSelectedThread(thread.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedThread === thread.id ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{thread.customerName}</p>
                    <span className="text-sm text-gray-500">{thread.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-1">{thread.lastMessage}</p>
                </div>
                {thread.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-brand-500 text-white text-sm rounded-full flex items-center justify-center">
                    {thread.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {threads.find(t => t.id === selectedThread)?.customerName}
                </p>
                <p className="text-sm text-gray-500">LINE 用戶</p>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* Sample messages */}
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-2 max-w-xs">
                  <p className="text-sm text-gray-900">請問東京團還有名額嗎？</p>
                  <p className="text-sm text-gray-500 mt-1">10:30</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-primary-900 text-white rounded-2xl rounded-br-none px-4 py-2 max-w-xs">
                  <p className="text-sm">您好！目前3/15的東京團還有8個名額</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className="text-sm text-gray-400">10:32</p>
                    <CheckCheck className="w-3 h-3 text-brand-400" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="輸入訊息..."
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button className="w-12 h-12 bg-primary-900 text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-semibold">選擇對話開始回覆</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
