import React from 'react';
import { MapPin, Camera, Calendar, Heart } from 'lucide-react';

/**
 * Defines the structure for a single travel footprint entry.
 */
interface Footprint {
  id: string;
  location: string;
  date: string;
  image: string;
  likes: number;
}

/**
 * Defines the statistical data for travel.
 */
interface TravelStats {
  countries: number;
  cities: number;
  attractions: number;
}

/**
 * Defines the props interface for the TravelFootprint component.
 * This adheres to the Kintone independence principle, allowing data to be passed via configuration.
 */
export interface TravelFootprintConfig {
  footprints: Footprint[];
  stats: TravelStats;
  // Optional configurable properties for the component's title and description
  widgetTitle?: string;
  widgetDescription?: string;
}

/**
 * A client-side React component to display travel footprints.
 * It's designed as a standalone widget configurable via props, adhering to Dashtail UI guidelines.
 */
export default function TravelFootprint({ footprints, stats, widgetTitle, widgetDescription }: TravelFootprintConfig) {
  // Use provided titles/descriptions or fall back to defaults
  const componentTitle = widgetTitle || '旅遊足跡';
  const componentDescription = widgetDescription || '您的旅行回憶';

  return (
    // Widget Card Structure (Dashtail UI compliant)
    // Removed page-level styles like min-h-screen and bg-gray-50, as this is a widget.
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 w-full max-w-lg mx-auto">
      {/* Drag Handle - Required for Dashtail UI Widget */}
      {/* This area allows users to drag the widget on a dashboard. */}
      <div className="drag-handle bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between cursor-grab text-gray-700">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-600" /> {/* Using primary token */}
          <h2 className="text-md font-semibold">{componentTitle}</h2>
        </div>
        <span className="text-gray-400 text-sm">拖曳此處</span> {/* Indicative text for the drag area */}
      </div>

      {/* Main Header Section */}
      <header className="bg-primary-900 text-white px-6 py-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6" />
          <h1 className="text-xl font-bold">{componentTitle}</h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">{componentDescription}</p>
      </header>

      {/* Stats Section - Displays aggregated travel numbers */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.countries}</p>
            <p className="text-sm text-gray-500">旅遊國家</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.cities}</p>
            <p className="text-sm text-gray-500">造訪城市</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.attractions}</p>
            <p className="text-sm text-gray-500">打卡景點</p>
          </div>
        </div>
      </div>

      {/* Footprints Grid - Displays individual travel entries */}
      <main className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {footprints.length > 0 ? (
            footprints.map((footprint) => (
              <div
                key={footprint.id}
                className="bg-white rounded-lg overflow-hidden border border-gray-100 group transition-all duration-200 hover:shadow-lg"
              >
                <div className="relative aspect-square">
                  {/* Image */}
                  <img
                    src={footprint.image}
                    alt={footprint.location}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Footprint Info Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="font-semibold text-sm truncate" title={footprint.location}>
                      {footprint.location}
                    </p>
                    <p className="text-xs opacity-80 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {footprint.date}
                    </p>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="p-3 flex items-center justify-between">
                  <button
                    className="flex items-center gap-1 text-gray-500 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
                    aria-label={`Like this footprint, currently ${footprint.likes} likes`}
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    <span className="text-sm">{footprint.likes}</span>
                  </button>
                  <Camera className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-gray-500">
              <p>目前沒有旅遊足跡可以顯示。</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}