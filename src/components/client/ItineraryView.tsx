import React, { useState } from 'react';
import { MapPin, Clock, Camera, Utensils, Bus, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

// --- 1. 定義 Props 類型和資料結構 ---

/**
 * 代表行程中的一個活動項目。
 */
interface ItineraryItem {
  id: string;
  time: string;           // 活動時間，例如 "09:00"
  title: string;          // 活動標題
  location: string;       // 活動地點
  type: 'attraction' | 'meal' | 'transport' | 'hotel'; // 活動類型
  duration: number;       // 活動持續時間（分鐘）
  image?: string;         // 可選的活動圖片 URL
}

/**
 * 整個行程的資料結構，以天數為鍵值 (e.g., 1, 2, 3...)。
 */
interface ItineraryData {
  [dayNumber: number]: ItineraryItem[];
}

/**
 * ItineraryView 元件的 Props 類型定義。
 * 遵循 Kintone 獨立性規範，接收配置資料。
 */
interface ItineraryViewProps {
  itineraryData: ItineraryData; // 完整的行程資料，取代內部 MOCK 資料
  tripTitle: string;            // 旅遊團的標題，例如 "東京五日深度遊"
  initialDay?: number;          // 可選的初始顯示天數，預設為 1
}

// --- 2. 元件定義 ---

/**
 * ItineraryView 元件：顯示每日行程的視圖。
 * 負責 UI 渲染和日期間的導航，資料則透過 Props 傳入。
 */
export default function ItineraryView(props: ItineraryViewProps) {
  const { itineraryData, tripTitle, initialDay = 1 } = props;

  const [currentDay, setCurrentDay] = useState(initialDay);
  const totalDays = Object.keys(itineraryData).length;
  const dayItems = itineraryData[currentDay] || [];

  /**
   * 根據活動類型返回對應的圖標。
   * @param type 活動類型
   * @returns React.ReactNode 圖標元件
   */
  const getTypeIcon = (type: ItineraryItem['type']) => {
    const icons: Record<ItineraryItem['type'], React.ReactNode> = {
      attraction: <Camera className="w-4 h-4 text-gray-400" />,
      meal: <Utensils className="w-4 h-4 text-gray-400" />,
      transport: <Bus className="w-4 h-4 text-gray-400" />,
      hotel: <MapPin className="w-4 h-4 text-gray-400" />,
    };
    return icons[type] || <MapPin className="w-4 h-4 text-gray-400" />; // 提供預設圖標
  };

  return (
    // [Dashtail UI 規範] 外層標準 Card 結構:
    // 移除 `min-h-screen bg-gray-50 animate-fade-in`
    // 改為 `bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden`
    // `flex flex-col` 確保內容能適應卡片高度
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col h-full"> {/* Added h-full for widget sizing */}

      {/* Day Selector (頂部導航區域) */}
      <div className="bg-primary-700 text-white px-6 py-4 flex flex-col gap-4">
        {/* [設計] 缺少 drag-handle 結構: 新增 drag-handle 區域 */}
        {/* 使用 GripVertical 圖標提示可拖曳，並確保 `drag-handle` 類別存在 */}
        <div className="flex items-center justify-center p-2 -mx-6 bg-primary-700 text-primary-200 cursor-grab active:cursor-grabbing drag-handle">
            <GripVertical className="w-5 h-5" />
        </div>

        {/* 日期切換按鈕與標題 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
            disabled={currentDay === 1}
            // [設計] 互動狀態類別完整: hover/focus/active/disabled 狀態
            className="p-2 -ml-2 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex-grow">
            {/* [設計] 字體與間距符合 Tailwind 規範: 調整顏色和間距 */}
            <p className="text-sm text-primary-200 font-medium">{tripTitle}</p>
            <h2 className="text-xl font-bold mt-1">Day {currentDay}</h2>
          </div>
          <button
            onClick={() => setCurrentDay(Math.min(totalDays, currentDay + 1))}
            disabled={currentDay === totalDays}
            // [設計] 互動狀態類別完整: hover/focus/active/disabled 狀態
            className="p-2 -mr-2 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 日期圓點選擇器 */}
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: totalDays }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentDay(idx + 1)}
              // [設計] 互動狀態類別完整: hover/focus/active/disabled 狀態
              className={`w-7 h-7 rounded-full font-semibold text-sm transition-colors duration-200
                ${currentDay === idx + 1
                  ? 'bg-white text-primary-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/70 hover:bg-gray-100 active:bg-gray-200'
                  : 'bg-primary-600 text-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300 hover:bg-primary-500 active:bg-primary-600'
                }`}
              aria-label={`Select day ${idx + 1}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 行程時間軸內容 */}
      {/* `flex-grow overflow-y-auto` 確保內容區域可滾動且填滿剩餘空間 */}
      <div className="p-6 flex-grow overflow-y-auto">
        {dayItems.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p>本天目前無行程。</p>
            <p className="text-sm mt-1">請選擇其他日期或新增行程。</p>
          </div>
        ) : (
          <div className="relative">
            {/* 時間軸垂直線 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {dayItems.map((item, idx) => (
                <div key={item.id} className="relative pl-10 group">
                  {/* 時間軸節點圓點 */}
                  <div className={`absolute left-2.5 w-3 h-3 rounded-full ${idx === 0 ? 'bg-brand-500' : 'bg-primary-300'} ring-4 ring-white shadow-sm`} />
                  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer">
                    {item.image && <img src={item.image} alt={item.title} className="w-full h-32 object-cover" loading="lazy" />}
                    <div className="p-4">
                      {/* 時間和持續時間 */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Clock className="w-4 h-4 text-gray-400" /><span>{item.time}</span>
                        <span className="text-gray-300">•</span>
                        <span>{item.duration} 分鐘</span>
                      </div>
                      {/* 標題 */}
                      <h3 className="font-semibold text-gray-800 text-base">{item.title}</h3>
                      {/* 地點和類型圖標 */}
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">{getTypeIcon(item.type)}{item.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}