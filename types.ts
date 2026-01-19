import type {
  HotelRoomAllocation as CoreHotelRoomAllocation,
  SeatAssignment as CoreSeatAssignment,
  TourLeader as CoreTourLeader,
  MeetingInfo as CoreMeetingInfo,
} from './src/core/types/session';

type ID = string & { readonly __brand: 'ID' };
type TWD = number & { readonly __brand: 'TWD' };
type DateTimeString = string & { readonly __brand: 'DateTimeString' };
type Email = string & { readonly __brand: 'Email' };
type URLString = string & { readonly __brand: 'URLString' };

enum AttractionType {
  LANDMARK = 'landmark',
  MUSEUM = 'museum',
  PARK = 'park',
  SHOPPING = 'shopping',
  DINING = 'dining',
  ACTIVITY = 'activity'
}

enum TourGroupType {
  WELFARE = 'welfare',
  REGULAR = 'regular'
}

enum TourStatus {
  SOLICITING = 'soliciting',
  GUARANTEED = 'guaranteed',
  CLOSED = 'closed',
  COMPLETED = 'completed'
}

enum RoomType {
  SINGLE = 'single',
  DOUBLE = 'double',
  TWIN = 'twin',
  FAMILY = 'family',
  SUITE = 'suite'
}

enum VehicleType {
  BUS = 'bus',
  TRAIN = 'train',
  PLANE = 'plane',
  FERRY = 'ferry'
}

enum BookingStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  PAID = 'paid',
  PENDING_PAYMENT = 'pending_payment',
  VERIFYING = 'verifying'
}

enum MealPreference {
  NORMAL = 'normal',
  VEGETARIAN = 'vegetarian',
  HALAL = 'halal',
  OTHER = 'other'
}

enum SupplierCategory {
  HOTEL = 'hotel',
  AIRLINE = 'airline',
  TRANSPORT = 'transport',
  RESTAURANT = 'restaurant'
}

enum CostType {
  FIXED = 'fixed',
  PER_PAX = 'per_pax'
}

enum CostStatus {
  ESTIMATED = 'estimated',
  COMMITTED = 'committed',
  PAID = 'paid'
}

enum PassportStatus {
  CUSTOMER = 'customer',
  SALES = 'sales',
  OP_SAFE = 'op_safe',
  EMBASSY = 'embassy',
  TOUR_LEADER = 'tour_leader',
  RETURNED = 'returned'
}

enum ExpenseCategory {
  MEAL = 'meal',
  TICKET = 'ticket',
  TRANSPORT = 'transport',
  TIP = 'tip',
  OTHER = 'other'
}

enum QuoteItemType {
  FLIGHT = 'flight',
  HOTEL = 'hotel',
  TRANSPORT = 'transport',
  ACTIVITY = 'activity',
  GUIDE = 'guide'
}

enum InteractionType {
  LINE = 'line',
  CALL = 'call',
  EMAIL = 'email',
  COUNTER = 'counter'
}

enum InteractionSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative'
}

enum PollStatus {
  ACTIVE = 'active',
  CLOSED = 'closed'
}

enum ChangeRequestCategory {
  ITINERARY = 'itinerary',
  HOTEL = 'hotel',
  MEAL = 'meal',
  PAX_COUNT = 'pax_count'
}

enum ChangeRequestStatus {
  PENDING = 'pending',
  OP_REVIEW = 'op_review',
  CLIENT_REVIEW = 'client_review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum RelationshipType {
  SPOUSE = 'spouse',
  CHILD = 'child',
  PARENT = 'parent',
  OTHER = 'other'
}

interface Attraction {
  id: ID;
  name: string;
  image_url: URLString;
  type: AttractionType;
  duration_minutes: number;
  lat: number;
  lng: number;
  description: string;
  address: string;
}

interface ItineraryItem extends Attraction {
  time: DateTimeString;
  instanceId: ID;
}

interface ItineraryState {
  [key: string]: ItineraryItem[];
}

interface TourSession {
  id: ID;
  series_id: ID;
  group_number: string;
  group_type: TourGroupType;
  start_date: DateTimeString;
  end_date: DateTimeString;
  status: TourStatus;
  min_pax: number;
  max_pax: number;
  current_pax: number;
  seat_release_date: DateTimeString;
  price_twd: TWD;
  agent_commission: TWD;
  hotel_rooms: HotelRoomAllocation[];
  transportation_seats: SeatAssignment[];
  tour_leader_id: ID;
  tour_leader_name: string;
  itinerary_version: number;
  itinerary_versions: ItineraryVersion[];
  meeting_info: MeetingInfo;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

interface HotelRoomAllocation extends CoreHotelRoomAllocation {
  hotel_name: string;
  room_type: RoomType;
  room_type_label: string;
  total_count: number;
  locked_count: number;
  available_count: number;
  price_per_night: TWD;
}

interface SeatAssignment extends CoreSeatAssignment {
  vehicle_type: VehicleType;
  vehicle_number: string;
  seat_number: string;
  passenger_name: string;
  is_assigned: boolean;
}

interface TourLeader extends CoreTourLeader {
  license_number: string;
  experience_years: number;
}

interface ItineraryVersion {
  version: number;
  created_at: DateTimeString;
  created_by: ID;
  changes: string;
  itinerary_data: unknown;
}

interface MeetingInfo extends CoreMeetingInfo {
  meeting_time: DateTimeString;
  contact_person: string;
  contact_phone: string;
}

interface TourOption {
  id: ID;
  session_id: ID;
  day_number: number;
  title: string;
  description: string;
  price_add_on: TWD;
  capacity_limit: number;
  quota_used: number;
  image_url: URLString;
}

interface BookingSelection {
  id: ID;
  booking_id: ID;
  option_id: ID;
  pax_count: number;
  total_price: TWD;
}

interface Announcement {
  id: ID;
  message: string;
  created_at: DateTimeString;
}

interface PassportData {
  name: string;
  passport_number: string;
  expiry_date: DateTimeString;
  nationality: string;
  birthday: DateTimeString;
  personal_id: string;
}

interface Booking {
  id: ID;
  session_id: ID;
  user_id: ID;
  customer_name: string;
  passport_data: PassportData;
  receipt_number: string;
  status: BookingStatus;
  total_amount: TWD;
  payment_proof_url: URLString;
  tags: string[];
  email: Email;
  room_type: RoomType;
  meal_preference: MealPreference;
  special_needs: string;
  seat_preference: string;
  companions: Companion[];
  assigned_room: string;
  assigned_seat: string;
}

interface UserFootprint {
  user_id: ID;
  email: Email;
  visited_countries: string[];
  trip_count: number;
}

interface Supplier {
  id: ID;
  name: string;
  category: SupplierCategory;
  contact_email: Email;
  payment_terms: string;
}

interface TourCost {
  id: ID;
  session_id: ID;
  supplier_id: ID;
  supplier_name: string;
  item_name: string;
  cost_type: CostType;
  unit_cost: number;
  currency: string;
  exchange_rate: number;
  status: CostStatus;
}

interface Passenger {
  id: ID;
  user_id: ID;
  name: string;
  english_name: string;
  passport_number: string;
  passport_location: PassportStatus;
  booking_id: ID;
  birthday: DateTimeString;
  personal_id: string;
  email: Email;
}

interface PassportLog {
  id: ID;
  passenger_id: ID;
  from_user: ID;
  to_user: ID;
  action: 'check_in' | 'transfer' | 'check_out';
  timestamp: DateTimeString;
}

interface TourExpense {
  id: ID;
  session_id: ID;
  tour_leader_id: ID;
  amount_foreign: number;
  currency: 'JPY' | 'USD' | 'EUR' | 'CNY';
  exchange_rate: number;
  amount_twd: TWD;
  category: ExpenseCategory;
  receipt_image_url: URLString;
  created_at: DateTimeString;
  note: string;
}

interface QuoteItem {
  id: ID;
  name: string;
  type: QuoteItemType;
  cost_per_pax: number;
  currency: string;
}

interface MiniQuoteItem {
  id: ID;
  item_name: string;
  cost_type: CostType;
  amount: number;
}

interface LineChatLog {
  id: ID;
  line_user_id: ID;
  message_type: 'text' | 'image';
  content: string;
  timestamp: DateTimeString;
  direction: 'inbound' | 'outbound';
}

interface CustomerInteraction {
  id: ID;
  type: InteractionType;
  content: string;
  agent_name: string;
  timestamp: DateTimeString;
  sentiment: InteractionSentiment;
}

interface CustomerProfile {
  id: ID;
  name: string;
  tags: string[];
  total_spend: TWD;
  interactions: CustomerInteraction[];
}

interface PublicTourData {
  id: ID;
  title: string;
  days: number;
  base_price: TWD;
  cover_image: URLString;
  description: string;
  itinerary_json: {
    points: { time: string; name: string; desc: string; image?: URLString }[];
    hotel: string;
  }[];
  share_token: string;
}

interface CompanyBudget {
  id: ID;
  company_name: string;
  total_budget: TWD;
  used_budget: TWD;
  last_updated: DateTimeString;
}

interface Poll {
  id: ID;
  title: string;
  description: string;
  deadline: DateTimeString;
  status: PollStatus;
  total_votes: number;
  ai_summary: string;
}

interface PollOption {
  id: ID;
  poll_id: ID;
  text: string;
  image_url: URLString;
  tags: string[];
  vote_count: number;
  is_winner: boolean;
}

interface ChangeRequest {
  id: ID;
  requester_name: string;
  category: ChangeRequestCategory;
  description: string;
  status: ChangeRequestStatus;
  cost_impact: TWD;
  created_at: DateTimeString;
  comments: string;
}

interface Incident {
  id: ID;
  title: string;
  severity: IncidentSeverity;
  status_message: string;
  timestamp: DateTimeString;
  is_active: boolean;
}

interface Companion {
  id: ID;
  name: string;
  relationship: RelationshipType;
  age: number;
  passport_number: string;
  special_needs: string;
}

interface SpecialNeedsSummary {
  category: string;
  count: number;
  passengers: { id: ID; name: string }[];
}

interface GroupRoster {
  session_id: ID;
  total_passengers: number;
  room_assignments: HotelRoomAllocation[];
  seat_assignments: SeatAssignment[];
  special_needs: SpecialNeedsSummary[];
  registration_progress: {
    total: number;
    confirmed: number;
    pending: number;
    percentage: number;
  };
}

interface RoomAssignment {
  roomNumber: string;
  room_type: RoomType;
  hotelName: string;
  occupants: { id: ID; name: string }[];
  checkIn: DateTimeString;
  checkOut: DateTimeString;
  notes: string;
}