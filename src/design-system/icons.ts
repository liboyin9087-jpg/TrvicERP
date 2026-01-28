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
  Map, // Moved from Travel, more general navigation
  Navigation, // General direction icon
  Compass, // Moved from Travel, exploration/direction finding

  // Travel & Tourism
  Plane,
  MapPin,
  Calendar,
  Clock,
  Camera,

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

import { LucideIcon } from "lucide-react"; // Import LucideIcon type for consistent typing

// ============================================
// Type Definitions for Semantic Icon Mappings (Config Props Interfaces for categories)
// ============================================

/**
 * Interface defining the structure and semantic keys for User-related icons.
 */
export interface IUserIcons {
  user: typeof User; // Represents a single user
  users: typeof Users; // Represents multiple users or a group
  verified: typeof UserCheck; // Indicates a verified or approved user
  settings: typeof UserCog; // For user-specific configurations or profiles
  blocked: typeof UserX; // Denotes a blocked, disabled, or removed user
}

/**
 * Interface defining the structure and semantic keys for Navigation and directional icons.
 */
export interface INavigationIcons {
  chevronDown: typeof ChevronDown; // Downward chevron for dropdowns or expanding content
  chevronLeft: typeof ChevronLeft; // Leftward chevron for navigation or previous actions
  chevronRight: typeof ChevronRight; // Rightward chevron for navigation or next actions
  chevronUp: typeof ChevronUp; // Upward chevron for collapsing content or scrolling up
  arrowLeft: typeof ArrowLeft; // Left arrow for back navigation or directional indication
  arrowRight: typeof ArrowRight; // Right arrow for forward navigation or directional indication
  arrowDown: typeof ArrowDown; // Down arrow for scrolling, downloads, or expanding
  arrowUp: typeof ArrowUp; // Up arrow for scrolling, uploads, or collapsing
  map: typeof Map; // General map display or location visualization
  compass: typeof Compass; // For exploration, direction finding, or guides
  direction: typeof Navigation; // Represents general navigation or routing
}

/**
 * Interface defining the structure and semantic keys for Travel and Tourism specific icons.
 */
export interface ITravelIcons {
  plane: typeof Plane; // Primary icon for travel, flights, or booking
  mapPin: typeof MapPin; // For specific locations, destinations, or points of interest
  calendar: typeof Calendar; // For date selection, scheduling, or event management
  clock: typeof Clock; // Represents time, duration, or appointments
  camera: typeof Camera; // For photography, galleries, or media related to travel
}

/**
 * Interface defining the structure and semantic keys for Business Operations icons.
 */
export interface IBusinessIcons {
  building: typeof Building; // Represents a company, organization, or office building
  briefcase: typeof Briefcase; // For business operations, portfolios, or professional activities
  document: typeof FileText; // General icon for any text-based document or file
  documentApproved: typeof FileCheck; // Denotes an approved or verified document
  documentRejected: typeof FileX; // Indicates a rejected or invalid document
  folder: typeof Folder; // For file organization, directories, or grouping
  folderOpen: typeof FolderOpen; // Represents an active or currently open folder
}

/**
 * Interface defining the structure and semantic keys for Communication icons.
 */
export interface ICommunicationIcons {
  phone: typeof Phone; // For phone calls, contact information, or telephony
  mail: typeof Mail; // For email communication or messaging
  message: typeof MessageCircle; // Represents chat, instant messaging, or conversations
  send: typeof Send; // For sending messages, emails, or submitting forms
  bell: typeof Bell; // For notifications, alerts, or reminders
}

/**
 * Interface defining the structure and semantic keys for General Interface Elements and actions.
 */
export interface IInterfaceIcons {
  search: typeof Search; // For search functionality or looking up information
  filter: typeof Filter; // For filtering, sorting, or refining results
  settings: typeof Settings; // For application settings, configurations, or preferences
  menuHorizontal: typeof MoreHorizontal; // Horizontal ellipsis for more options (kebab menu)
  menuVertical: typeof MoreVertical; // Vertical ellipsis for more options (meatball menu)
  edit: typeof Edit; // For editing, modifying, or updating content
  delete: typeof Trash2; // For deleting, removing, or trashing items
  add: typeof Plus; // For adding, creating, or including new items
  remove: typeof Minus; // For removing, subtracting, or reducing quantities
  close: typeof X; // For closing, canceling, or dismissing elements
  confirm: typeof Check; // For confirming, accepting, or marking as complete
}

/**
 * Interface defining the structure and semantic keys for Status and Feedback indicators.
 */
export interface IStatusIcons {
  warning: typeof AlertTriangle; // Indicates a warning, caution, or non-critical issue
  alert: typeof AlertCircle; // For critical alerts, errors, or attention needed
  success: typeof CheckCircle; // Denotes a successful operation or completion
  info: typeof Info; // For general information, tips, or details
  visible: typeof Eye; // Represents a visible state or showing content
  hidden: typeof EyeOff; // Represents a hidden state or obscuring content
}

/**
 * Interface defining the structure and semantic keys for Media and Content icons.
 */
export interface IMediaIcons {
  image: typeof Image; // For image content, photos, or graphics
  video: typeof Video; // For video content, playback, or multimedia
  download: typeof Download; // For initiating a download action
  upload: typeof Upload; // For initiating an upload action
  share: typeof Share; // For sharing content via various platforms
}

/**
 * Interface defining the structure and semantic keys for Financial icons.
 */
export interface IFinancialIcons {
  creditCard: typeof CreditCard; // For payment methods, credit/debit cards, or transactions
  dollarSign: typeof DollarSign; // Represents pricing, currency, or monetary values
  trendingUp: typeof TrendingUp; // Indicates positive trends, growth, or increase
  trendingDown: typeof TrendingDown; // Indicates negative trends, decline, or decrease
}

/**
 * Interface defining the structure and semantic keys for System-level icons.
 */
export interface ISystemIcons {
  loader: typeof Loader2; // For loading states, progress indicators, or ongoing activity
  refresh: typeof RefreshCw; // For refreshing data, reloading, or retrying
  power: typeof Power; // For power controls, on/off switches, or system status
  wifi: typeof Wifi; // Indicates an online status or active Wi-Fi connection
  wifiOff: typeof WifiOff; // Indicates an offline status or no Wi-Fi connection
}

/**
 * Top-level interface defining the entire semantic icon map's structure.
 * This acts as the configuration interface for the unified icon system.
 */
export interface ISemanticIconMapConfig {
  user: IUserIcons;
  navigation: INavigationIcons;
  travel: ITravelIcons;
  business: IBusinessIcons;
  communication: ICommunicationIcons;
  interface: IInterfaceIcons;
  status: IStatusIcons;
  media: IMediaIcons;
  financial: IFinancialIcons;
  system: ISystemIcons;
}

// ============================================
// Semantic Icon Mappings Implementation
// ============================================

/**
 * `SemanticallyCategorizedIcons` provides a structured and type-safe mapping
 * of semantic names to Lucide-React icon components.
 * Icons are grouped by functional domain to prevent naming conflicts and enhance clarity.
 */
export const SemanticallyCategorizedIcons: ISemanticIconMapConfig = {
  user: {
    user: User,
    users: Users,
    verified: UserCheck,
    settings: UserCog,
    blocked: UserX,
  },
  navigation: {
    chevronDown: ChevronDown,
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight,
    chevronUp: ChevronUp,
    arrowLeft: ArrowLeft,
    arrowRight: ArrowRight,
    arrowDown: ArrowDown,
    arrowUp: ArrowUp,
    map: Map,
    compass: Compass,
    direction: Navigation,
  },
  travel: {
    plane: Plane, // Consolidates "travel" and "flight" to a single semantic icon
    mapPin: MapPin, // Consolidates "location" and "destination"
    calendar: Calendar, // Consolidates "date" and "schedule"
    clock: Clock, // Renamed from "time" for clarity
    camera: Camera, // Renamed from "photo" for clarity
  },
  business: {
    building: Building, // Renamed from "company"
    briefcase: Briefcase, // Renamed from "business"
    document: FileText,
    documentApproved: FileCheck,
    documentRejected: FileX,
    folder: Folder,
    folderOpen: FolderOpen,
  },
  communication: {
    phone: Phone,
    mail: Mail,
    message: MessageCircle, // Renamed from "chat"
    send: Send,
    bell: Bell, // Renamed from "notification"
  },
  interface: {
    search: Search,
    filter: Filter,
    settings: Settings,
    menuHorizontal: MoreHorizontal,
    menuVertical: MoreVertical,
    edit: Edit,
    delete: Trash2,
    add: Plus,
    remove: Minus,
    close: X,
    confirm: Check,
  },
  status: {
    warning: AlertTriangle,
    alert: AlertCircle,
    success: CheckCircle,
    info: Info,
    visible: Eye,
    hidden: EyeOff,
  },
  media: {
    image: Image,
    video: Video,
    download: Download,
    upload: Upload,
    share: Share,
  },
  financial: {
    creditCard: CreditCard, // Renamed from "payment"
    dollarSign: DollarSign, // Renamed from "price"
    trendingUp: TrendingUp, // Renamed from "growth"
    trendingDown: TrendingDown, // Renamed from "decline"
  },
  system: {
    loader: Loader2, // Renamed from "loading"
    refresh: RefreshCw,
    power: Power,
    wifi: Wifi, // Renamed from "online"
    wifiOff: WifiOff, // Renamed from "offline"
  },
} as const; // Ensures deep immutability and literal type inference for keys

// ============================================
// Type Exports & Icon Access Utility
// ============================================

/**
 * Defines a union type of all available icon categories (e.g., "user", "travel").
 */
export type IconCategoryKey = keyof typeof SemanticallyCategorizedIcons;

/**
 * `IconName` represents a fully qualified, semantic path to an icon,
 * e.g., "user.user", "travel.plane". This type enhances type safety by
 * enforcing correct category and icon name combinations.
 */
export type IconName = {
  [K in IconCategoryKey]: `${K}.${keyof (typeof SemanticallyCategorizedIcons)[K]}`;
}[IconCategoryKey];

/**
 * Retrieves an icon component using its semantic path.
 * This function provides a type-safe way to access categorized icons.
 *
 * @param iconPath - A fully qualified semantic path string (e.g., "user.user", "travel.plane").
 * @returns The corresponding LucideIcon React component or `null` if the path is invalid.
 */
export function getIcon(iconPath: IconName): LucideIcon | null {
  // Split the path into category and icon name.
  // Type assertion is safe here due to the `IconName` type guarantee.
  const [category, name] = iconPath.split('.') as [IconCategoryKey, string];

  if (category && name && SemanticallyCategorizedIcons[category]) {
    // Access the specific icon within its category.
    // The `as Record<string, LucideIcon>` cast helps TypeScript with dynamic property access.
    return (SemanticallyCategorizedIcons[category] as Record<string, LucideIcon>)[name] || null;
  }
  return null;
}

// ============================================
// Legacy Exports (for backward compatibility)
// ============================================

// Re-export all individual Lucide icons directly.
// This is provided for backward compatibility with older code that might
// import icons directly from this file or use a flat `Icon` object.
// New code should prefer `getIcon(iconPath)` for semantic clarity and type safety.
import * as Icons from "lucide-react";
export const Icon = Icons;
export default Icon; // Allows `import Icon from '...'` syntax for legacy usage.