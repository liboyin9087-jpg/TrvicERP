/**
 * TrvicERP Design System - Design Tokens
 *
 * Based on enterprise design specification for Taiwan market
 * Primary: Navigator Blue (#1E3A8A) - Corporate trust, stability, professionalism
 *
 * @see DESIGN_SYSTEM.md for full specification
 */

export const designTokens = {
  // ============================================
  // Color System
  // ============================================
  colors: {
    // Primary - Navigator Blue
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A', // Navigator Blue - Main brand color
      950: '#172554',
    },

    // Semantic Colors
    success: {
      light: '#D1FAE5',
      main: '#10B981',
      dark: '#065F46',
    },
    warning: {
      light: '#FEF3C7',
      main: '#F59E0B',
      dark: '#92400E',
    },
    error: {
      light: '#FEE2E2',
      main: '#EF4444',
      dark: '#991B1B',
    },
    info: {
      light: '#DBEAFE',
      main: '#3B82F6',
      dark: '#1E40AF',
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

    // Status Colors for Tour/Order workflows
    status: {
      draft: '#9CA3AF',      // Gray - Draft/Planning
      quoted: '#3B82F6',     // Blue - Quoted, awaiting response
      confirmed: '#10B981',  // Green - Confirmed, awaiting departure
      inProgress: '#8B5CF6', // Purple - In progress
      completed: '#4B5563',  // Dark gray - Completed
      cancelled: '#EF4444',  // Red - Cancelled
    },

    // Payment Status Colors
    payment: {
      pending: '#F59E0B',    // Orange - Pending payment
      partial: '#3B82F6',    // Blue - Partial payment
      paid: '#10B981',       // Green - Fully paid
      overdue: '#EF4444',    // Red - Overdue
    },

    // Background
    background: {
      default: '#F3F4F6',
      paper: '#FFFFFF',
      elevated: '#FFFFFF',
    },

    // Text
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
      disabled: '#9CA3AF',
      inverse: '#FFFFFF',
    },

    // Border
    border: {
      default: '#D1D5DB',
      light: '#E5E7EB',
      focus: '#1E3A8A',
    },
  },

  // ============================================
  // Typography
  // ============================================
  typography: {
    fontFamily: {
      // UI elements (buttons, labels, navigation)
      ui: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      // Traditional Chinese content
      chinese: "'Noto Sans TC', Inter, -apple-system, 'Microsoft JhengHei', sans-serif",
      // Body text (mixed content)
      body: "'Noto Sans TC', Inter, -apple-system, 'Segoe UI', sans-serif",
      // Numeric/tabular data
      mono: "Inter, 'Noto Sans TC', ui-monospace, monospace",
    },

    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '24px',
      '2xl': '32px',
    },

    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeight: {
      tight: 1.4,
      normal: 1.5,
      relaxed: 1.6,
    },

    // Typography scale per spec
    scale: {
      '2xl': { size: '32px', weight: 700, lineHeight: 1.4 },  // Page titles
      xl: { size: '24px', weight: 700, lineHeight: 1.4 },     // Card titles
      lg: { size: '18px', weight: 600, lineHeight: 1.5 },     // Section titles
      md: { size: '14px', weight: 600, lineHeight: 1.5 },     // List item titles
      base: { size: '16px', weight: 400, lineHeight: 1.6 },   // Body text
      sm: { size: '14px', weight: 400, lineHeight: 1.5 },     // Secondary text
      xs: { size: '12px', weight: 400, lineHeight: 1.4 },     // Captions, hints
    },
  },

  // ============================================
  // Spacing (8px base unit)
  // ============================================
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  // ============================================
  // Border Radius
  // ============================================
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // ============================================
  // Shadows
  // ============================================
  shadow: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 12px rgba(0, 0, 0, 0.12)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.2)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    // Focus ring shadow
    focus: '0 0 0 3px rgba(30, 58, 138, 0.1)',
  },

  // ============================================
  // Transitions
  // ============================================
  transition: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // ============================================
  // Z-Index Scale
  // ============================================
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    modalBackdrop: 1035,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },

  // ============================================
  // Component Sizes
  // ============================================
  components: {
    // Button heights (WCAG 44px minimum touch target)
    button: {
      sm: '36px',
      md: '44px',
      lg: '48px',
    },
    // Input heights
    input: {
      sm: '36px',
      md: '44px',
      lg: '48px',
    },
    // Table row height
    tableRow: '48px',
    // FAB size
    fab: '56px',
    // Icon sizes
    icon: {
      xs: '14px',
      sm: '16px',
      md: '20px',
      lg: '24px',
      xl: '32px',
    },
  },

  // ============================================
  // Breakpoints
  // ============================================
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
} as const;

// Type exports for TypeScript support
export type DesignTokens = typeof designTokens;
export type ColorToken = keyof typeof designTokens.colors;
export type SpacingToken = keyof typeof designTokens.spacing;
export type ShadowToken = keyof typeof designTokens.shadow;

// Helper functions
export const getColor = (path: string): string => {
  const parts = path.split('.');
  let result: any = designTokens.colors;
  for (const part of parts) {
    result = result[part];
  }
  return result as string;
};

export const getSpacing = (key: keyof typeof designTokens.spacing): string => {
  return designTokens.spacing[key];
};

// CSS variable mapping for runtime theming
export const cssVariables = {
  '--color-primary-50': designTokens.colors.primary[50],
  '--color-primary-100': designTokens.colors.primary[100],
  '--color-primary-500': designTokens.colors.primary[500],
  '--color-primary-600': designTokens.colors.primary[600],
  '--color-primary-700': designTokens.colors.primary[700],
  '--color-primary-800': designTokens.colors.primary[800],
  '--color-primary-900': designTokens.colors.primary[900],
  '--color-primary-950': designTokens.colors.primary[950],
  '--color-success': designTokens.colors.success.main,
  '--color-warning': designTokens.colors.warning.main,
  '--color-error': designTokens.colors.error.main,
  '--color-info': designTokens.colors.info.main,
  '--color-neutral-50': designTokens.colors.neutral[50],
  '--color-neutral-100': designTokens.colors.neutral[100],
  '--color-neutral-200': designTokens.colors.neutral[200],
  '--color-neutral-300': designTokens.colors.neutral[300],
  '--color-neutral-400': designTokens.colors.neutral[400],
  '--color-neutral-500': designTokens.colors.neutral[500],
  '--color-neutral-600': designTokens.colors.neutral[600],
  '--color-neutral-700': designTokens.colors.neutral[700],
  '--color-neutral-800': designTokens.colors.neutral[800],
  '--color-neutral-900': designTokens.colors.neutral[900],
} as const;

export default designTokens;
