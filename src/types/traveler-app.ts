/**
 * Traveler App Types
 */

export type TabKey = 'home' | 'explore' | 'register' | 'account' | 'feedback';

export interface AvailableTrip {
  id: string;
  title: string;
  name: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  price: number;
  availability: number;
  imageUrl?: string;
  image?: string;
  tags?: string[];
  status?: 'available' | 'full' | 'cancelled';
  spotsLeft?: number;
  totalSpots?: number;
  subsidyType?: 'percentage' | 'fixed' | 'none';
  subsidyAmount?: number;
  maxSubsidy?: number;
  registrationDeadline?: string;
  highlights?: string[];
}

export interface MyRegistration {
  id: string;
  tripId: string;
  tripTitle: string;
  registrationDate: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  participantCount: number;
  totalPrice: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
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
  subsidyTier?: string;
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
  participantCount: number;
  participants: Array<{
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  }>;
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
