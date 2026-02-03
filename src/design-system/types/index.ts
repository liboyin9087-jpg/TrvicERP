/**
 * TrvicERP Design System - Type Definitions
 */

// ============================================================================
// STATUS BADGE TYPES
// ============================================================================

export type TripStatus = 
  | 'planning' 
  | 'open' 
  | 'upcoming' 
  | 'inProgress' 
  | 'completed' 
  | 'cancelled';

export type BadgeSize = 'small' | 'medium' | 'large';

export interface StatusBadgeProps {
  /** 狀態類型 */
  status: TripStatus;
  /** 尺寸 */
  size?: BadgeSize;
  /** 是否顯示圖示 */
  showIcon?: boolean;
  /** 是否在深色背景上 */
  onDark?: boolean;
  /** 自訂標籤文字 (覆蓋預設) */
  label?: string;
  /** 額外的 className */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

// ============================================================================
// AVATAR TYPES
// ============================================================================

export type AvatarSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
export type AvatarType = 'image' | 'initials' | 'icon';
export type OnlineStatus = 'online' | 'away' | 'busy' | 'offline';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  department?: string;
}

export interface AvatarProps {
  /** 用戶資料 */
  user: User;
  /** 尺寸 */
  size?: AvatarSize;
  /** 是否顯示在線狀態 */
  showStatus?: boolean;
  /** 在線狀態 */
  status?: OnlineStatus;
  /** 邊框樣式 */
  border?: 'none' | 'white' | 'themed';
  /** 額外的 className */
  className?: string;
  /** 點擊事件 */
  onClick?: () => void;
}

// ============================================================================
// AVATAR STACK TYPES
// ============================================================================

export type StackSize = 'xsmall' | 'small' | 'medium' | 'large';
export type OverlapStyle = 'tight' | 'normal' | 'loose';
export type StackDirection = 'left' | 'right';

export interface AvatarStackProps {
  /** 用戶列表 */
  users: User[];
  /** 尺寸 */
  size?: StackSize;
  /** 最大顯示數量 */
  maxVisible?: number;
  /** 堆疊方向 */
  direction?: StackDirection;
  /** 重疊密度 */
  overlap?: OverlapStyle;
  /** 邊框樣式 */
  borderStyle?: 'none' | 'white' | 'themed';
  /** 是否顯示溢出計數 */
  showOverflow?: boolean;
  /** 是否在深色背景上 */
  onDark?: boolean;
  /** 額外的 className */
  className?: string;
  /** 點擊整個 Stack */
  onClick?: () => void;
  /** 點擊溢出計數器 */
  onOverflowClick?: () => void;
  /** 點擊單一用戶 */
  onUserClick?: (user: User) => void;
  /** 當前用戶 ID (標示「我」) */
  currentUserId?: string;
}

// ============================================================================
// PROGRESS RING TYPES
// ============================================================================

export type RingSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
export type RingThickness = 'thin' | 'regular' | 'thick';
export type RingColorScheme = 'default' | 'success' | 'warning' | 'danger' | 'branded';
export type RingDisplayMode = 'percentage' | 'fraction' | 'icon' | 'custom';
export type RingAnimation = 'none' | 'onMount' | 'onChange';
export type LabelPosition = 'bottom' | 'right' | 'top' | 'none';

export interface ProgressRingProps {
  /** 進度值 (0-100) */
  value: number;
  /** 最大值 (用於分數模式) */
  max?: number;
  /** 尺寸 */
  size?: RingSize;
  /** 線條粗細 */
  thickness?: RingThickness;
  /** 色彩主題 */
  colorScheme?: RingColorScheme;
  /** 顯示模式 */
  displayMode?: RingDisplayMode;
  /** 自訂顯示內容 (displayMode='custom' 時使用) */
  customValue?: string;
  /** 次要標籤 */
  secondaryLabel?: string;
  /** 外部標籤 */
  externalLabel?: string;
  /** 外部標籤位置 */
  labelPosition?: LabelPosition;
  /** 是否顯示軌道 */
  showTrack?: boolean;
  /** 動畫類型 */
  animation?: RingAnimation;
  /** 是否在深色背景上 */
  onDark?: boolean;
  /** 額外的 className */
  className?: string;
  /** 是否可互動 */
  interactive?: boolean;
  /** 點擊事件 */
  onClick?: () => void;
  /** Tooltip 內容 */
  tooltip?: string;
}

// ============================================================================
// TRIP CARD TYPES
// ============================================================================

export type CardSize = 'large' | 'medium' | 'small' | 'compact' | 'list';
export type UserRole = 'travelAgency' | 'welfareCommittee' | 'employee';

export interface Trip {
  id: string;
  title: string;
  subtitle?: string;
  destination: string;
  destinationCode?: string; // e.g., 'JP', 'KR', 'TH'
  startDate: string;
  endDate: string;
  status: TripStatus;
  imageUrl?: string;
  participants: User[];
  totalParticipants: number;
  maxParticipants?: number;
  price?: number;
  pricePerPerson?: number;
  progress?: number;
  profitMargin?: number; // 旅行社專用
  budgetUsed?: number; // 福委專用
  budgetTotal?: number; // 福委專用
  voteCount?: number; // 福委/員工
  rating?: number; // 歷史評分
  tags?: string[];
}

export interface TripCardProps {
  /** 旅程資料 */
  trip: Trip;
  /** 卡片尺寸 */
  size?: CardSize;
  /** 用戶角色 (決定顯示哪些欄位) */
  role?: UserRole;
  /** 是否顯示進度環 */
  showProgress?: boolean;
  /** 是否顯示操作按鈕 */
  showActions?: boolean;
  /** 是否已收藏 */
  isBookmarked?: boolean;
  /** 是否被選中 (批次操作) */
  isSelected?: boolean;
  /** 額外的 className */
  className?: string;
  /** 點擊卡片 */
  onClick?: () => void;
  /** 切換收藏 */
  onBookmarkToggle?: () => void;
  /** 切換選取 */
  onSelectToggle?: () => void;
  /** 主要操作按鈕點擊 */
  onPrimaryAction?: () => void;
  /** 次要操作按鈕點擊 */
  onSecondaryAction?: () => void;
}

// ============================================================================
// KPI CARD TYPES
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface KPICardProps {
  /** 標題 */
  title: string;
  /** 主要數值 */
  value: string | number;
  /** 單位 */
  unit?: string;
  /** 趨勢方向 */
  trend?: TrendDirection;
  /** 趨勢百分比 */
  trendValue?: string;
  /** 趨勢描述 */
  trendDescription?: string;
  /** 圖示 */
  icon?: React.ReactNode;
  /** 圖示背景色 */
  iconColor?: string;
  /** 額外資訊 */
  subtitle?: string;
  /** 點擊事件 */
  onClick?: () => void;
  /** 額外的 className */
  className?: string;
}

// ============================================================================
// COMMAND BAR TYPES
// ============================================================================

export interface CommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category?: string;
  action: () => void;
  keywords?: string[];
}

export interface CommandBarProps {
  /** 是否開啟 */
  isOpen: boolean;
  /** 關閉回調 */
  onClose: () => void;
  /** 命令列表 */
  commands: CommandItem[];
  /** Placeholder 文字 */
  placeholder?: string;
  /** 用戶角色 (影響顯示的命令) */
  role?: UserRole;
}

// ============================================================================
// INLINE AI TYPES
// ============================================================================

export type AIInsightType = 'suggestion' | 'warning' | 'info' | 'success';

export interface InlineAIProps {
  /** 類型 */
  type?: AIInsightType;
  /** 標題 */
  title?: string;
  /** 內容 */
  content: string;
  /** 操作按鈕 */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  }>;
  /** 是否可關閉 */
  dismissible?: boolean;
  /** 關閉回調 */
  onDismiss?: () => void;
  /** 額外的 className */
  className?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PropsWithClassName<P = unknown> = P & {
  className?: string;
};

export type PropsWithChildren<P = unknown> = P & {
  children?: React.ReactNode;
};
