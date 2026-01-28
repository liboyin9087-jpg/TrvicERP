import React, { useState } from 'react';
import { MapPin, Clock, Camera, Utensils, Bus, ChevronLeft, ChevronRight } from 'lucide-react';

interface ItineraryItem { id: string; time: string; title: string; location: string; type: 'attraction' | 'meal' | 'transport' | 'hotel'; duration: number; image?: string; }

const MOCK_ITINERARY: Record<number, ItineraryItem[]> = {
  1: [
    { id: '1', time: '09:00', title: '桃園國際機場集合', location: '第一航廈', type: 'transport', duration: 60 },
    { id: '2', time: '14:00', title: '抵達成田機場', location: '東京', type: 'transport', duration: 90 },
    { id: '3', time: '17:00', title: '淺草寺', location: '東京台東區', type: 'attraction', duration: 90, image: 'https://images.unsplash.com/photo-1596557677270-4f74f74d0d0f?w=400' },
    { id: '4', time: '19:00', title: '團體晚餐', location: '淺草燒肉', type: 'meal', duration: 90 },
  ],
  2: [
    { id: '5', time: '09:00', title: '東京鐵塔', location: '港區芝公園', type: 'attraction', duration: 120, image: 'https://images.unsplash.com/photo-1542183427-68c4c7952402?w=400' },
    { id: '6', time: '12:00', title: '午餐', location: '六本木', type: 'meal', duration: 60 },
    { id: '7', time: '14:00', title: '澀谷十字路口', location: '澀谷區', type: 'attraction', duration: 90, image: 'https://images.unsplash.com/photo-1597484662317-9bd76add290b?w=400' },
  ],
};

export default function ItineraryView() {
  const [currentDay, setCurrentDay] = useState(1);
  const totalDays = Object.keys(MOCK_ITINERARY).length;
  const dayItems = MOCK_ITINERARY[currentDay] || [];

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      attraction: <Camera className="w-4 h-4" />,
      meal: <Utensils className="w-4 h-4" />,
      transport: <Bus className="w-4 h-4" />,
      hotel: <MapPin className="w-4 h-4" />,
    };
    return icons[type] || <MapPin className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Day Selector */}
      <div className="bg-primary-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
            disabled={currentDay === 1}
            className="p-2 hover:bg-primary-800 rounded-lg disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800 transition-colors duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-sm text-primary-300">東京五日深度遊</p>
            <h2 className="text-xl font-bold">Day {currentDay}</h2>
          </div>
          <button
            onClick={() => setCurrentDay(Math.min(totalDays, currentDay + 1))}
            disabled={currentDay === totalDays}
            className="p-2 hover:bg-primary-800 rounded-lg disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800 transition-colors duration-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalDays }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentDay(idx + 1)}
              className={`w-8 h-8 rounded-full font-semibold text-sm transition-colors duration-200
                ${currentDay === idx + 1
                  ? 'bg-white text-primary-900 focus:outline-none focus:ring-2 focus:ring-white/50 hover:bg-gray-100'
                  : 'bg-primary-700 text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300 hover:bg-primary-600'
                }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-6">
            {dayItems.map((item, idx) => (
              <div key={item.id} className="relative pl-10">
                <div className={`absolute left-2.5 w-3 h-3 rounded-full ${idx === 0 ? 'bg-brand-500' : 'bg-primary-300'} ring-4 ring-white`} />
                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200">
                  {item.image && <img src={item.image} alt={item.title} className="w-full h-32 object-cover" />}
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Clock className="w-4 h-4" /><span>{item.time}</span>
                      <span className="text-gray-300">•</span>
                      <span>{item.duration} 分鐘</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">{getTypeIcon(item.type)}{item.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}