/**
 * 統一類型匯出
 * Unified Type Exports
 */

// 認證與權限
export * from './auth';

// 訂單管理
export * from './order';

// 報價管理
export * from './quotation';

// 行程安排
export * from './itinerary';

// 團次管理
export * from './session';

// 客戶管理
export * from './customer';

// 行程產品
export * from './tour';

export enum ItineraryState {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

export enum PassportStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired'
}

type ID = string & { readonly __brand: 'ID' };
type NTAmount = number & { readonly __brand: 'NTAmount' };
type TaxID = string & { readonly __brand: 'TaxID' };

export interface ItineraryItem {
  id: ID;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  state: ItineraryState;
}

export interface TourSession {
  id: ID;
  code: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  bookedCount: number;
}

export interface Booking {
  id: ID;
  sessionId: ID;
  customerId: ID;
  amount: NTAmount;
  createdAt: Date;
  updatedAt: Date;
}

export interface TourOption {
  id: ID;
  name: string;
  price: NTAmount;
  description: string;
}

export interface BookingSelection {
  id: ID;
  bookingId: ID;
  optionId: ID;
  quantity: number;
}

export interface Announcement {
  id: ID;
  title: string;
  content: string;
  createdAt: Date;
}

export interface PassportData {
  id: ID;
  passengerId: ID;
  passportNumber: string;
  expiryDate: Date;
  status: PassportStatus;
}

export interface UserFootprint {
  id: ID;
  userId: ID;
  action: string;
  timestamp: Date;
}

export interface Passenger {
  id: ID;
  name: string;
  phone: string;
  email: string;
  birthDate: Date;
}

export interface PassportLog {
  id: ID;
  passportId: ID;
  action: string;
  timestamp: Date;
}

export interface Companion {
  id: ID;
  passengerId: ID;
  name: string;
  relation: string;
}

export interface Supplier {
  id: ID;
  name: string;
  taxId: TaxID;
  contact: string;
}

export interface TourCost {
  id: ID;
  tourId: ID;
  item: string;
  amount: NTAmount;
  supplierId: ID;
}

export interface TourExpense {
  id: ID;
  tourId: ID;
  description: string;
  amount: NTAmount;
  date: Date;
}

export interface QuoteItem {
  id: ID;
  name: string;
  price: NTAmount;
  quantity: number;
}

export interface MiniQuoteItem {
  id: ID;
  name: string;
  price: NTAmount;
}

export interface LineChatLog {
  id: ID;
  userId: ID;
  message: string;
  timestamp: Date;
}

export interface CompanyBudget {
  id: ID;
  companyId: ID;
  year: number;
  amount: NTAmount;
}

export interface Poll {
  id: ID;
  question: string;
  options: PollOption[];
  endDate: Date;
}

export interface PollOption {
  id: ID;
  pollId: ID;
  text: string;
  votes: number;
}

export interface ChangeRequest {
  id: ID;
  bookingId: ID;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Incident {
  id: ID;
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface SpecialNeedsSummary {
  id: ID;
  bookingId: ID;
  needs: string[];
}

export interface GroupRoster {
  id: ID;
  sessionId: ID;
  passengers: Passenger[];
}

export interface RoomAssignment {
  id: ID;
  sessionId: ID;
  passengerId: ID;
  roomNumber: string;
}

export interface SeatAssignment {
  id: ID;
  sessionId: ID;
  passengerId: ID;
  seatNumber: string;
}

export interface HotelRoomAllocation {
  id: ID;
  sessionId: ID;
  roomType: string;
  count: number;
}

export interface TourLeader {
  id: ID;
  name: string;
  license: string;
  phone: string;
}

export interface MeetingInfo {
  id: ID;
  sessionId: ID;
  location: string;
  time: Date;
  notes: string;
}