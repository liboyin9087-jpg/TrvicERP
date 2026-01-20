export interface TourPackage {
  id: string;
  name: string;
  description: string;
  duration: number; // 天數
  basePrice: number;
  costPrice: number;
  minGroupSize: number;
  maxGroupSize: number;
  earlyBirdDiscount?: number;
  groupDiscount?: number;
  variants: TourVariant[];
  extraServices: ExtraService[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface TourVariant {
  id: string;
  name: string;
  priceAdjustment: number;
  roomType?: 'single' | 'double' | 'suite';
  cabinClass?: 'economy' | 'business' | 'first';
}

export interface ExtraService {
  id: string;
  name: string;
  price: number;
  type: 'insurance' | 'single_room' | 'visa' | 'guide' | 'other';
  required: boolean;
}

export interface ItineraryDay {
  id: string;
  dayNumber: number;
  date?: string;
  activities: Activity[];
  accommodation?: Accommodation;
  transportation: Transportation[];
  meals: Meal[];
  guideNotes?: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  cost?: number;
  images: string[];
}

export interface Accommodation {
  id: string;
  name: string;
  type: 'hotel' | 'resort' | 'hostel';
  roomType: string;
  checkIn: string;
  checkOut: string;
  costPerNight: number;
}

export interface Transportation {
  id: string;
  type: 'flight' | 'bus' | 'train' | 'car';
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  cost: number;
  provider: string;
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  restaurant: string;
  cuisine: string;
  cost: number;
  included: boolean;
}

export interface Booking {
  id: string;
  packageId: string;
  customerId: string;
  status: 'lead' | 'quoted' | 'confirmed' | 'cancelled';
  passengers: Passenger[];
  totalPrice: number;
  paidAmount: number;
  balance: number;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Passenger {
  id: string;
  bookingId: string;
  name: string;
  passportNumber?: string;
  visaStatus?: 'none' | 'applied' | 'approved' | 'rejected';
  specialNeeds?: string;
  roomAssignment?: string;
  flightInfo?: FlightInfo;
}

export interface FlightInfo {
  flightNumber: string;
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
}

export interface Supplier {
  id: string;
  name: string;
  type: 'hotel' | 'transport' | 'restaurant' | 'guide' | 'attraction';
  contactInfo: ContactInfo;
  contractRate: number;
  paymentTerms: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  person: string;
}
