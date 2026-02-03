import {
  Compass,
  Backpack,
  Ticket,
  Calendar,
  Wallet,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Sparkles,
  Bell,
  Plane,
  MapPin,
  Users,
  DollarSign,
  Map,
  Hotel,
  Briefcase,
  Globe,
  Camera,
  Heart,
  Star,
  TrendingUp,
} from 'lucide-react';

/**
 * Travel Icons System
 * Centralized icon mapping for consistent travel-themed UI
 */

// Navigation Icons - Main Menu
export const NavigationIcons = {
  dashboard: Compass,        // 儀表板 → 羅盤
  customers: Backpack,       // 客戶 → 背包客
  orders: Ticket,            // 訂單 → 票券
  sessions: Calendar,        // 團期 → 日曆
  payments: Wallet,          // 付款 → 錢包
  passport: Shield,          // 護照 → 盾牌
  destinations: MapPin,      // 目的地 → 地圖標記
  hotels: Hotel,             // 飯店 → 飯店
  corporate: Briefcase,      // 企業 → 公事包
  travelers: Users,          // 旅客 → 用戶群組
  analytics: TrendingUp,     // 分析 → 趨勢圖
} as const;

// Status Icons - Status Indicators
export const StatusIcons = {
  confirmed: CheckCircle,    // 已確認 → 綠色勾選
  pending: Clock,            // 待處理 → 黃色時鐘
  cancelled: XCircle,        // 已取消 → 紅色叉叉
  inProgress: Plane,         // 進行中 → 飛機
  completed: CheckCircle,    // 已完成 → 勾選
} as const;

// Feature Icons - Special Features
export const FeatureIcons = {
  aiCopilot: Sparkles,       // AI 助手 → 紫色星星
  notification: Bell,        // 通知 → 橘色鈴鐺
  favorite: Heart,           // 最愛 → 愛心
  rating: Star,              // 評分 → 星星
  photo: Camera,             // 照片 → 相機
  map: Map,                  // 地圖 → 地圖
  globe: Globe,              // 全球 → 地球
  revenue: DollarSign,       // 營收 → 美元符號
} as const;

// Combined export for convenience
export const TravelIcons = {
  ...NavigationIcons,
  ...StatusIcons,
  ...FeatureIcons,
} as const;

// Type exports for TypeScript support
export type NavigationIconKey = keyof typeof NavigationIcons;
export type StatusIconKey = keyof typeof StatusIcons;
export type FeatureIconKey = keyof typeof FeatureIcons;
export type TravelIconKey = keyof typeof TravelIcons;

/**
 * Get icon component by key
 */
export function getNavigationIcon(key: NavigationIconKey) {
  return NavigationIcons[key];
}

export function getStatusIcon(key: StatusIconKey) {
  return StatusIcons[key];
}

export function getFeatureIcon(key: FeatureIconKey) {
  return FeatureIcons[key];
}

export function getTravelIcon(key: TravelIconKey) {
  return TravelIcons[key];
}

/**
 * Icon color mapping for consistent theming
 */
export const IconColors = {
  // Navigation colors
  dashboard: 'text-blue-600',
  customers: 'text-purple-600',
  orders: 'text-orange-600',
  sessions: 'text-green-600',
  payments: 'text-yellow-600',
  passport: 'text-red-600',
  
  // Status colors
  confirmed: 'text-green-500',
  pending: 'text-yellow-500',
  cancelled: 'text-red-500',
  inProgress: 'text-blue-500',
  completed: 'text-green-500',
  
  // Feature colors
  aiCopilot: 'text-purple-500',
  notification: 'text-orange-500',
} as const;

export default TravelIcons;
