import React from 'react';
import { MapPin, TrendingUp } from 'lucide-react';
import type { GenericWidget } from '@/core/types/dashboard';

/**
 * World Map Widget Configuration
 */
export interface WorldMapWidgetConfig {
  /** Show destination ranking */
  showRanking?: boolean;
  /** Maximum destinations to show */
  maxDestinations?: number;
}

/**
 * Destination data structure
 */
interface DestinationData {
  id: string;
  name: string;
  emoji: string;
  count: number;
  coordinates: { x: number; y: number }; // Percentage-based coordinates
}

interface WorldMapWidgetProps {
  widget: GenericWidget<WorldMapWidgetConfig>;
  destinations?: DestinationData[];
}

/**
 * World Map Widget - Interactive Map
 * 世界地圖 Widget - 互動式地圖
 */
export default function WorldMapWidget({ widget, destinations = [] }: WorldMapWidgetProps) {
  const { showRanking = true, maxDestinations = 10 } = widget.config;

  // Use sample data if no destinations provided
  const displayDestinations = destinations.length > 0 ? destinations : [
    { id: '1', name: '東京', emoji: '🗼', count: 45, coordinates: { x: 75, y: 35 } },
    { id: '2', name: '首爾', emoji: '🏯', count: 38, coordinates: { x: 73, y: 33 } },
    { id: '3', name: '曼谷', emoji: '🛕', count: 32, coordinates: { x: 65, y: 50 } },
    { id: '4', name: '新加坡', emoji: '🦁', count: 28, coordinates: { x: 65, y: 58 } },
    { id: '5', name: '峇里島', emoji: '🏝️', count: 25, coordinates: { x: 68, y: 62 } },
    { id: '6', name: '巴黎', emoji: '🗼', count: 22, coordinates: { x: 45, y: 28 } },
    { id: '7', name: '倫敦', emoji: '🏛️', count: 18, coordinates: { x: 43, y: 25 } },
  ];

  const sortedDestinations = [...displayDestinations].sort((a, b) => b.count - a.count).slice(0, maxDestinations);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg p-6 shadow-lg relative overflow-hidden">
      {/* Floating Clouds */}
      <div className="absolute top-10 left-20 w-24 h-12 bg-white/60 rounded-full blur-sm animate-float-cloud" />
      <div className="absolute top-16 right-32 w-20 h-10 bg-white/50 rounded-full blur-sm animate-float-delayed" />
      <div className="absolute top-32 left-48 w-16 h-8 bg-white/40 rounded-full blur-sm animate-float-cloud" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Popular Destinations</h3>
            <p className="text-xs text-slate-600">熱門目的地地圖</p>
          </div>
        </div>
      </div>

      {/* World Map Visualization */}
      <div className="relative z-10 flex-1 bg-white/80 rounded-xl p-4 shadow-inner mb-4">
        <div className="relative w-full h-full">
          {/* Simplified World Map SVG */}
          <svg viewBox="0 0 800 400" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Ocean Background */}
            <rect width="800" height="400" fill="#e0f2fe" />
            
            {/* Simple Continent Shapes */}
            <g fill="#93c5fd" stroke="#60a5fa" strokeWidth="2">
              {/* Asia */}
              <path d="M 550 100 Q 600 120 650 140 Q 680 180 660 220 Q 620 240 580 230 Q 540 210 520 180 Q 500 150 520 120 Z" />
              
              {/* Europe */}
              <path d="M 350 100 L 380 90 L 410 100 L 420 120 L 410 140 L 380 145 L 350 135 Z" />
              
              {/* Americas */}
              <path d="M 150 100 Q 180 90 200 110 L 210 180 Q 200 220 180 240 L 160 230 Q 140 200 145 160 Z" />
              
              {/* Australia */}
              <path d="M 620 280 L 660 275 L 680 295 L 670 320 L 640 325 L 620 310 Z" />
            </g>

            {/* Destination Markers */}
            {displayDestinations.map((dest) => {
              const x = (dest.coordinates.x / 100) * 800;
              const y = (dest.coordinates.y / 100) * 400;

              return (
                <g key={dest.id} className="cursor-pointer hover:scale-110 transition-transform">
                  {/* Pulse Animation Ring */}
                  <circle cx={x} cy={y} r="12" fill="rgb(59, 130, 246)" opacity="0.4" className="animate-ping" />
                  
                  {/* Marker Dot */}
                  <circle cx={x} cy={y} r="6" fill="rgb(239, 68, 68)" stroke="white" strokeWidth="2" className="drop-shadow-lg" />
                  
                  {/* Flag Pole */}
                  <line x1={x} y1={y - 6} x2={x} y2={y - 20} stroke="rgb(239, 68, 68)" strokeWidth="1.5" />
                  
                  {/* Flag */}
                  <path d={`M ${x} ${y - 20} L ${x + 12} ${y - 17} L ${x} ${y - 14} Z`} fill="rgb(251, 146, 60)" />
                  
                  {/* Label */}
                  <text x={x} y={y - 25} fontSize="10" fontWeight="bold" fill="rgb(30, 41, 59)" textAnchor="middle">
                    {dest.emoji}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Destination Ranking */}
      {showRanking && (
        <div className="relative z-10 bg-white/80 rounded-xl p-4 shadow-inner max-h-48 overflow-auto scrollbar-thin">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h4 className="text-sm font-bold text-slate-700">Top Destinations</h4>
          </div>
          <div className="space-y-2">
            {sortedDestinations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No destination data</p>
            ) : (
              sortedDestinations.map((dest, index) => (
                <div key={dest.id} className="flex items-center justify-between py-2 px-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-blue-600 w-6">#{index + 1}</span>
                    <span className="text-2xl">{dest.emoji}</span>
                    <span className="text-sm font-semibold text-slate-700">{dest.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-600">{dest.count}</span>
                    <span className="text-xs text-slate-500">trips</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
