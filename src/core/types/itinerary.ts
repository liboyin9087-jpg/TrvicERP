type ItineraryId = string & { readonly __brand: 'ItineraryId' };
type SessionId = string & { readonly __brand: 'SessionId' };
type UserId = string & { readonly __brand: 'UserId' };
type Price = number & { readonly __brand: 'Price' };
type Duration = number & { readonly __brand: 'Duration' };

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack'
}

export enum TransportType {
  BUS = 'bus',
  TRAIN = 'train',
  PLANE = 'plane',
  FERRY = 'ferry',
  TAXI = 'taxi',
  WALK = 'walk'
}

export enum ResourceConflictType {
  GUIDE = 'guide',
  DRIVER = 'driver',
  VEHICLE = 'vehicle'
}

export interface MealSchedule {
  id: string;
  type: MealType;
  time: string;
  location: string;
  restaurant: string;
  cuisine: string;
  price: Price;
  notes: string;
}

export interface Accommodation {
  id: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomCount: number;
  address: string;
  phone: string;
  price: Price;
  notes: string;
}

export interface Transport {
  id: string;
  type: TransportType;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  vehicleNumber: string;
  seatInfo: string;
  price: Price;
  notes: string;
}

export interface GuideAssignment {
  guideId: string;
  guideName: string;
  phone: string;
  email: string;
  licenseNumber: string;
  startTime: string;
  endTime: string;
}

export interface DriverAssignment {
  driverId: string;
  driverName: string;
  phone: string;
  licenseNumber: string;
  vehicleNumber: string;
  startTime: string;
  endTime: string;
}

export interface DayItinerary {
  day: number;
  date: string;
  spots: Array<{
    id: string;
    name: string;
    time: string;
    duration: Duration;
    description: string;
  }>;
  meals: MealSchedule[];
  accommodation: Accommodation;
  transports: Transport[];
  guide: GuideAssignment;
  driver: DriverAssignment;
  notes: string;
}

export interface Itinerary {
  id: ItineraryId;
  sessionId: SessionId;
  title: string;
  days: DayItinerary[];
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: UserId;
}

export interface ResourceConflict {
  type: ResourceConflictType;
  resourceId: string;
  resourceName: string;
  conflictDays: number[];
  message: string;
}

export function checkResourceConflicts(
  itineraries: Itinerary[]
): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];
  const guideSchedule: Map<string, Set<number>> = new Map();
  const driverSchedule: Map<string, Set<number>> = new Map();
  const vehicleSchedule: Map<string, Set<number>> = new Map();

  itineraries.forEach((itinerary) => {
    itinerary.days.forEach((day) => {
      if (day.guide) {
        if (!guideSchedule.has(day.guide.guideId)) {
          guideSchedule.set(day.guide.guideId, new Set());
        }
        guideSchedule.get(day.guide.guideId)!.add(day.day);
      }

      if (day.driver) {
        if (!driverSchedule.has(day.driver.driverId)) {
          driverSchedule.set(day.driver.driverId, new Set());
        }
        driverSchedule.get(day.driver.driverId)!.add(day.day);

        if (day.driver.vehicleNumber) {
          if (!vehicleSchedule.has(day.driver.vehicleNumber)) {
            vehicleSchedule.set(day.driver.vehicleNumber, new Set());
          }
          vehicleSchedule.get(day.driver.vehicleNumber)!.add(day.day);
        }
      }
    });
  });

  guideSchedule.forEach((days, guideId) => {
    // 導遊衝突檢查邏輯
  });

  driverSchedule.forEach((days, driverId) => {
    // 司機衝突檢查邏輯
  });

  vehicleSchedule.forEach((days, vehicleNumber) => {
    // 車輛衝突檢查邏輯
  });

  return conflicts;
}