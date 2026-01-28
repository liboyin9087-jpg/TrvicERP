import { LatLng } from '@/types/geo'; // Assume a global type definition for LatLng exists or define it here if not. If not, I'll define it.

// Define LatLng type for better readability and future use
type LatLngLiteral = {
  lat: number;
  lng: number;
};

/**
 * Geographic Utility Constants
 */
const EARTH_RADIUS_KM = 6371; // Earth's radius in kilometers
const DEGREES_TO_RADIANS_FACTOR = Math.PI / 180;

/**
 * Travel Type Definitions
 * Represents different travel environments/conditions.
 */
export type TravelType = 'urban' | 'mountain';

/**
 * Default travel speed configurations in km/h.
 */
const TRAVEL_SPEEDS_KMH: Record<TravelType, number> = {
  urban: 35,   // Default speed for urban areas
  mountain: 20, // Default speed for mountainous areas
};

/**
 * Additional buffer time for travel estimation in minutes.
 */
const TRAVEL_BUFFER_MINUTES = 10;

/**
 * GeoUtility function for input validation.
 * @param {number} value - The number to validate.
 * @param {string} name - The name of the parameter for error messages.
 * @param {number} min - Optional minimum allowed value.
 * @param {number} max - Optional maximum allowed value.
 * @throws {Error} If the value is not a valid number or out of range.
 */
function validateNumberInput(value: number, name: string, min?: number, max?: number): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid input: ${name} must be a number.`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`Invalid input: ${name} must be at least ${min}.`);
  }
  if (max !== undefined && value > max) {
    throw new Error(`Invalid input: ${name} must be at most ${max}.`);
  }
}

/**
 * Calculates the straight-line distance between two geographical points using the Haversine formula.
 * @param {LatLngLiteral} point1 - The first point with latitude and longitude.
 * @param {LatLngLiteral} point2 - The second point with latitude and longitude.
 * @returns {number} The distance in kilometers.
 * @throws {Error} If input coordinates are invalid.
 */
export function calculateDistance(point1: LatLngLiteral, point2: LatLngLiteral): number {
  // Input validation
  validateNumberInput(point1.lat, 'Latitude 1', -90, 90);
  validateNumberInput(point1.lng, 'Longitude 1', -180, 180);
  validateNumberInput(point2.lat, 'Latitude 2', -90, 90);
  validateNumberInput(point2.lng, 'Longitude 2', -180, 180);

  const dLat = (point2.lat - point1.lat) * DEGREES_TO_RADIANS_FACTOR;
  const dLon = (point2.lng - point1.lng) * DEGREES_TO_RADIANS_FACTOR;

  const lat1Rad = point1.lat * DEGREES_TO_RADIANS_FACTOR;
  const lat2Rad = point2.lat * DEGREES_TO_RADIANS_FACTOR;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Estimates the travel time in minutes based on distance and travel type.
 * Assumes average speeds defined in `TRAVEL_SPEEDS_KMH`.
 * Includes a fixed buffer time for real-world scenarios.
 * @param {number} distanceKm - The distance to travel in kilometers.
 * @param {TravelType} type - The type of travel environment (e.g., 'urban', 'mountain').
 * @returns {number} The estimated travel time in minutes.
 * @throws {Error} If distance is invalid or travel type is unknown.
 */
export function estimateTravelTime(distanceKm: number, type: TravelType): number {
  // Input validation
  validateNumberInput(distanceKm, 'Distance', 0);

  const speed = TRAVEL_SPEEDS_KMH[type];

  if (speed === undefined) {
    throw new Error(`Invalid travel type: '${type}'. Supported types are: ${Object.keys(TRAVEL_SPEEDS_KMH).join(', ')}`);
  }

  const travelTimeHours = distanceKm / speed;
  const travelTimeMinutes = travelTimeHours * 60;

  return Math.round(travelTimeMinutes + TRAVEL_BUFFER_MINUTES);
}

// Example of a global LatLng definition if not already present in '@/types/geo'
// You might need to adjust this based on your project's actual structure.
/*
declare module '@/types/geo' {
  export interface LatLng {
    lat: number;
    lng: number;
  }
}
*/