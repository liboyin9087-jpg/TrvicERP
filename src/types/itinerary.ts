/**
 * Itinerary Type Definitions
 */

// SeasonType supports both English and Chinese strings
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'fall' | 'winter' | 'all' | '春' | '夏' | '秋' | '冬';

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
  category: SpotCategory[]; // Array of categories
  region: string;
  county: string; // Required: county/city (e.g., "新北市", "台東縣")
  description?: string;
  duration?: number;
  season?: SeasonType[] | string[]; // Array of seasons
  tags?: string[];
  target_audience: string[]; // Required: target audiences (e.g., ['親子', '文青', '情侶'])
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ScheduledSpot extends Spot {
  instanceId: string; // Required: unique instance identifier for drag-and-drop
  startTime?: string;
  notes?: string;
}

export interface DayPlan {
  id: string; // Required: unique day identifier
  dayNumber: number; // Day number in the itinerary
  title: string; // Day title (e.g., "第 1 天")
  spots: ScheduledSpot[];
  notes?: string;
}

export interface ItineraryVersion {
  version: number; // Version number
  created_at: string;
  created_by: string;
  changes: string; // Description of changes
  itinerary_data: {
    days: DayPlan[];
    destination: string;
    startDate: string;
    endDate: string;
  };
}

export interface ItineraryPlan {
  id: string;
  name: string; // Plan name
  destination: string; // Destination
  startDate: string;
  endDate: string;
  days: DayPlan[]; // Required: array of day plans
  current_version?: number; // Current version number
  versions?: ItineraryVersion[]; // Version history
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryBuilderConfig {
  availableSpots: Spot[]; // Required: available spots for the builder
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
