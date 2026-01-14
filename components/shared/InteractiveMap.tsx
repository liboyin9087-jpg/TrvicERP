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
      attraction: 'bg-brand-500',
      hotel: 'bg-blue-500',
      restaurant: 'bg-orange-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 animate-fade-in">
      <div className="flex-1 relative">
        {/* Map Placeholder */}
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">互動地圖</p>
            <p className="text-sm text-gray-400">地圖功能需整合 Google Maps API</p>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button onClick={() => setZoom(Math.min(20, zoom + 1))} className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={() => setZoom(Math.max(1, zoom - 1))} className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50">
            <Navigation className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50">
            <Layers className="w-5 h-5" />
          </button>
        </div>

        {/* Location List */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 max-w-md">
            <h3 className="font-bold text-gray-900 mb-3">景點列表</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {MOCK_LOCATIONS.map((location) => (
                <button
                  key={location.id}
                  onClick={() => setSelectedLocation(location)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    selectedLocation?.id === location.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${getMarkerColor(location.type)}`} />
                  <span className="text-sm font-medium text-gray-900">{location.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-500" />
            <span className="text-sm text-gray-600">景點</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600">住宿</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm text-gray-600">餐廳</span>
          </div>
        </div>
      </div>
    </div>
  );
}
