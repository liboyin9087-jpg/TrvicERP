import React, { memo } from 'react';
import { MapPin, Camera, Calendar, Heart } from 'lucide-react';

interface Footprint {
  id: string;
  location: string;
  date: string;
  image: string;
  likes: number;
}

interface TravelFootprintProps {
  footprints?: Footprint[];
}

const MOCK_FOOTPRINTS: Footprint[] = [
  { id: '1', location: '東京鐵塔', date: '2024-12-15', image: 'https://images.unsplash.com/photo-1542183427-68c4c7952402?w=400', likes: 24 },
  { id: '2', location: '淺草寺', date: '2024-12-16', image: 'https://images.unsplash.com/photo-1596557677270-4f74f74d0d0f?w=400', likes: 31 },
  { id: '3', location: '澀谷十字路口', date: '2024-12-17', image: 'https://images.unsplash.com/photo-1597484662317-9bd76add290b?w=400', likes: 18 },
];

const TravelFootprint: React.FC<TravelFootprintProps> = memo(({ footprints = MOCK_FOOTPRINTS }) => {
  const handleLikeClick = (id: string) => {
    console.log('Like clicked for footprint:', id);
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in" role="main">
      <header className="bg-black text-white px-6 py-4">
        <div className="flex items-center gap-3" aria-label="旅遊足跡標題">
          <MapPin className="w-6 h-6" aria-hidden="true" />
          <h1 className="text-xl font-bold">旅遊足跡</h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">您的旅行回憶</p>
      </header>

      <div className="bg-white border-b border-gray-100 px-6 py-4" role="region" aria-label="旅遊統計">
        <div className="flex justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">3</p>
            <p className="text-xs text-gray-500">旅遊國家</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">12</p>
            <p className="text-xs text-gray-500">造訪城市</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">45</p>
            <p className="text-xs text-gray-500">打卡景點</p>
          </div>
        </div>
      </div>

      <main className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {footprints.map((footprint) => (
            <article key={footprint.id} className="bg-white rounded-xl overflow-hidden border border-gray-100">
              <div className="relative aspect-square">
                <img 
                  src={footprint.image} 
                  alt={`${footprint.location}的照片`} 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h2 className="font-semibold text-sm">{footprint.location}</h2>
                  <p className="text-xs opacity-80 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {footprint.date}
                  </p>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <button 
                  onClick={() => handleLikeClick(footprint.id)}
                  className="flex items-center gap-1 text-gray-500"
                  aria-label={`喜歡 ${footprint.location}`}
                >
                  <Heart className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm">{footprint.likes}</span>
                </button>
                <Camera className="w-4 h-4 text-gray-400" aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
});

TravelFootprint.displayName = 'TravelFootprint';
export default TravelFootprint;