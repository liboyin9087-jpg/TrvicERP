/**
 * Itinerary Type Definitions
 */

export type SeasonType = 'spring' | 'summer' | 'fall' | 'winter' | 'all';

export type SpotCategory = 
  | '綠色永續景點'
  | '山林秘境'
  | '海岸離島'
  | '文化深度體驗'
  | '農村慢旅'
  | '都市邊緣秘境';

export interface Spot {
  id: string;
  name: string;
  category: SpotCategory;
  region: string;
  description?: string;
  duration?: number;
  season?: SeasonType[];
  tags?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ScheduledSpot extends Spot {
  dayIndex: number;
  timeSlot?: string;
  notes?: string;
  order?: number;
}

export interface DayPlan {
  day: number;
  date?: string;
  spots: ScheduledSpot[];
  notes?: string;
}

export interface ItineraryVersion {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  days: DayPlan[];
}

export interface ItineraryPlan {
  id: string;
  title: string;
  description?: string;
  duration: number;
  currentVersion: string;
  versions: ItineraryVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryBuilderConfig {
  maxDays?: number;
  maxSpotsPerDay?: number;
  defaultDuration?: number;
  enableVersioning?: boolean;
}

export interface ItineraryFilter {
  season?: SeasonType;
  category?: SpotCategory;
  region?: string;
  searchQuery?: string;
}
