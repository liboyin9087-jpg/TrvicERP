/**
 * Root Types Re-export
 * 
 * This file provides backward compatibility for imports from the root types module.
 * All types are now defined in @/core/types and @/types directories.
 */

// Re-export all core types
export * from './src/core/types';

// Additional types for components
export type { DayItinerary, Itinerary, MealSchedule, Transport, Accommodation } from './src/core/types/itinerary';

/**
 * Booking type for backward compatibility
 */
export interface Booking {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  sessionId?: string;
  customerId?: string;
  customerName?: string;
  createdAt?: string;
  updatedAt?: string;
  totalAmount?: number;
  paidAmount?: number;
  notes?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * TourSession alias for backward compatibility
 */
export type { Session as TourSession } from './src/core/types';

/**
 * ItineraryItem alias for backward compatibility
 */
export type { DayItinerary as ItineraryItem } from './src/core/types/itinerary';

/**
 * GroupListItem type for SessionManager component
 */
export interface GroupListItem {
  id: string;
  group_number?: string;
  group_type?: 'welfare' | 'regular';
  start_date?: string;
  end_date?: string;
  status?: 'soliciting' | 'guaranteed' | 'closed' | 'completed' | 'cancelled';
  current_pax?: number;
  max_pax?: number;
  seat_release_date?: string;
  tour_leader_name?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * ProcessedBooking type for GroupRoster component
 */
export interface ProcessedBooking {
  id: string;
  customer_name?: string;
  email?: string;
  phone?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  special_needs?: string;
  booking_date?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}
