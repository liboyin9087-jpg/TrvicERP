import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Send, User, Clock, CheckCheck, GripVertical } from 'lucide-react';

// -----------------------------------------------------------------------------
// [architect] Config Props 介面定義
// [architect] 元件直接使用內部狀態而非透過 Props 接收資料: MOCK_THREADS 移除，改由 props 接收
// -----------------------------------------------------------------------------

/**
 * 定義聊天線程的數據結構。
 * 這是元件顯示所需的核心資料模型。
 */
interface ChatThread {
  id: string;
  customerName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  status: 'active' | 'resolved';
  // 為了展示聊天內容，如果需要動態聊天記錄，這裡應包含 messages 屬性。
  // 為符合原始碼範例，聊天內容暫時保持硬編碼，若需實作請擴充此介面。
  // messages?: ChatMessage[];
}

/**
 * LineChatMonitor 元件的配置屬性介面。
 * 確保元件可獨立配置，不依賴全局狀態。
 */
interface LineChatMonitorConfig {
  /**
   * 元件的標題，可選，預設為 "LINE 客服"。
   */
  title?: string;
  /**
   * 初始加載的聊天線程列表。
   * 取代硬編碼的模擬資料。
   */
  initialThreads: ChatThread[];
  /**
   * 初始選中的聊天線程ID，可選。
   */
  initialSelectedThreadId?: string;
  // 未來可擴展的配置，例如：
  // apiEndpoints?: {
  //   fetchThreads: string;
  //   sendMessage: string;
  // };
  // userId?: string;
}

/**
 * LineChatMonitor 元件的 Props 介面。
 */
interface LineChatMonitorProps {
  /**
   * 元件的配置物件。
   */
  config: LineChatMonitorConfig;
}

// -----------------------------------------------------------------------------
// [architect] 元件職責過重：已透過 Props 傳遞資料，將資料獲取職責外移。
// -----------------------------------------------------------------------------

export default function LineChatMonitor({ config }: LineChatMonitorProps) {
  // [architect] 移除硬編碼的模擬資料 MOCK_THREADS
  // 元件內部狀態用於管理 UI 互動和即時變化，初始值來自 props
  const [threads, setThreads] = useState<ChatThread[]>(config.initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    config.initialSelectedThreadId || null
  );
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // [architect] 錯誤邊界處理：增加錯誤狀態
  const [error, setError] = useState<string | null>(null);

  // [architect] 錯誤邊界處理：檢查 config 是否有效
  useEffect(() => {
    if (!config || !config.initialThreads) {
      setError("LineChatMonitor: Configuration missing or invalid. Please provide initialThreads.");
      setThreads([]); // 清空以避免使用空值
    } else {
      setThreads(config.initialThreads);
      setSelectedThreadId(config.initialSelectedThreadId || null);
      setError(null);
    }
  }, [config]); // 監聽 config 變化

  // 根據搜尋詞過濾聊天線程
  const filteredThreads = threads.filter(thread =>
    thread.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedThread = selectedThreadId
    ? threads.find(t => t.id === selectedThreadId)
    : null;

  // 處理訊息發送邏輯
  const handleSendMessage = () => {
    if (message.trim() && selectedThreadId) {
      console.log(`Sending message to ${selectedThread?.customerName}: ${message}`);
      // 在實際應用中，這裡會進行 API 呼叫發送訊息，並更新聊天記錄。
      // 為此範例，僅模擬更新最後一條訊息和清除輸入框。
      setThreads(prevThreads => prevThreads.map(t =>
        t.id === selectedThreadId
          ? { ...t, lastMessage: message, timestamp: '現在', unreadCount: 0 }
          : t
      ));
      setMessage('');
      // 可在此處添加滾動至聊天底部邏輯
    }
  };

  // [architect] 錯誤邊界處理：如果 config 無效，顯示錯誤訊息
  if (error) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center bg-white rounded-lg shadow p-4 text-red-600">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{config.title || "LINE 客服"}</h2>
        <p className="text-center">{error}</p>
        <p className="text-sm text-gray-500 mt-2">請檢查元件配置。</p>
      </div>
    );
  }

  return (
    // -------------------------------------------------------------------------
    // [designer] Dashtail UI 規範：外部標準 Card 結構與 drag-handle
    // -------------------------------------------------------------------------
    <div className="relative h-full flex flex-col bg-white rounded-lg shadow overflow-hidden animate-fade-in">
      {/* Dashtail Widget Header with Drag Handle */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          {config.title || "LINE 客服"}
        </h2>
        {/* [designer] 缺少 drag-handle 結構，不符合 Dashtail/TravelMaster 可拖動元件規範 */}
        <div className="drag-handle w-8 h-8 flex items-center justify-center cursor-grab text-gray-400 hover:text-gray-600 transition-colors">
          <GripVertical className="w-5 h-5" />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thread List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜尋對話..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length > 0 ? (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedThreadId === thread.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* [designer] 使用硬編碼顏色 bg-brand-100 -> bg-primary-100 */}
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      {/* [designer] 使用硬編碼顏色 text-brand-600 -> text-primary-600 */}
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        {/* [designer] 字體與間距正確使用 Tailwind class */}
                        <p className="font-semibold text-gray-900">{thread.customerName}</p>
                        <span className="text-sm text-gray-500">{thread.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">{thread.lastMessage}</p>
                    </div>
                    {/* [designer] 使用硬編碼顏色 bg-brand-500 -> bg-primary-500 */}
                    {thread.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-primary-500 text-white text-sm rounded-full flex items-center justify-center">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">無相關對話。</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
                {/* [designer] 使用硬編碼顏色 bg-brand-100 -> bg-primary-100 */}
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  {/* [designer] 使用硬編碼顏色 text-brand-600 -> text-primary-600 */}
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedThread.customerName}
                  </p>
                  <p className="text-sm text-gray-500">LINE 用戶</p>
                </div>
              </div>
              {/* [architect] 使用硬編碼的模擬資料：此處的樣本訊息仍為硬編碼。
                  若要動態顯示，ChatThread 介面需擴展包含 messages 屬性。
                  目前此處僅為展示 UI 結構。
              */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
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
                      {/* [designer] 使用硬編碼顏色 text-brand-400 -> text-primary-400 */}
                      <CheckCheck className="w-3 h-3 text-primary-400" />
                    </div>
                  </div>
                </div>
                {/* 
                * 實際應用中，會在這裡根據 selectedThread.messages 映射出多個訊息氣泡。
                * 例如:
                * {selectedThread.messages?.map((msg, index) => (
                *   <ChatMessage key={index} message={msg} isSender={msg.senderId === userId} />
                * ))}
                */}
              </div>
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { // Shift+Enter for new line
                        e.preventDefault(); // Prevent default Enter behavior (e.g., form submission)
                        handleSendMessage();
                      }
                    }}
                    placeholder="輸入訊息..."
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-900"
                  />
                  {/* [designer] 互動狀態樣式 (hover:bg-gray-800) 符合規範 */}
                  <button
                    onClick={handleSendMessage}
                    className="w-12 h-12 bg-primary-900 text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center p-4">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-semibold">選擇對話開始回覆</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}