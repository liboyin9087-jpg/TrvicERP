// Unified Icon System - Semantic mapping to prevent inconsistent usage
import {
  // User & People
  User,
  Users,
  UserCheck,
  UserCog,
  UserX,

  // Navigation & Actions
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,

  // Travel & Tourism
  Plane,
  MapPin,
  Calendar,
  Clock,
  Camera,
  Map,
  Navigation,
  Compass,

  // Business & Operations
  Building,
  Briefcase,
  FileText,
  FileCheck,
  FileX,
  Folder,
  FolderOpen,

  // Communication
  Phone,
  Mail,
  MessageCircle,
  Send,
  Bell,

  // Interface Elements
  Search,
  Filter,
  Settings,
  MoreHorizontal,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Minus,
  X,
  Check,

  // Status & Feedback
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,

  // Media & Content
  Image,
  Video,
  Download,
  Upload,
  Share,

  // Financial
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,

  // System
  Loader2,
  RefreshCw,
  Power,
  Wifi,
  WifiOff,
} from "lucide-react";

// ============================================
// Semantic Icon Mappings
// ============================================

export const ICON_MAP = {
  // User-related icons (consistent naming)
  user: User, // Single user representation
  users: Users, // Multiple users/groups
  userVerified: UserCheck, // Verified/approved user
  userSettings: UserCog, // User configuration
  userBlocked: UserX, // Blocked/disabled user

  // Navigation (consistent directional icons)
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowDown: ArrowDown,
  arrowUp: ArrowUp,

  // Travel & Tourism (primary domain icons)
  travel: Plane, // Main travel icon
  flight: Plane, // Flight booking
  location: MapPin, // Location marker
  destination: MapPin, // Travel destination
  date: Calendar, // Date selection
  schedule: Calendar, // Tour schedule
  time: Clock, // Time/duration
  photo: Camera, // Photography/galleries
  map: Map, // Maps and routes
  navigation: Navigation, // GPS navigation
  explore: Compass, // Exploration/discovery

  // Business Operations
  company: Building, // Company/agency
  business: Briefcase, // Business operations
  document: FileText, // General documents
  documentApproved: FileCheck, // Approved documents
  documentRejected: FileX, // Rejected documents
  folder: Folder, // File organization
  folderOpen: FolderOpen, // Active/open folder

  // Communication
  phone: Phone, // Phone contact
  email: Mail, // Email communication
  chat: MessageCircle, // Chat/messaging
  send: Send, // Send action
  notification: Bell, // Notifications

  // Interface Actions
  search: Search, // Search functionality
  filter: Filter, // Filter/sort
  settings: Settings, // Settings/configuration
  menuHorizontal: MoreHorizontal, // Horizontal menu
  menuVertical: MoreVertical, // Vertical menu
  edit: Edit, // Edit action
  delete: Trash2, // Delete action
  add: Plus, // Add/create action
  remove: Minus, // Remove action
  close: X, // Close/cancel action
  confirm: Check, // Confirm/accept action

  // Status & Feedback (semantic status indicators)
  warning: AlertTriangle, // Warning state
  alert: AlertCircle, // Alert/attention needed
  success: CheckCircle, // Success state
  info: Info, // Information
  visible: Eye, // Show/visible
  hidden: EyeOff, // Hide/invisible

  // Media & Content
  image: Image, // Image content
  video: Video, // Video content
  download: Download, // Download action
  upload: Upload, // Upload action
  share: Share, // Share action

  // Financial (for booking/payment)
  payment: CreditCard, // Payment methods
  price: DollarSign, // Pricing
  growth: TrendingUp, // Positive trends
  decline: TrendingDown, // Negative trends

  // System Status
  loading: Loader2, // Loading states
  refresh: RefreshCw, // Refresh action
  power: Power, // Power/system control
  online: Wifi, // Online status
  offline: WifiOff, // Offline status
} as const;

// ============================================
// Type Exports & Legacy Support
// ============================================

export type IconName = keyof typeof ICON_MAP;

// Legacy exports for backward compatibility
import * as Icons from "lucide-react";
export const Icon = Icons;
export default Icon;

/**
 * Get icon component by semantic name
 * @param iconName - Semantic name from ICON_MAP
 * @returns React component or null if not found
 */
export function getIcon(iconName: keyof typeof ICON_MAP) {
  return ICON_MAP[iconName] || null;
}
