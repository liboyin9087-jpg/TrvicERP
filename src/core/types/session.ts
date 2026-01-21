import { Branded, SessionId, SeriesId, TourId, HotelRoomAllocationId, SeatAssignmentId, TourLeaderId, UserId, NTAmount, PaxCount } from './branded';
import type { ItineraryVersion } from './itinerary';

export enum SessionStatus {
  SOLICITING = 'soliciting',
  GUARANTEED = 'guaranteed',
  CLOSED = 'closed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum GroupType {
  WELFARE = 'welfare',
  REGULAR = 'regular'
}

export enum RoomType {
  SINGLE = 'single',
  DOUBLE = 'double',
  TWIN = 'twin',
  FAMILY = 'family',
  SUITE = 'suite'
}

export enum VehicleType {
  BUS = 'bus',
  TRAIN = 'train',
  PLANE = 'plane',
  FERRY = 'ferry'
}

export interface HotelRoomAllocation {
  id: HotelRoomAllocationId;
  hotelName: string;
  roomType: RoomType;
  roomTypeLabel: string;
  totalCount: number;
  lockedCount: number;
  availableCount: number;
  pricePerNight: NTAmount;
  nights: number;
}

export interface SeatAssignment {
  id: SeatAssignmentId;
  vehicleType: VehicleType;
  vehicleNumber: string;
  seatNumber: string;
  passengerId: string;
  passengerName: string;
  bookingId: string;
  isAssigned: boolean;
}

export interface TourLeader {
  id: TourLeaderId;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  experienceYears: number;
}

export interface MeetingInfo {
  location: string;
  address: string;
  meetingTime: string;
  contactPerson: string;
  contactPhone: string;
  notes: string;
}

export interface Session {
  id: SessionId;
  seriesId: SeriesId;
  tourId: TourId;
  groupNumber: string;
  groupType: GroupType;
  startDate: string;
  endDate: string;
  status: SessionStatus;
  minPax: PaxCount;
  maxPax: PaxCount;
  currentPax: PaxCount;
  seatReleaseDate: string;
  priceTwd: NTAmount;
  agentCommission: NTAmount;
  hotelRooms: HotelRoomAllocation[];
  transportationSeats: SeatAssignment[];
  tourLeaderId: TourLeaderId;
  tourLeaderName: string;
  itineraryVersion: number;
  itineraryVersions: ItineraryVersion[];
  meetingInfo: MeetingInfo;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionData {
  seriesId: SeriesId;
  tourId: TourId;
  groupNumber: string;
  groupType: GroupType;
  startDate: string;
  endDate: string;
  minPax: PaxCount;
  maxPax: PaxCount;
  seatReleaseDate: string;
  priceTwd: NTAmount;
  agentCommission: NTAmount;
}

export interface UpdateSessionData {
  groupNumber: string;
  groupType: GroupType;
  startDate: string;
  endDate: string;
  status: SessionStatus;
  minPax: PaxCount;
  maxPax: PaxCount;
  currentPax: PaxCount;
  seatReleaseDate: string;
  priceTwd: NTAmount;
  agentCommission: NTAmount;
  tourLeaderId: TourLeaderId;
  tourLeaderName: string;
  meetingInfo: MeetingInfo;
}

export interface SessionQuery {
  tourId: TourId;
  status: SessionStatus | SessionStatus[];
  groupType: GroupType;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
}

export const SESSION_STATUS_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  [SessionStatus.SOLICITING]: [SessionStatus.GUARANTEED, SessionStatus.CANCELLED],
  [SessionStatus.GUARANTEED]: [SessionStatus.CLOSED, SessionStatus.CANCELLED],
  [SessionStatus.CLOSED]: [SessionStatus.COMPLETED, SessionStatus.CANCELLED],
  [SessionStatus.COMPLETED]: [],
  [SessionStatus.CANCELLED]: []
};

export function isValidSessionTransition(
  currentStatus: SessionStatus,
  newStatus: SessionStatus
): boolean {
  return SESSION_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}