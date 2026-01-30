/**
 * Widget Data Provider
 * Connects dashboard widgets to their data sources
 */

import type { Widget } from '@/core/types/dashboard';
import {
  getDepartureBoardSessions,
  getPassportStats,
  getJourneyTimeline,
  getDestinations,
  getRevenueData,
} from '@/data/travelWidgetsData';

/**
 * Get data for a specific widget based on its type
 */
export function getWidgetData(widget: Widget): Record<string, any> {
  switch (widget.type) {
    case 'departure-board':
      return {
        sessions: getDepartureBoardSessions(),
      };
    
    case 'passport-tracker': {
      const stats = getPassportStats();
      return {
        passports: stats.passports,
        totalPassports: stats.totalPassports,
        expiringPassports: stats.expiringPassports,
      };
    }
    
    case 'journey-timeline':
      return {
        journeys: getJourneyTimeline(),
      };
    
    case 'world-map':
      return {
        destinations: getDestinations(),
      };
    
    case 'revenue-compass': {
      const revenueData = getRevenueData();
      return {
        currentRevenue: revenueData.currentRevenue,
        targetRevenue: revenueData.targetRevenue,
        breakdown: revenueData.breakdown,
      };
    }
    
    default:
      return {};
  }
}
