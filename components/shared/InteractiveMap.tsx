import React, { useState } from 'react';
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'attraction' | 'hotel' | 'restaurant';
}

const MOCK_LOCATIONS: Location[] = [
  { id: '1', name: '東京鐵塔', lat: 35.6586, lng: 139.7454, type: 'attraction' },
  { id: '2', name: '淺草寺', lat: 35.7148, lng: 139.7967, type: 'attraction' },
  { id: '3', name: '新宿華盛頓飯店', lat: 35.6896, lng: 139.6997, type: 'hotel' },
  { id: '4', name: '築地壽司店', lat: 35.6654, lng: 139.7707, type: 'restaurant' },
];

export default function InteractiveMap() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [zoom, setZoom] = useState(12);

  const getMarkerColor = (type: string) => {
    const colors: Record<string, string> = {
      attraction: 'bg-primary-500', // 使用 primary-500 代替 brand-500
      hotel: 'bg-success-500',     // 使用 success-500 代替 accent-500
      restaurant: 'bg-warning-500', // 保持 warning-500 (符合等 token 規範)
    };
    return colors[type] || 'bg-gray-500'; // Fallback to gray
  };

  return (
    // 移除容器 div 上的 focus/active 狀態，因為它不是互動元素
    <div className="h-full flex flex-col bg-gray-100 animate-fade-in">
      <div className="flex-1 relative">
        {/* Map Placeholder */}
        {/* 移除占位符 div 上的 focus/active 狀態，因為它不是互動元素 */}
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">互動地圖</p>
            {/* 字級最小 text-sm (14px) 符合規範 */}
            <p className="text-sm text-gray-400">地圖功能需整合 Google Maps API</p>
          </div>
        </div>

        {/* Controls - 所有按鈕皆有 hover/focus/active 狀態 */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button onClick={() => setZoom(Math.min(20, zoom + 1))} className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
            <ZoomIn className="w-5 h-5 text-gray-700" /> {/* 可選：添加 icon 顏色 */}
          </button>
          <button onClick={() => setZoom(Math.max(1, zoom - 1))} className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
            <ZoomOut className="w-5 h-5 text-gray-700" /> {/* 可選：添加 icon 顏色 */}
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
            <Navigation className="w-5 h-5 text-gray-700" /> {/* 可選：添加 icon 顏色 */}
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
            <Layers className="w-5 h-5 text-gray-700" /> {/* 可選：添加 icon 顏色 */}
          </button>
        </div>

        {/* Location List */}
        <div className="absolute bottom-4 left-4 right-4">
          {/* 移除列表容器 div 上的 focus/active 狀態，因為它不是互動元素 */}
          <div className="bg-white rounded-2xl shadow-xl p-4 max-w-md">
            <h3 className="font-bold text-gray-900 mb-3">景點列表</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {MOCK_LOCATIONS.map((location) => (
                <button
                  key={location.id}
                  onClick={() => setSelectedLocation(location)}
                  // 根據規範，為所有按鈕加入 hover/focus/active 狀態
                  // 選中狀態使用 primary-* token
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800 ${
                    selectedLocation?.id === location.id
                      ? 'bg-primary-100 text-primary-900' // 選中時背景和文字使用 primary-* token
                      : 'hover:bg-gray-50' // 未選中時 hover 狀態
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${getMarkerColor(location.type)}`} />
                  {/* 字級最小 text-sm (14px) 符合規範 */}
                  <span className="text-sm font-medium text-gray-900">{location.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {/* 移除圖例容器 div 上的 focus/active 狀態，因為它不是互動元素 */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-6 justify-center">
          <div className="flex items-center gap-2">
            {/* 使用 primary-500 代替 brand-500，移除 visual div 上的 focus/active 狀態 */}
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            {/* 字級最小 text-sm (14px) 符合規範 */}
            <span className="text-sm text-gray-600">景點</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 使用 success-500 代替 accent-500，移除 visual div 上的 focus/active 狀態 */}
            <div className="w-3 h-3 rounded-full bg-success-500" />
            {/* 字級最小 text-sm (14px) 符合規範 */}
            <span className="text-sm text-gray-600">住宿</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 保持 warning-500，移除 visual div 上的 focus/active 狀態 */}
            <div className="w-3 h-3 rounded-full bg-warning-500" />
            {/* 字級最小 text-sm (14px) 符合規範 */}
            <span className="text-sm text-gray-600">餐廳</span>
          </div>
        </div>
      </div>
    </div>
  );
}