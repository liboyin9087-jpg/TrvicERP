// =====================================================
// TravelCanvas - PocketGuide Component
// 旅客端行動導覽 (PWA Ready)
// =====================================================

import React, { useState, useEffect, useMemo } from 'react';
import { ItineraryItem, WeatherInfo, ActivityType } from '../types';
import { generateTodaysItinerary, GUIDE_CONTACT } from '../constants';
import { 
  Phone, 
  Sun, 
  CloudRain, 
  Clock, 
  AlertCircle, 
  User, 
  MapPin, 
  Filter, 
  Coffee, 
  Utensils, 
  Bus, 
  Camera 
} from './Icons';

const PocketGuide: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [itinerary] = useState<ItineraryItem[]>(generateTodaysItinerary());
  const [currentWeather] = useState<WeatherInfo>({
    temp: 24,
    condition: 'SUNNY',
    advice: '☀️ 陽光充足，請注意防曬並多補充水分。建議穿著輕便透氣衣物。'
  });

  // 篩選狀態
  const [activeFilter, setActiveFilter] = useState<'ALL' | ActivityType>('ALL');

  // 當前與下一個行程
  const [activeItem, setActiveItem] = useState<ItineraryItem | null>(null);
  const [nextItem, setNextItem] = useState<ItineraryItem | null>(null);
  const [timeToNext, setTimeToNext] = useState<string>('');

  // 每分鐘更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  // 根據時間判斷狀態
  useEffect(() => {
    const now = currentTime;
    
    const current = itinerary.find(item => now >= item.startTime && now <= item.endTime);
    setActiveItem(current || null);

    const next = itinerary.find(item => now < item.startTime);
    setNextItem(next || null);

    if (next) {
      const diffMs = next.startTime.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      setTimeToNext(`${hours}小時 ${mins}分`);
    }
  }, [currentTime, itinerary]);

  // 時間格式化
  const formatTime = (date: Date) => date.toLocaleTimeString('zh-TW', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });

  // 篩選選項
  const filterOptions: { label: string; value: 'ALL' | ActivityType }[] = [
    { label: '全部', value: 'ALL' },
    { label: '重要集合', value: 'MEETING' },
    { label: '景點活動', value: 'ACTIVITY' },
    { label: '餐食', value: 'MEAL' },
    { label: '自由時間', value: 'FREE' },
    { label: '交通移動', value: 'TRANSPORT' },
  ];

  // 計算各類型數量
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: itinerary.length };
    itinerary.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return counts;
  }, [itinerary]);

  // 篩選邏輯
  const filteredItinerary = itinerary.filter(
    item => activeFilter === 'ALL' || item.type === activeFilter
  );

  // 類型圖標
  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'MEAL': return <Utensils size={14} />;
      case 'TRANSPORT': return <Bus size={14} />;
      case 'ACTIVITY': return <Camera size={14} />;
      case 'FREE': return <Coffee size={14} />;
      case 'MEETING': return <AlertCircle size={14} />;
      default: return <MapPin size={14} />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-full pb-20 animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-6 py-4 shadow-sm flex justify-between items-end">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Day 2 • 大阪市區巡禮
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">今天</h1>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-light text-slate-900 tracking-tighter">
            {currentTime.toLocaleTimeString('zh-TW', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false 
            })}
          </div>
          <p className="text-xs text-slate-400">大阪, 日本</p>
        </div>
      </div>

      {/* 天氣條 */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-amber-100 to-orange-50 rounded-lg p-3 flex items-center gap-3 shadow-sm border border-amber-100">
        <div className="bg-white p-2 rounded-full text-amber-500 shadow-sm">
          {currentWeather.condition === 'SUNNY' ? <Sun size={20} /> : <CloudRain size={20} />}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-800">{currentWeather.temp}°C</span>
            <span className="text-xs text-slate-500 font-medium">體感舒適</span>
          </div>
          <p className="text-xs text-slate-700 mt-0.5 leading-tight">{currentWeather.advice}</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* 主要儀表板卡片 (狀態機) */}
        {activeItem ? (
          // 進行中活動
          <div className="rounded-2xl overflow-hidden shadow-lg relative h-64 text-white group">
            <img 
              src={activeItem.imageUrl} 
              alt={activeItem.activityName} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            
            <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 rounded-full text-xs font-bold animate-pulse">
              進行中 NOW
            </div>

            <div className="absolute bottom-0 left-0 p-6 w-full">
              <p className="opacity-80 text-sm mb-1 flex items-center gap-1">
                <MapPin size={16} /> {activeItem.locationName}
              </p>
              <h2 className="text-3xl font-bold mb-2 leading-tight">{activeItem.activityName}</h2>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                <p className="text-sm font-medium flex items-start gap-2">
                  <User size={16} className="mt-0.5 shrink-0" />
                  "{activeItem.tips}"
                </p>
              </div>
            </div>
          </div>
        ) : nextItem ? (
          // 等待下一個活動
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 bg-blue-500 blur-3xl opacity-20 rounded-full pointer-events-none"></div>
            
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
              下一個行程 Next Activity
            </p>
            
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">{nextItem.activityName}</h2>
                <p className="text-blue-200 text-sm flex items-center gap-1">
                  <Clock size={14} /> {formatTime(nextItem.startTime)} 開始
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-1">距離開始</p>
                <p className="text-3xl font-mono font-bold text-amber-400 tracking-tight">
                  {timeToNext}
                </p>
              </div>
            </div>

            {nextItem.type === 'MEETING' && (
              <div className="bg-rose-600/20 border border-rose-500/50 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="text-rose-500 shrink-0" size={20} />
                <div>
                  <p className="font-bold text-rose-200 text-sm">集合提醒</p>
                  <p className="text-xs text-rose-100/80 mt-1">
                    請務必準時抵達，遊覽車將準時發車不等人。
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 今日行程結束
          <div className="bg-slate-200 rounded-2xl p-8 text-center text-slate-500">
            <p>今日行程已結束</p>
          </div>
        )}

        {/* 篩選控制 */}
        <div className="sticky top-[80px] z-10 -mx-4 px-4 py-2 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <Filter size={16} className="text-slate-400 shrink-0" />
            {filterOptions.map((opt) => {
              const count = typeCounts[opt.value] || 0;
              if (opt.value !== 'ALL' && count === 0) return null;
              
              return (
                <button
                  key={opt.value}
                  onClick={() => setActiveFilter(opt.value)}
                  className={`
                    whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5
                    ${activeFilter === opt.value 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}
                  `}
                >
                  {opt.label}
                  <span className={`px-1.5 rounded-full text-[10px] ${
                    activeFilter === opt.value ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 行程時間軸 */}
        <div className="space-y-4">
          {filteredItinerary.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              此類別無行程
            </div>
          ) : (
            filteredItinerary.map((item) => {
              const isPast = currentTime > item.endTime;
              const isCurrent = activeItem?.id === item.id;
              
              return (
                <div 
                  key={item.id} 
                  className={`flex gap-4 group ${isPast ? 'opacity-50 grayscale' : 'opacity-100'}`}
                >
                  {/* 時間欄 */}
                  <div className="flex flex-col items-center pt-1 min-w-[50px]">
                    <span className={`text-sm font-bold font-mono ${isCurrent ? 'text-blue-600' : 'text-slate-900'}`}>
                      {formatTime(item.startTime)}
                    </span>
                    <div className="h-full w-0.5 bg-slate-200 my-2 relative">
                      {isCurrent && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full ring-4 ring-blue-100" />
                      )}
                    </div>
                  </div>

                  {/* 卡片欄 */}
                  <div className={`
                    flex-1 bg-white rounded-xl p-4 shadow-sm border transition-all
                    ${isCurrent ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100'}
                    ${item.isImportant ? 'border-l-4 border-l-rose-500' : ''}
                  `}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${
                          isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {item.type}
                        </span>
                      </div>
                      {item.isImportant && (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                          IMPORTANT
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`font-bold text-lg mb-1 ${isCurrent ? 'text-blue-900' : 'text-slate-900'}`}>
                      {item.activityName}
                    </h3>
                    
                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                      <MapPin size={12} /> {item.locationName}
                    </p>

                    {item.tips && !isPast && (
                      <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 border border-slate-100">
                        💡 {item.tips}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 緊急聯絡按鈕 */}
        <div className="fixed bottom-6 right-6">
          <button 
            onClick={() => alert(`撥打給導遊: ${GUIDE_CONTACT.name} (${GUIDE_CONTACT.phone})`)}
            className="w-14 h-14 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center text-white hover:scale-110 transition-transform hover:bg-emerald-600 active:scale-95"
            aria-label="聯絡導遊"
          >
            <Phone size={24} className="animate-pulse" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default PocketGuide;
