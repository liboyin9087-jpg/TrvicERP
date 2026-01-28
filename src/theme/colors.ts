/**
 * VicERP Design System - Color Tokens
 * 根據規格書建立的語意化色彩系統
 * 採用 Vision Pro 風格的 Glassmorphism 美學
 */

export const colors = {
  // ============================================
  // Primary Color System (主品牌色系)
  // ============================================
  primary: {
    50: "#eef4ff", // 背景色 (Light Mode)
    100: "#d9e6ff",
    200: "#bcd7ff",
    300: "#90c1ff",
    400: "#5da2ff",
    500: "#3b82f6", // 主品牌色 - CTA 按鈕
    600: "#1f6feb", // 主要文字強調
    700: "#1758c7",
    800: "#12439a",
    900: "#0b1f3a", // 深色背景 (Dark Mode Base)
    950: "#050d1a", // 應用程式外框
  },

  // ============================================
  // Semantic Colors (語意化色彩) - 確保狀態認知的直覺性
  // ============================================
  semantic: {
    success: {
      base: "#22c55e", // 用於「已成團」、「獲利達標」
      light: "#dcfce7",
      dark: "#15803d",
    },
    warning: {
      base: "#f59e0b", // 用於「毛利偏低」、「庫存緊張」
      light: "#fef3c7",
      dark: "#d97706",
    },
    error: {
      base: "#ef4444", // 用於「虧損」、「系統錯誤」
      light: "#fecaca",
      dark: "#dc2626",
    },
    info: {
      base: "#3b82f6",
      light: "#dbeafe",
      dark: "#1d4ed8",
    },
  },

  // ============================================
  // Glass Morphism Palette (核心材質)
  // ============================================
  glass: {
    // Light Mode Glass
    bg: "rgba(255, 255, 255, 0.75)",
    bgElevated: "rgba(255, 255, 255, 0.85)",
    border: "rgba(255, 255, 255, 0.18)",
    borderElevated: "rgba(255, 255, 255, 0.30)",
    shadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
    shadowLarge: "0 20px 40px -10px rgba(0, 0, 0, 0.3)",

    // Dark Mode Glass (深度調整以確保對比度)
    bgDark: "rgba(10, 15, 28, 0.85)",
    bgDarkElevated: "rgba(15, 20, 35, 0.90)",
    borderDark: "rgba(255, 255, 255, 0.08)",
    borderDarkElevated: "rgba(255, 255, 255, 0.12)",
    shadowDark: "0 20px 40px rgba(0, 0, 0, 0.3)",
    shadowDarkGlow: "0 8px 30px rgba(59, 130, 246, 0.15)",
  },

  // ============================================
  // Aurora Effects (氛圍光)
  // ============================================
  aurora: {
    blue: "rgba(59, 130, 246, 0.15)",
    purple: "rgba(147, 51, 234, 0.12)",
    indigo: "rgba(99, 102, 241, 0.12)",
    cyan: "rgba(6, 182, 212, 0.10)",
    pink: "rgba(236, 72, 153, 0.08)",
  },

  // ============================================
  // Glow Effects (發光效果)
  // ============================================
  glow: {
    primary: "0 0 24px rgba(59, 130, 246, 0.35)",
    success: "0 0 20px rgba(34, 197, 94, 0.35)",
    warning: "0 0 20px rgba(245, 158, 11, 0.35)",
    error: "0 0 20px rgba(239, 68, 68, 0.35)",
    purple: "0 0 25px rgba(147, 51, 234, 0.35)",
    subtle: "0 0 15px rgba(59, 130, 246, 0.2)",
  },

  // ============================================
  // Noise Texture (質感紋理)
  // ============================================
  noise: {
    opacity: {
      light: "0.015", // 明亮模式下的噪點不透明度
      dark: "0.025", // 深色模式下需要稍微更明顯
    },
    blend: "overlay", // 混合模式
  },

  // ============================================
  // Typography Colors (文字色彩)
  // ============================================
  text: {
    primary: {
      light: "#1f2937", // 深色文字 (Light Mode)
      dark: "#f9fafb", // 淺色文字 (Dark Mode)
    },
    secondary: {
      light: "#6b7280",
      dark: "#9ca3af",
    },
    muted: {
      light: "#9ca3af",
      dark: "#6b7280",
    },
    accent: {
      light: "#3b82f6",
      dark: "#60a5fa",
    },
  },
} as const;

// ============================================
// Type Exports for TypeScript
// ============================================
export type ColorKey = keyof typeof colors;
export type PrimaryColorKey = keyof typeof colors.primary;
export type SemanticColorKey = keyof typeof colors.semantic;
export type GlassColorKey = keyof typeof colors.glass;
export type AuroraColorKey = keyof typeof colors.aurora;

// ============================================
// Utility Functions
// ============================================

/**
 * 取得語意化色彩 CSS Variable 名稱
 */
export function getSemanticColorVar(
  type: SemanticColorKey,
  variant: "base" | "light" | "dark" = "base",
): string {
  return `var(--color-semantic-${type}-${variant})`;
}

/**
 * 取得玻璃效果 CSS Variable 名稱
 */
export function getGlassVar(property: GlassColorKey): string {
  return `var(--glass-${property})`;
}

/**
 * 取得極光效果 CSS Variable 名稱
 */
export function getAuroraVar(color: AuroraColorKey): string {
  return `var(--aurora-${color})`;
}

// ============================================
// CSS Variables Mapping (for CSS file generation)
// ============================================
export const cssVariables = {
  // Primary colors
  "--color-primary-50": colors.primary[50],
  "--color-primary-100": colors.primary[100],
  "--color-primary-200": colors.primary[200],
  "--color-primary-300": colors.primary[300],
  "--color-primary-400": colors.primary[400],
  "--color-primary-500": colors.primary[500],
  "--color-primary-600": colors.primary[600],
  "--color-primary-700": colors.primary[700],
  "--color-primary-800": colors.primary[800],
  "--color-primary-900": colors.primary[900],
  "--color-primary-950": colors.primary[950],

  // Semantic colors
  "--color-semantic-success-base": colors.semantic.success.base,
  "--color-semantic-success-light": colors.semantic.success.light,
  "--color-semantic-success-dark": colors.semantic.success.dark,
  "--color-semantic-warning-base": colors.semantic.warning.base,
  "--color-semantic-warning-light": colors.semantic.warning.light,
  "--color-semantic-warning-dark": colors.semantic.warning.dark,
  "--color-semantic-error-base": colors.semantic.error.base,
  "--color-semantic-error-light": colors.semantic.error.light,
  "--color-semantic-error-dark": colors.semantic.error.dark,
  "--color-semantic-info-base": colors.semantic.info.base,
  "--color-semantic-info-light": colors.semantic.info.light,
  "--color-semantic-info-dark": colors.semantic.info.dark,

  // Glass morphism
  "--glass-bg": colors.glass.bg,
  "--glass-bg-elevated": colors.glass.bgElevated,
  "--glass-bg-dark": colors.glass.bgDark,
  "--glass-bg-dark-elevated": colors.glass.bgDarkElevated,
  "--glass-border": colors.glass.border,
  "--glass-border-elevated": colors.glass.borderElevated,
  "--glass-border-dark": colors.glass.borderDark,
  "--glass-border-dark-elevated": colors.glass.borderDarkElevated,

  // Aurora effects
  "--aurora-blue": colors.aurora.blue,
  "--aurora-purple": colors.aurora.purple,
  "--aurora-indigo": colors.aurora.indigo,
  "--aurora-cyan": colors.aurora.cyan,
  "--aurora-pink": colors.aurora.pink,

  // Text colors
  "--text-primary-light": colors.text.primary.light,
  "--text-primary-dark": colors.text.primary.dark,
  "--text-secondary-light": colors.text.secondary.light,
  "--text-secondary-dark": colors.text.secondary.dark,
  "--text-muted-light": colors.text.muted.light,
  "--text-muted-dark": colors.text.muted.dark,
  "--text-accent-light": colors.text.accent.light,
  "--text-accent-dark": colors.text.accent.dark,
} as const;
