import React, { useState } from 'react';
import { Search, Plus, Minus, Save, Clock, MapPin, GripVertical, Trash2 } from 'lucide-react';

interface Attraction {
  id: string;
  name: string;
  image_url: string;
  type: string;
  duration_minutes: number;
}

const DEFAULT_ATTRACTIONS: Attraction[] = [
  { id: 'a1', name: '東京鐵塔', image_url: 'https://images.unsplash.com/photo-1542183427-68c4c7952402?w=200', type: '地標', duration_minutes: 60 },
  { id: 'a2', name: '淺草寺', image_url: 'https://images.unsplash.com/photo-1596557677270-4f74f74d0d0f?w=200', type: '文化', duration_minutes: 90 },
  { id: 'a3', name: '澀谷十字路口', image_url: 'https://images.unsplash.com/photo-1597484662317-9bd76add290b?w=200', type: '城市', duration_minutes: 30 },
  { id: 'a4', name: '築地市場', image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200', type: '美食', duration_minutes: 120 },
  { id: 'a5', name: '晴空塔', image_url: 'https://images.unsplash.com/photo-1590253230532-a67f6bc61c9e?w=200', type: '觀景', duration_minutes: 90 },
];

interface DayItem {
  instanceId: string;
  attraction: Attraction;
  time: string;
}

export default function VisualPlanner() {
  const [dayCount, setDayCount] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [itinerary, setItinerary] = useState<Record<string, DayItem[]>>({});
  const attractions = DEFAULT_ATTRACTIONS;

  const filteredAttractions = attractions.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToDay = (dayIndex: number, attraction: Attraction) => {
    const dayKey = `day-${dayIndex}`;
    const newItem: DayItem = { instanceId: `${attraction.id}-${Date.now()}`, attraction, time: '09:00' };
    setItinerary(prev => ({ ...prev, [dayKey]: [...(prev[dayKey] || []), newItem] }));
  };

  const removeFromDay = (dayKey: string, instanceId: string) => {
    setItinerary(prev => ({ ...prev, [dayKey]: prev[dayKey].filter(item => item.instanceId !== instanceId) }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 animate-fade-in">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">行程規劃器</h2>
          <p className="text-sm text-gray-500">拖曳景點至每日行程</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setDayCount(Math.max(1, dayCount - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors"><Minus className="w-4 h-4" /></button>
            <span className="px-4 py-1 font-semibold">{dayCount} 天</span>
            <button onClick={() => setDayCount(Math.min(14, dayCount + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
          <button className="bg-black text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors"><Save className="w-4 h-4" /> 儲存</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋景點..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredAttractions.map((attraction) => (
              <div key={attraction.id} className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {attraction.image_url && <img src={attraction.image_url} alt={attraction.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{attraction.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-medium">{attraction.type}</span>
                      <span className="text-xs text-gray-400">{attraction.duration_minutes}分鐘</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {Array.from({ length: Math.min(dayCount, 5) }).map((_, idx) => (
                    <button key={idx} onClick={() => addToDay(idx + 1, attraction)} className="flex-1 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg text-xs font-semibold transition-colors">D{idx + 1}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-brand-50 border-t border-brand-100 text-center">
            <p className="text-xs text-brand-700 font-semibold">💡 點擊 D1-D5 快速加入行程</p>
          </div>
        </aside>

        <main className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full">
            {Array.from({ length: dayCount }).map((_, idx) => {
              const dayKey = `day-${idx + 1}`;
              const dayItems = itinerary[dayKey] || [];
              return (
                <div key={dayKey} className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
                  <div className="bg-black text-white p-4">
                    <h3 className="font-bold">Day {idx + 1}</h3>
                    <p className="text-sm text-gray-400">{dayItems.length} 個景點</p>
                  </div>
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {dayItems.map((item) => (
                      <div key={item.instanceId} className="bg-gray-50 rounded-xl p-3 group">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            {item.attraction.image_url && <img src={item.attraction.image_url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">{item.attraction.name}</h4>
                              <button onClick={() => removeFromDay(dayKey, item.instanceId)} className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">{item.attraction.type}</span>
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {dayItems.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl py-12">
                        <Plus className="w-8 h-8 mb-2" />
                        <p className="text-sm">從左側加入景點</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
