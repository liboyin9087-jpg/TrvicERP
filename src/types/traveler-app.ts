/**
 * Traveler App Types
 */

export type TabKey = 'home' | 'explore' | 'register' | 'mytrips' | 'account' | 'feedback' | 'notifications';

export interface AvailableTrip {
  id: string;
  title: string;
  name?: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  price: number;
  availability: number;
  spotsLeft?: number;
  totalSpots?: number;
  imageUrl?: string;
  image?: string;
  tags?: string[];
  status?: 'available' | 'full' | 'cancelled';
  subsidyType?: string;
  subsidyAmount?: number;
  maxSubsidy?: number;
  registrationDeadline?: string;
  highlights?: string[];
}

export interface MyRegistration {
  id: string;
  tripId: string;
  tripTitle: string;
  tripName?: string;
  destination?: string;
  image?: string;
  registrationDate: string;
  startDate?: string;
  endDate?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  participantCount: number;
  totalPrice: number;
  roomType?: string;
  companions?: Array<{
    name: string;
    relation?: string;
  }>;
  subsidyAmount?: number;
  selfPay?: number;
  specialNeeds?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  date?: string;
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  profileImage?: string;
  subsidyTier?: 'silver' | 'gold' | 'platinum';
  seniority?: number;
  maxSubsidy?: number;
  isEligible?: boolean;
  department?: string;
  employeeId?: string;
  preferences?: {
    newsletter: boolean;
    notifications: boolean;
  };
}

export interface RegistrationFormData {
  tripId: string;
  destination?: string;
  mealPreference?: string;
  participantCount: number;
  participants: Array<{
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  }>;
  roomType?: string;
  companions?: Array<{
    name: string;
    relation?: string;
  }>;
  specialNeeds?: string;
  specialRequests?: string;
}

export interface TravelerAppState {
  currentTab: TabKey;
  user?: UserProfile;
  trips: AvailableTrip[];
  myRegistrations: MyRegistration[];
  notifications: Notification[];
  isLoading: boolean;
  error?: string;
}

// Add missing properties to support full component usage
export interface RegistrationFormData {
  tripId: string;
  destination?: string;
  mealPreference?: string;
  participantCount: number;
  participants: Array<{
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  }>;
  roomType?: string;
  companions?: Array<{
    name: string;
    relation?: string;
  }>;
  specialNeeds?: string;
  specialRequests?: string;
}

export interface MyRegistration {
  id: string;
  tripId: string;
  tripTitle: string;
  tripName?: string;
  destination?: string;
  image?: string;
  registrationDate: string;
  startDate?: string;
  endDate?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  participantCount: number;
  totalPrice: number;
  roomType?: string;
  companions?: Array<{
    name: string;
    relation?: string;
  }>;
  subsidyAmount?: number;
  selfPay?: number;
  specialNeeds?: string;
}
