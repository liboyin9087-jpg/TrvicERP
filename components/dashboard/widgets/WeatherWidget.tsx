import React from 'react';
import { Cloud, CloudRain, Sun } from 'lucide-react';
import type { Widget } from '@/core/types/dashboard';
import { WEATHER_DATA } from '@/data/dashboardData';

const ICON_MAP = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
};

export default function WeatherWidget(_: { widget: Widget }) {
  const Icon = ICON_MAP[WEATHER_DATA.condition] || Sun;

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-3xl font-bold text-gray-900">{WEATHER_DATA.temperature}°C</div>
        <div className="text-sm text-gray-500">
          {WEATHER_DATA.location} · {WEATHER_DATA.condition}
        </div>
        <div className="text-xs text-amber-600 mt-1">{WEATHER_DATA.note}</div>
      </div>
      <Icon size={48} className="text-amber-400" />
    </div>
  );
}
