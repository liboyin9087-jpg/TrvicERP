import React, { useState } from 'react';
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * @interface Location
 * 定義地圖上地點的數據結構。
 */
interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'attraction' | 'hotel' | 'restaurant';
}

/**
 * @interface InteractiveMapProps
 * 定義 InteractiveMap 元件的 Props 介面，符合 Kintone 獨立性規範。
 * 外部數據透過 Props 傳入，避免直接依賴全域 Store。
 */
interface InteractiveMapProps {
  locations: Location[];
  // 可以在此添加其他配置項，例如 initialZoom, initialCenter 等。
  // initialZoom?: number;
  // initialCenter?: { lat: number; lng: number; };
}

/**
 * @constant LOCATION_TYPE_COLOR_MAP
 * 語意化標記顏色映射。將地點類型映射到對應的 Tailwind 顏色 Token。
 * 雖然值是 Tailwind utility class，但此常量作為語意化定義層，
 * 確保標記顏色選擇的一致性和可維護性。
 */
const LOCATION_TYPE_COLOR_MAP: Record<Location['type'], string> = {
  attraction: 'bg-primary-500', // 景點使用 primary-500
  hotel: 'bg-success-500',     // 住宿使用 success-500
  restaurant: 'bg-warning-500', // 餐廳使用 warning-500
};

/**
 * getMarkerColor 根據地點類型獲取對應的標記顏色 Tailwind class。
 * @param type 地點類型
 * @returns 顏色 Tailwind class 字串
 */
const getMarkerColor = (type: Location['type']): string => {
  return LOCATION_TYPE_COLOR_MAP[type] || 'bg-gray-500'; // Fallback to gray
};

/**
 * InteractiveMap 元件
 * 提供一個互動式地圖的佔位符和基本控制功能。
 * 旨在作為一個可配置的 Kintone Widget。
 *
 * @param {InteractiveMapProps} props 接收地點數據。
 */
export default function InteractiveMap({ locations }: InteractiveMapProps) {
  // 內部狀態管理，與外部數據分離
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [zoom, setZoom] = useState(12); // 地圖縮放級別

  return (
    // [designer] [設計] 結構: 作為 Widget，外層應有標準 Card 結構 (bg-white, rounded-lg, shadow-md)。
    // [architect] [架構] 確保元件作為獨立 Widget 被拖曳與配置。
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col overflow-hidden animate-fade-in">
      {/* [designer] [設計] 缺少 drag-handle 結構元件，地圖平移功能需包含標準化拖曳手柄。 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 cursor-grab drag-handle">
        <h2 className="text-lg font-semibold text-gray-900">互動地圖</h2>
        {/* 此處可放置其他 Widget 級別的控制項或設定按鈕 */}
      </div>

      <div className="flex-1 relative">
        {/* Map Placeholder - 地圖功能尚未實作，作為視覺佔位符 */}
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">互動地圖</p>
            {/* [designer] [設計] 地圖占位符文字未使用標準字體層級，text-sm 已改為 text-body-sm 語意化 class。 */}
            <p className="text-body-sm text-gray-400">地圖功能需整合 Google Maps API</p>
          </div>
        </div>

        {/* 地圖控制按鈕區域 */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={() => setZoom(Math.min(20, zoom + 1))}
            className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center
                       hover:bg-gray-50 focus:ring-2 focus:ring-primary-300
                       active:bg-primary-700 transition-colors duration-150"
          >
            {/* [designer] [設計] 地圖控制按鈕的 focus/active 顏色層級已修正為一致。 */}
            {/* [designer] [設計] 按鈕圖標顏色已改用 semantic token `text-secondary-700`。 */}
            <ZoomIn className="w-5 h-5 text-secondary-700" />
          </button>
          <button
            onClick={() => setZoom(Math.max(1, zoom - 1))}
            className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center
                       hover:bg-gray-50 focus:ring-2 focus:ring-primary-300
                       active:bg-primary-700 transition-colors duration-150"
          >
            <ZoomOut className="w-5 h-5 text-secondary-700" />
          </button>
          <button
            className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center
                       hover:bg-gray-50 focus:ring-2 focus:ring-primary-300
                       active:bg-primary-700 transition-colors duration-150"
          >
            <Navigation className="w-5 h-5 text-secondary-700" />
          </button>
          <button
            className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center
                       hover:bg-gray-50 focus:ring-2 focus:ring-primary-300
                       active:bg-primary-700 transition-colors duration-150"
          >
            <Layers className="w-5 h-5 text-secondary-700" />
          </button>
        </div>

        {/* 地點列表 */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-white rounded-2xl shadow-xl p-4 max-w-md">
            <h3 className="font-bold text-gray-900 mb-3">景點列表</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {locations.length === 0 ? (
                <p className="text-body-sm text-gray-500 text-center py-4">沒有可顯示的地點</p>
              ) : (
                locations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors duration-150
                              focus:outline-none focus:ring-2 focus:ring-primary-300
                              ${selectedLocation?.id === location.id
                                ? 'bg-primary-100 text-primary-900 active:bg-primary-200' // 選中狀態使用 primary Token
                                : 'hover:bg-gray-50 active:bg-gray-100' // 未選中狀態的 hover/active 樣式
                              }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${getMarkerColor(location.type)}`} />
                    {/* [designer] [設計] 列表項目文字字體層級已改為 text-body-sm。 */}
                    <span className="text-body-sm font-medium text-gray-900">{location.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 圖例說明 */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-6 justify-center">
          {/* 遍歷 LOCATION_TYPE_COLOR_MAP 生成圖例，保持一致性 */}
          {Object.entries(LOCATION_TYPE_COLOR_MAP).map(([type, colorClass]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colorClass}`} />
              {/* [designer] [設計] 圖例文字字體層級已改為 text-body-sm。 */}
              <span className="text-body-sm text-gray-600">
                {type === 'attraction' && '景點'}
                {type === 'hotel' && '住宿'}
                {type === 'restaurant' && '餐廳'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}