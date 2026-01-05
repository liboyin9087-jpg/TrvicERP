// =====================================================
// TravelCanvas - SVG Icons Component
// 所有圖標統一使用 SVG 路徑，不依賴外部 Icon Library
// =====================================================

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  fill?: string;
}

// 基礎 SVG 容器
const SvgIcon: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 24,
  className = '',
  strokeWidth = 2,
  children,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

// =====================================================
// 導航 & 通用圖標
// =====================================================

export const ChevronLeft: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m15 18-6-6 6-6" />
  </SvgIcon>
);

export const ChevronRight: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m9 18 6-6-6-6" />
  </SvgIcon>
);

export const ChevronDown: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m6 9 6 6 6-6" />
  </SvgIcon>
);

export const ChevronUp: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m18 15-6-6-6 6" />
  </SvgIcon>
);

export const X: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </SvgIcon>
);

export const Menu: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </SvgIcon>
);

export const Search: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </SvgIcon>
);

export const Filter: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </SvgIcon>
);

// =====================================================
// 操作 & 狀態圖標
// =====================================================

export const Check: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M20 6 9 17l-5-5" />
  </SvgIcon>
);

export const Plus: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </SvgIcon>
);

export const Minus: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M5 12h14" />
  </SvgIcon>
);

export const RefreshCw: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </SvgIcon>
);

export const Loader2: React.FC<IconProps & { spinning?: boolean }> = ({ spinning = false, className = '', ...props }) => (
  <SvgIcon {...props} className={`${className} ${spinning ? 'animate-spin' : ''}`}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </SvgIcon>
);

export const Edit: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </SvgIcon>
);

export const Trash2: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </SvgIcon>
);

export const Copy: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </SvgIcon>
);

export const Share: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
  </SvgIcon>
);

export const ExternalLink: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </SvgIcon>
);

// =====================================================
// 警告 & 提示圖標
// =====================================================

export const AlertCircle: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </SvgIcon>
);

export const AlertTriangle: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </SvgIcon>
);

export const CheckCircle2: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </SvgIcon>
);

export const XCircle: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </SvgIcon>
);

export const ShieldCheck: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </SvgIcon>
);

export const ShieldAlert: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </SvgIcon>
);

// =====================================================
// 使用者 & 通訊圖標
// =====================================================

export const User: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </SvgIcon>
);

export const Users: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </SvgIcon>
);

export const Phone: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </SvgIcon>
);

export const Mail: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </SvgIcon>
);

export const MessageSquare: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </SvgIcon>
);

export const LogOut: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </SvgIcon>
);

export const Lock: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </SvgIcon>
);

// =====================================================
// 位置 & 地圖圖標
// =====================================================

export const MapPin: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </SvgIcon>
);

export const Navigation: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </SvgIcon>
);

export const Compass: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </SvgIcon>
);

export const Globe: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </SvgIcon>
);

// =====================================================
// 時間 & 日曆圖標
// =====================================================

export const Clock: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </SvgIcon>
);

export const Calendar: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </SvgIcon>
);

// =====================================================
// 天氣圖標
// =====================================================

export const Sun: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </SvgIcon>
);

export const CloudRain: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M16 14v6" />
    <path d="M8 14v6" />
    <path d="M12 16v6" />
  </SvgIcon>
);

export const Cloud: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </SvgIcon>
);

export const Snowflake: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <line x1="2" x2="22" y1="12" y2="12" />
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="m20 16-4-4 4-4" />
    <path d="m4 8 4 4-4 4" />
    <path d="m16 4-4 4-4-4" />
    <path d="m8 20 4-4 4 4" />
  </SvgIcon>
);

// =====================================================
// 建築 & 住宿圖標
// =====================================================

export const Building: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </SvgIcon>
);

export const Home: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </SvgIcon>
);

export const Bed: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M2 4v16" />
    <path d="M2 8h18a2 2 0 0 1 2 2v10" />
    <path d="M2 17h20" />
    <path d="M6 8v9" />
  </SvgIcon>
);

// =====================================================
// 餐飲 & 活動圖標
// =====================================================

export const Utensils: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </SvgIcon>
);

export const Coffee: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M10 2v2" />
    <path d="M14 2v2" />
    <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
    <path d="M6 2v2" />
  </SvgIcon>
);

export const Camera: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </SvgIcon>
);

export const Bus: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M8 6v6" />
    <path d="M16 6v6" />
    <path d="M2 12h20" />
    <path d="M7 18h.01" />
    <path d="M17 18h.01" />
    <rect width="18" height="16" x="3" y="4" rx="2" />
    <path d="M3 20h18" />
  </SvgIcon>
);

// =====================================================
// 商業 & 數據圖標
// =====================================================

export const LayoutDashboard: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </SvgIcon>
);

export const Database: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5V19A9 3 0 0 0 21 19V5" />
    <path d="M3 12A9 3 0 0 0 21 12" />
  </SvgIcon>
);

export const Package: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </SvgIcon>
);

export const ShoppingCart: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </SvgIcon>
);

export const Coins: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </SvgIcon>
);

export const TrendingUp: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </SvgIcon>
);

export const BarChart3: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </SvgIcon>
);

// =====================================================
// 尺寸 & 規格圖標
// =====================================================

export const Ruler: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
    <path d="m14.5 12.5 2-2" />
    <path d="m11.5 9.5 2-2" />
    <path d="m8.5 6.5 2-2" />
    <path d="m17.5 15.5 2-2" />
  </SvgIcon>
);

export const Maximize2: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" x2="14" y1="3" y2="10" />
    <line x1="3" x2="10" y1="21" y2="14" />
  </SvgIcon>
);

// =====================================================
// 評分 & 特殊圖標
// =====================================================

export const Star: React.FC<IconProps & { filled?: boolean }> = ({ filled = false, ...props }) => (
  <SvgIcon {...props}>
    <polygon 
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      fill={filled ? 'currentColor' : 'none'}
    />
  </SvgIcon>
);

export const Zap: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </SvgIcon>
);

export const Wand2: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
    <path d="m14 7 3 3" />
    <path d="M5 6v4" />
    <path d="M19 14v4" />
    <path d="M10 2v2" />
    <path d="M7 8H3" />
    <path d="M21 16h-4" />
    <path d="M11 3H9" />
  </SvgIcon>
);

export const ArrowRight: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </SvgIcon>
);

export const ArrowLeft: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </SvgIcon>
);

export const Eye: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </SvgIcon>
);

export const EyeOff: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </SvgIcon>
);

// =====================================================
// 新增圖標
// =====================================================

export const FileText: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <line x1="10" x2="8" y1="9" y2="9" />
  </SvgIcon>
);

export const GitBranch: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <line x1="6" x2="6" y1="3" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </SvgIcon>
);

export const DollarSign: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </SvgIcon>
);

export const Send: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </SvgIcon>
);

export const ThumbsUp: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
  </SvgIcon>
);

export const ThumbsDown: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M17 14V2" />
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
  </SvgIcon>
);

// =====================================================
// 角色入口 / 旅遊場景額外圖標（v2 儀表板移植所需）
// =====================================================

// 建築物（更偏「企業」語意）
export const Building2: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
    <path d="M10 6h0" />
    <path d="M14 6h0" />
    <path d="M10 10h0" />
    <path d="M14 10h0" />
    <path d="M10 14h0" />
    <path d="M14 14h0" />
    <path d="M10 18h0" />
    <path d="M14 18h0" />
  </SvgIcon>
);

// 公事包
export const Briefcase: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <path d="M2 12h20" />
  </SvgIcon>
);

// 投票 / 勾選
export const Vote: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M7 11l2 2 4-4" />
    <path d="M8 22h8" />
    <path d="M12 18v4" />
  </SvgIcon>
);

// 飛機
export const Plane: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22 11 13 2 9 22 2Z" />
  </SvgIcon>
);

// 飯店（簡化建築）
export const Hotel: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M3 22V3a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v19" />
    <path d="M7 6h2" />
    <path d="M7 10h2" />
    <path d="M7 14h2" />
    <path d="M15 6h2" />
    <path d="M15 10h2" />
    <path d="M15 14h2" />
    <path d="M9 22v-6h6v6" />
  </SvgIcon>
);

// =====================================================
// 圖標元件使用方式
// =====================================================
// 
// 所有圖標元件都可以直接匯入使用，例如：
// import { ChevronLeft, User, Globe } from './components/Icons';
// 
// 每個圖標元件都接受以下 props：
// - size: number (預設: 24)
// - className: string (可選)
// - filled: boolean (部分圖標支援)
// 
// 使用範例：
// <ChevronLeft size={16} />
// <User size={20} className="text-blue-500" />
// =====================================================

// =====================================================
// 新增圖標 (2026-01-04)
// =====================================================

export const Info: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </SvgIcon>
);

export const Inbox: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </SvgIcon>
);

// Loader2 和 RefreshCw 已在上方定義，此處移除重複

export const Download: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </SvgIcon>
);

export const Upload: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </SvgIcon>
);

export const Share2: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
  </SvgIcon>
);

export const Link: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </SvgIcon>
);

export const Clipboard: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </SvgIcon>
);

export const ClipboardCheck: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </SvgIcon>
);

// Filter 已在上方定義，此處移除重複

export const SortAsc: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
    <path d="M11 12h4" />
    <path d="M11 16h7" />
    <path d="M11 20h10" />
  </SvgIcon>
);

export const SortDesc: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="m3 16 4 4 4-4" />
    <path d="M7 20V4" />
    <path d="M11 4h10" />
    <path d="M11 8h7" />
    <path d="M11 12h4" />
  </SvgIcon>
);
