import React from 'react';
import { MapPin, Camera, Calendar, Heart } from 'lucide-react';

interface Footprint { id: string; location: string; date: string; image: string; likes: number; }

const MOCK_FOOTPRINTS: Footprint[] = [
  { id: '1', location: '東京鐵塔', date: '2024-12-15', image: 'https://images.unsplash.com/photo-1542183427-68c4c7952402?w=400', likes: 24 },
  { id: '2', location: '淺草寺', date: '2024-12-16', image: 'https://images.unsplash.com/photo-1596557677270-4f74f74d0d0f?w=400', likes: 31 },
  { id: '3', location: '澀谷十字路口', date: '2024-12-17', image: 'https://images.unsplash.com/photo-1597484662317-9bd76add290b?w=400', likes: 18 },
];

export default function TravelFootprint() {
  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
      <header className="bg-primary-900 text-white px-6 py-4 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
        <div className="flex items-center gap-3"><MapPin className="w-6 h-6" /><h1 className="text-xl font-bold">旅遊足跡</h1></div>
        <p className="text-sm text-gray-400 mt-1">您的旅行回憶</p>
      </header>

      {/* Stats */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
        <div className="flex justify-around">
          <div className="text-center"><p className="text-2xl font-bold text-gray-900">3</p><p className="text-sm text-gray-500">旅遊國家</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-gray-900">12</p><p className="text-sm text-gray-500">造訪城市</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-gray-900">45</p><p className="text-sm text-gray-500">打卡景點</p></div>
        </div>
      </div>

      {/* Footprints Grid */}
      <main className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {MOCK_FOOTPRINTS.map((footprint) => (
            <div key={footprint.id} className="bg-white rounded-lg overflow-hidden border border-gray-100 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
              <div className="relative aspect-square">
                <img src={footprint.image} alt={footprint.location} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="font-semibold text-sm">{footprint.location}</p>
                  <p className="text-sm opacity-80 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" />{footprint.date}</p>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <button className="flex items-center gap-1 text-gray-500"><Heart className="w-4 h-4" /><span className="text-sm">{footprint.likes}</span></button>
                <Camera className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
