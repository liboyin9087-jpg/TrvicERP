/**
 * VicERP Design System - Color Tokens (TypeScript API Layer)
 *
 * Architecture (3-layer design system):
 *   1. index.css :root    — Single source of truth for all CSS custom properties.
 *   2. tailwind.config.js — References CSS variables via var(--...) so Tailwind
 *                           utilities stay in sync without duplicating hex values.
 *   3. This file (colors.ts) — Provides typed constants and utility functions for
 *                               programmatic access in TypeScript/React code.
 *                               Hex values here MUST match the CSS variables in index.css.
 *
 * When changing a color value, update index.css first, then mirror here.
 */

// ============================================
// TypeScript 型別定義
// ============================================

export type ColorHex = `#${string}`;
export type RgbaValue = `rgba(${number}, ${number}, ${number}, ${number})`;
export type ShadowValue = string; // e.g., "0 8px 32px 0 rgba(31, 38, 135, 0.15)"
export type BlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";

export interface PrimaryColorPalette {
  50: ColorHex; // 背景色 (Light Mode)
  100: ColorHex;
  200: ColorHex;
  300: ColorHex;
  400: ColorHex;
  500: ColorHex; // 主品牌色 - CTA 按鈕
  600: ColorHex; // 主要文字強調
  700: ColorHex;
  800: ColorHex;
  900: ColorHex; // 深色背景 (Dark Mode Base)
  950: ColorHex; // 應用程式外框
}

export interface SemanticColorVariant {
  base: ColorHex;
  light: ColorHex;
  dark: ColorHex;
}

export interface SemanticColorPalette {
  success: SemanticColorVariant;
  warning: SemanticColorVariant;
  error: SemanticColorVariant;
  info: SemanticColorVariant;
}

export interface GlassMorphismPalette {
  // Light Mode Glass
  bg: RgbaValue;
  bgElevated: RgbaValue;
  border: RgbaValue;
  borderElevated: RgbaValue;
  shadow: ShadowValue;
  shadowLarge: ShadowValue;

  // Dark Mode Glass
  bgDark: RgbaValue;
  bgDarkElevated: RgbaValue;
  borderDark: RgbaValue;
  borderDarkElevated: RgbaValue;
  shadowDark: ShadowValue;
  shadowDarkGlow: ShadowValue;
}

export interface AuroraPalette {
  blue: RgbaValue;
  purple: RgbaValue;
  indigo: RgbaValue;
  cyan: RgbaValue;
  pink: RgbaValue;
}

export interface GlowPalette {
  primary: ShadowValue;
  success: ShadowValue;
  warning: ShadowValue;
  error: ShadowValue;
  purple: ShadowValue;
  subtle: ShadowValue;
}

export interface NoiseTextureConfig {
  opacity: {
    light: string; // "0.015" 明亮模式下的噪點不透明度
    dark: string; // "0.025" 深色模式下需要稍微更明顯
  };
  blend: BlendMode; // 混合模式
}

export interface TypographyColorVariant {
  light: ColorHex;
  dark: ColorHex;
}

export interface TypographyColors {
  primary: TypographyColorVariant;
  secondary: TypographyColorVariant;
  muted: TypographyColorVariant;
  accent: TypographyColorVariant;
}

export interface DragHandlePalette {
  bg: ColorHex; // 背景色
  border: ColorHex; // 邊框色
  icon: ColorHex; // 圖示色
  activeBg: ColorHex; // 拖曳時的背景色
  activeBorder: ColorHex; // 拖曳時的邊框色
  activeIcon: ColorHex; // 拖曳時的圖示色
}

// ============================================
// Color Definitions
// ============================================
export const colors: Readonly<{
  primary: PrimaryColorPalette;
  semantic: SemanticColorPalette;
  glass: GlassMorphismPalette;
  aurora: AuroraPalette;
  glow: GlowPalette;
  noise: NoiseTextureConfig;
  text: TypographyColors;
  dragHandle: DragHandlePalette;
}> = {
  // ============================================
  // Primary Color System (主品牌色系) - 對應 Tailwind 預設顏色
  // ============================================
  primary: {
    50: "#eef4ff", // Tailwind: blue-50
    100: "#d9e6ff", // Tailwind: blue-100
    200: "#bcd7ff", // Tailwind: blue-200
    300: "#90c1ff", // Tailwind: blue-300
    400: "#5da2ff", // Tailwind: blue-400
    500: "#3b82f6", // Tailwind: blue-500 - 主品牌色 - CTA 按鈕
    600: "#1f6feb", // Tailwind: blue-600 - 主要文字強調
    700: "#1758c7", // Tailwind: blue-700
    800: "#12439a", // Tailwind: blue-800
    900: "#0b1f3a", // Tailwind: blue-900 - 深色背景 (Dark Mode Base)
    950: "#050d1a", // Tailwind: blue-950 - 應用程式外框
  },

  // ============================================
  // Semantic Colors (語意化色彩) - 確保狀態認知的直覺性
  // ============================================
  semantic: {
    success: {
      base: "#22c55e", // Tailwind: green-500 - 用於「已成團」、「獲利達標」
      light: "#dcfce7", // Tailwind: green-100
      dark: "#15803d", // Tailwind: green-700
    },
    warning: {
      base: "#f59e0b", // Tailwind: amber-500 - 用於「毛利偏低」、「庫存緊張」
      light: "#fef3c7", // Tailwind: amber-100
      dark: "#d97706", // Tailwind: amber-700
    },
    error: {
      base: "#ef4444", // Tailwind: red-500 - 用於「虧損」、「系統錯誤」
      light: "#fecaca", // Tailwind: red-100
      dark: "#dc2626", // Tailwind: red-700
    },
    info: {
      base: "#3b82f6", // Tailwind: blue-500
      light: "#dbeafe", // Tailwind: blue-100
      dark: "#1d4ed8", // Tailwind: blue-700
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
    shadowDarkGlow: "0 8px 30px rgba(59, 130, 246, 0.15)", // Primary color glow
  },

  // ============================================
  // Aurora Effects (氛圍光)
  // ============================================
  aurora: {
    blue: "rgba(59, 130, 246, 0.15)", // Tailwind blue-500 with opacity
    purple: "rgba(147, 51, 234, 0.12)", // Tailwind purple-600 with opacity
    indigo: "rgba(99, 102, 241, 0.12)", // Tailwind indigo-500 with opacity
    cyan: "rgba(6, 182, 212, 0.10)", // Tailwind cyan-500 with opacity
    pink: "rgba(236, 72, 153, 0.08)", // Tailwind pink-500 with opacity
  },

  // ============================================
  // Glow Effects (發光效果)
  // ============================================
  glow: {
    primary: "0 0 24px rgba(59, 130, 246, 0.35)", // Primary color (blue-500) glow
    success: "0 0 20px rgba(34, 197, 94, 0.35)", // Success color (green-500) glow
    warning: "0 0 20px rgba(245, 158, 11, 0.35)", // Warning color (amber-500) glow
    error: "0 0 20px rgba(239, 68, 68, 0.35)", // Error color (red-500) glow
    purple: "0 0 25px rgba(147, 51, 234, 0.35)", // Purple-600 glow
    subtle: "0 0 15px rgba(59, 130, 246, 0.2)", // Subtle primary color glow
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
      light: "#1f2937", // Tailwind: gray-800 - 深色文字 (Light Mode)
      dark: "#f9fafb", // Tailwind: gray-50 - 淺色文字 (Dark Mode)
    },
    secondary: {
      light: "#6b7280", // Tailwind: gray-500
      dark: "#9ca3af", // Tailwind: gray-400
    },
    muted: {
      light: "#9ca3af", // Tailwind: gray-400
      dark: "#6b7280", // Tailwind: gray-500
    },
    accent: {
      light: "#3b82f6", // Tailwind: blue-500
      dark: "#60a5fa", // Tailwind: blue-400
    },
  },

  // ============================================
  // Drag Handle Colors (拖曳手把色彩)
  // ============================================
  dragHandle: {
    bg: "#e5e7eb", // Tailwind: gray-200
    border: "#d1d5db", // Tailwind: gray-300
    icon: "#6b7280", // Tailwind: gray-500
    activeBg: "#dbeafe", // Tailwind: blue-100
    activeBorder: "#93c5fd", // Tailwind: blue-300
    activeIcon: "#2563eb", // Tailwind: blue-600
  },
};

// ============================================
// Type Exports for TypeScript
// ============================================
export type ColorCategoryKey = keyof typeof colors;
export type PrimaryColorLevel = keyof typeof colors.primary;
export type SemanticColorType = keyof typeof colors.semantic;
export type SemanticColorVariantKey = "base" | "light" | "dark";
export type GlassColorProperty = keyof typeof colors.glass;
export type AuroraColorName = keyof typeof colors.aurora;
export type GlowEffectName = keyof typeof colors.glow;
export type NoiseOpacityMode = keyof typeof colors.noise.opacity;
export type TypographyColorType = keyof typeof colors.text;
export type TypographyColorVariantKey = "light" | "dark";
export type DragHandleColorProperty = keyof typeof colors.dragHandle;

// ============================================
// Utility Functions for CSS Variable Access
// ============================================

/**
 * 取得 Primary 色彩的 CSS Variable 名稱
 * @param level - 色彩深度 (50-950)
 */
export function getPrimaryColorVar(level: PrimaryColorLevel): string {
  return `var(--color-primary-${level})`;
}

/**
 * 取得語意化色彩的 CSS Variable 名稱
 * @param type - 語意類型 (success, warning, error, info)
 * @param variant - 變體 (base, light, dark)
 */
export function getSemanticColorVar(
  type: SemanticColorType,
  variant: SemanticColorVariantKey = "base",
): string {
  return `var(--color-semantic-${type}-${variant})`;
}

/**
 * 取得玻璃擬態效果的 CSS Variable 名稱
 * @param property - 玻璃效果屬性 (e.g., bg, border, shadow)
 */
export function getGlassVar(property: GlassColorProperty): string {
  const varNameMap: Record<GlassColorProperty, string> = {
    bg: "--glass-bg",
    bgElevated: "--glass-bg-elevated",
    border: "--glass-border",
    borderElevated: "--glass-border-elevated",
    shadow: "--glass-shadow",
    shadowLarge: "--glass-shadow-large",
    bgDark: "--glass-bg-dark",
    bgDarkElevated: "--glass-bg-dark-elevated",
    borderDark: "--glass-border-dark",
    borderDarkElevated: "--glass-border-dark-elevated",
    shadowDark: "--glass-shadow-dark",
    shadowDarkGlow: "--glass-shadow-dark-glow",
  };
  return `var(${varNameMap[property]})`;
}

/**
 * 取得極光效果的 CSS Variable 名稱
 * @param color - 極光顏色名稱 (blue, purple, etc.)
 */
export function getAuroraVar(color: AuroraColorName): string {
  return `var(--aurora-${color})`;
}

/**
 * 取得發光效果的 CSS Variable 名稱
 * @param effect - 發光效果名稱 (primary, success, etc.)
 */
export function getGlowVar(effect: GlowEffectName): string {
  return `var(--glow-${effect})`;
}

/**
 * 取得噪點不透明度的 CSS Variable 名稱
 * @param mode - 模式 (light, dark)
 */
export function getNoiseOpacityVar(mode: NoiseOpacityMode): string {
  return `var(--noise-opacity-${mode})`;
}

/**
 * 取得噪點混合模式的 CSS Variable 名稱
 */
export function getNoiseBlendVar(): string {
  return `var(--noise-blend)`;
}

/**
 * 取得文字色彩的 CSS Variable 名稱
 * @param type - 文字類型 (primary, secondary, muted, accent)
 * @param variant - 變體 (light, dark)
 */
export function getTextColorVar(
  type: TypographyColorType,
  variant: TypographyColorVariantKey,
): string {
  return `var(--text-${type}-${variant})`;
}

/**
 * 取得拖曳手把色彩的 CSS Variable 名稱
 * @param property - 拖曳手把屬性 (bg, border, icon, activeBg, activeBorder, activeIcon)
 */
export function getDragHandleColorVar(property: DragHandleColorProperty): string {
  const kebabCaseProperty = property.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
  return `var(--color-drag-handle-${kebabCaseProperty})`;
}

// ============================================
// CSS Variables Mapping (for CSS file generation/Tailwind config)
// = 此物件用於將 JS 中的顏色定義映射為 CSS 變數，供 Tailwind CSS 等工具使用。
// ============================================
export const cssVariables: Readonly<Record<string, string>> = {
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
  "--glass-border": colors.glass.border,
  "--glass-border-elevated": colors.glass.borderElevated,
  "--glass-shadow": colors.glass.shadow,
  "--glass-shadow-large": colors.glass.shadowLarge,
  "--glass-bg-dark": colors.glass.bgDark,
  "--glass-bg-dark-elevated": colors.glass.bgDarkElevated,
  "--glass-border-dark": colors.glass.borderDark,
  "--glass-border-dark-elevated": colors.glass.borderDarkElevated,
  "--glass-shadow-dark": colors.glass.shadowDark,
  "--glass-shadow-dark-glow": colors.glass.shadowDarkGlow,

  // Aurora effects
  "--aurora-blue": colors.aurora.blue,
  "--aurora-purple": colors.aurora.purple,
  "--aurora-indigo": colors.aurora.indigo,
  "--aurora-cyan": colors.aurora.cyan,
  "--aurora-pink": colors.aurora.pink,

  // Glow effects
  "--glow-primary": colors.glow.primary,
  "--glow-success": colors.glow.success,
  "--glow-warning": colors.glow.warning,
  "--glow-error": colors.glow.error,
  "--glow-purple": colors.glow.purple,
  "--glow-subtle": colors.glow.subtle,

  // Noise Texture
  "--noise-opacity-light": colors.noise.opacity.light,
  "--noise-opacity-dark": colors.noise.opacity.dark,
  "--noise-blend": colors.noise.blend,

  // Text colors
  "--text-primary-light": colors.text.primary.light,
  "--text-primary-dark": colors.text.primary.dark,
  "--text-secondary-light": colors.text.secondary.light,
  "--text-secondary-dark": colors.text.secondary.dark,
  "--text-muted-light": colors.text.muted.light,
  "--text-muted-dark": colors.text.muted.dark,
  "--text-accent-light": colors.text.accent.light,
  "--text-accent-dark": colors.text.accent.dark,

  // Drag Handle Colors
  "--color-drag-handle-bg": colors.dragHandle.bg,
  "--color-drag-handle-border": colors.dragHandle.border,
  "--color-drag-handle-icon": colors.dragHandle.icon,
  "--color-drag-handle-active-bg": colors.dragHandle.activeBg,
  "--color-drag-handle-active-border": colors.dragHandle.activeBorder,
  "--color-drag-handle-active-icon": colors.dragHandle.activeIcon,
} as const;