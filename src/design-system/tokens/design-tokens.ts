/**
 * TrvicERP Design System - Design Tokens
 * 
 * 溫暖旅遊感的設計語彙系統
 * Warm, travel-inspired design language for group travel ERP
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colors = {
  // Brand Primary - 珊瑚紅 (熱情、溫暖)
  brand: {
    coral: {
      50: '#FFF5F5',
      100: '#FFE3E3',
      200: '#FFC9C9',
      300: '#FFA8A8',
      400: '#FF8787',
      500: '#FF6B6B', // Primary
      600: '#FA5252',
      700: '#F03E3E',
      800: '#E03131',
      900: '#C92A2A',
    },
    // Brand Secondary - 青綠色 (清新、信任)
    teal: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C5',
      400: '#38B2AC',
      500: '#4ECDC4', // Primary
      600: '#319795',
      700: '#2C7A7B',
      800: '#285E61',
      900: '#234E52',
    },
    // Brand Accent - 陽光黃 (活力、期待)
    sunshine: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#FFE66D', // Primary
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      light: '#D1FAE5',
      DEFAULT: '#10B981',
      dark: '#065F46',
    },
    warning: {
      light: '#FEF3C7',
      DEFAULT: '#F59E0B',
      dark: '#92400E',
    },
    danger: {
      light: '#FEE2E2',
      DEFAULT: '#EF4444',
      dark: '#991B1B',
    },
    info: {
      light: '#DBEAFE',
      DEFAULT: '#3B82F6',
      dark: '#1E40AF',
    },
  },

  // Neutral Colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    inverse: '#1F2937',
  },

  // Text Colors
  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
    tertiary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#4ECDC4',
  },
} as const;

// ============================================================================
// STATUS BADGE TOKENS
// ============================================================================

export const statusBadge = {
  status: {
    planning: {
      background: '#F3F4F6',
      text: '#4B5563',
      icon: '#6B7280',
      backgroundHover: '#E5E7EB',
      label: '規劃中',
      labelEn: 'Planning',
    },
    open: {
      background: '#FEF3C7',
      text: '#92400E',
      icon: '#D97706',
      backgroundHover: '#FDE68A',
      label: '報名中',
      labelEn: 'Open',
    },
    upcoming: {
      background: '#CFFAFE',
      text: '#0E7490',
      icon: '#06B6D4',
      backgroundHover: '#A5F3FC',
      label: '即將出發',
      labelEn: 'Upcoming',
    },
    inProgress: {
      background: '#FEE2E2',
      text: '#991B1B',
      icon: '#EF4444',
      backgroundHover: '#FECACA',
      label: '進行中',
      labelEn: 'In Progress',
    },
    completed: {
      background: '#D1FAE5',
      text: '#065F46',
      icon: '#10B981',
      backgroundHover: '#A7F3D0',
      label: '已完成',
      labelEn: 'Completed',
    },
    cancelled: {
      background: '#F3F4F6',
      text: '#6B7280',
      icon: '#9CA3AF',
      backgroundHover: '#E5E7EB',
      label: '已取消',
      labelEn: 'Cancelled',
    },
  },
  // On Dark Background variants
  statusOnDark: {
    planning: {
      background: 'rgba(255, 255, 255, 0.15)',
      text: '#FFFFFF',
      icon: '#FFFFFF',
    },
    open: {
      background: 'rgba(251, 191, 36, 0.25)',
      text: '#FCD34D',
      icon: '#FCD34D',
    },
    upcoming: {
      background: 'rgba(34, 211, 238, 0.25)',
      text: '#22D3EE',
      icon: '#22D3EE',
    },
    inProgress: {
      background: 'rgba(248, 113, 113, 0.25)',
      text: '#F87171',
      icon: '#F87171',
    },
    completed: {
      background: 'rgba(52, 211, 153, 0.25)',
      text: '#34D399',
      icon: '#34D399',
    },
    cancelled: {
      background: 'rgba(255, 255, 255, 0.15)',
      text: 'rgba(255, 255, 255, 0.7)',
      icon: 'rgba(255, 255, 255, 0.7)',
    },
  },
  size: {
    small: {
      height: '20px',
      paddingX: '8px',
      paddingY: '4px',
      iconSize: '12px',
      fontSize: '11px',
      gap: '4px',
      borderRadius: '4px',
    },
    medium: {
      height: '26px',
      paddingX: '10px',
      paddingY: '6px',
      iconSize: '14px',
      fontSize: '12px',
      gap: '6px',
      borderRadius: '6px',
    },
    large: {
      height: '32px',
      paddingX: '12px',
      paddingY: '8px',
      iconSize: '16px',
      fontSize: '14px',
      gap: '8px',
      borderRadius: '8px',
    },
  },
} as const;

// ============================================================================
// AVATAR STACK TOKENS
// ============================================================================

export const avatarStack = {
  size: {
    xsmall: {
      avatar: '24px',
      overflowBadge: '20px',
      border: '1.5px',
      fontSize: '10px',
      initialsFont: '10px',
      statusDot: '6px',
      overlap: {
        tight: '-10px',
        normal: '-8px',
        loose: '-5px',
      },
    },
    small: {
      avatar: '32px',
      overflowBadge: '24px',
      border: '2px',
      fontSize: '11px',
      initialsFont: '12px',
      statusDot: '8px',
      overlap: {
        tight: '-13px',
        normal: '-10px',
        loose: '-6px',
      },
    },
    medium: {
      avatar: '40px',
      overflowBadge: '28px',
      border: '2px',
      fontSize: '12px',
      initialsFont: '14px',
      statusDot: '10px',
      overlap: {
        tight: '-16px',
        normal: '-12px',
        loose: '-8px',
      },
    },
    large: {
      avatar: '48px',
      overflowBadge: '32px',
      border: '2.5px',
      fontSize: '13px',
      initialsFont: '16px',
      statusDot: '12px',
      overlap: {
        tight: '-19px',
        normal: '-14px',
        loose: '-10px',
      },
    },
  },
  fallbackColors: [
    { background: '#FF6B6B', text: '#FFFFFF' }, // Coral
    { background: '#4ECDC4', text: '#FFFFFF' }, // Teal
    { background: '#FFE66D', text: '#5D4E37' }, // Sunshine
    { background: '#95E1D3', text: '#2D5A4A' }, // Mint
    { background: '#F38181', text: '#FFFFFF' }, // Rose
    { background: '#AA96DA', text: '#FFFFFF' }, // Lavender
    { background: '#FCBAD3', text: '#6B3A4D' }, // Pink
    { background: '#A8D8EA', text: '#2C5364' }, // Sky
  ],
  overflow: {
    light: {
      background: '#F3F4F6',
      text: '#4B5563',
      border: '#FFFFFF',
    },
    dark: {
      background: 'rgba(255, 255, 255, 0.2)',
      text: '#FFFFFF',
      border: 'rgba(255, 255, 255, 0.3)',
    },
  },
  status: {
    online: '#10B981',
    away: '#F59E0B',
    busy: '#EF4444',
    offline: '#9CA3AF',
  },
} as const;

// ============================================================================
// PROGRESS RING TOKENS
// ============================================================================

export const progressRing = {
  size: {
    xsmall: {
      diameter: '32px',
      strokeWidth: { thin: '2px', regular: '3px', thick: '4.5px' },
      fontSize: '11px',
      secondaryFontSize: null,
    },
    small: {
      diameter: '40px',
      strokeWidth: { thin: '2.5px', regular: '4px', thick: '6px' },
      fontSize: '13px',
      secondaryFontSize: null,
    },
    medium: {
      diameter: '56px',
      strokeWidth: { thin: '3px', regular: '5px', thick: '7.5px' },
      fontSize: '16px',
      secondaryFontSize: '10px',
    },
    large: {
      diameter: '80px',
      strokeWidth: { thin: '4px', regular: '6px', thick: '9px' },
      fontSize: '22px',
      secondaryFontSize: '12px',
    },
    xlarge: {
      diameter: '120px',
      strokeWidth: { thin: '5px', regular: '8px', thick: '12px' },
      fontSize: '32px',
      secondaryFontSize: '14px',
    },
  },
  colorScheme: {
    default: {
      track: '#E5E7EB',
      progress: '#4ECDC4',
    },
    success: {
      track: '#D1FAE5',
      progress: '#10B981',
    },
    warning: {
      track: '#FEF3C7',
      progress: '#F59E0B',
    },
    danger: {
      track: '#FEE2E2',
      progress: '#EF4444',
    },
    branded: {
      track: '#E0F2F1',
      progress: '#FF6B6B',
    },
  },
  colorSchemeOnDark: {
    default: {
      track: 'rgba(255, 255, 255, 0.15)',
      progress: '#4ECDC4',
    },
    success: {
      track: 'rgba(16, 185, 129, 0.2)',
      progress: '#34D399',
    },
    warning: {
      track: 'rgba(245, 158, 11, 0.2)',
      progress: '#FBBF24',
    },
    danger: {
      track: 'rgba(239, 68, 68, 0.2)',
      progress: '#F87171',
    },
    branded: {
      track: 'rgba(255, 107, 107, 0.2)',
      progress: '#FF6B6B',
    },
  },
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    onDark: '#FFFFFF',
  },
  animation: {
    fillDuration: '1000ms',
    fillEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fillDelay: '200ms',
    valueDuration: '400ms',
    valueDelay: '800ms',
    hoverScale: '1.05',
    hoverDuration: '200ms',
  },
} as const;

// ============================================================================
// TRIP CARD TOKENS
// ============================================================================

export const tripCard = {
  size: {
    large: { width: '360px', height: '420px' },
    medium: { width: '320px', height: '380px' },
    small: { width: '280px', height: '320px' },
    compact: { width: '240px', height: '200px' },
    list: { width: '100%', height: '120px' },
  },
  borderRadius: '16px',
  gradient: {
    overlay: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.7) 100%)',
  },
  shadow: {
    default: '0 4px 20px rgba(0, 0, 0, 0.08)',
    hover: '0 8px 30px rgba(0, 0, 0, 0.15)',
    pressed: '0 2px 8px rgba(0, 0, 0, 0.12)',
  },
  padding: {
    content: '20px',
  },
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

// ============================================================================
// SHADOW TOKENS
// ============================================================================

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  card: '0 4px 20px rgba(0, 0, 0, 0.08)',
  cardHover: '0 8px 30px rgba(0, 0, 0, 0.12)',
  dropdown: '0 10px 40px rgba(0, 0, 0, 0.15)',
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typography = {
  fontFamily: {
    sans: '"Noto Sans TC", "Inter", system-ui, -apple-system, sans-serif',
    display: '"Noto Sans TC", "Inter", system-ui, sans-serif',
  },
  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '32px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.2',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

export const animation = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '1000ms',
  },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// ============================================================================
// Z-INDEX TOKENS
// ============================================================================

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

export const tokens = {
  colors,
  statusBadge,
  avatarStack,
  progressRing,
  tripCard,
  spacing,
  borderRadius,
  shadows,
  typography,
  animation,
  zIndex,
} as const;

export type Tokens = typeof tokens;
export default tokens;
