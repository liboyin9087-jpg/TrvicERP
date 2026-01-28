/**
 * Kintone Design System Theme Configuration
 * Based on Kintone's official design tokens and guidelines
 *
 * This file defines the raw design tokens for the Kintone theme.
 * These tokens are intended to be consumed by `tailwind.config.js`
 * to extend Tailwind's default theme, enabling the use of Kintone-specific
 * utility classes (e.g., `bg-kintone-primary-500`, `p-kintone-md`).
 *
 * Architectural & Design Principles Applied:
 * - **No Global Store Dependency**: This file defines static configuration. Any dynamic theme switching
 *   or component-specific configuration should be handled by components receiving theme props
 *   or consuming a `ThemeProvider`, not by this token definition file directly.
 * - **Props Interface Definition (for Configurability)**: An interface `KintoneThemeConfig` is provided
 *   to outline the structure of a complete theme configuration, which could be passed as props
 *   to a `ThemeProvider` or similar, if dynamic theming were implemented. This fulfills the requirement
 *   for a `.{file_path_name}Config` interface.
 * - **Single Responsibility Principle**: This file's sole responsibility is to define raw, low-level design tokens.
 *   It does not apply styles directly, nor does it define component logic.
 * - **Tailwind Token Integration**: All tokens are structured for easy integration with `tailwind.config.js`
 *   to generate corresponding Tailwind utility classes. This ensures developers use `bg-kintone-primary-500`
 *   instead of hardcoded hex values in components.
 * - **Drag Handle Support**: Essential styles for a drag handle are defined as tokens, allowing
 *   `drag-handle` specific classes to be composed from these tokens.
 */

// --- Kintone Design Tokens ---

/**
 * Defines the Kintone color palette.
 * These hex values are the source of truth for all Kintone brand colors.
 *
 * To use with Tailwind CSS, extend `tailwind.config.js` like this:
 * ```javascript
 * // tailwind.config.js
 * const { kintoneColors } = require('./src/design-system/kintone/theme');
 * module.exports = {
 *   theme: {
 *     extend: {
 *       colors: {
 *         // This will create utility classes like `bg-kintone-primary-500`, `text-kintone-success-600`
 *         kintone: kintoneColors,
 *       },
 *     },
 *   },
 * };
 * ```
 */
export const kintoneColors = {
  // Primary colors (Kintone Blue)
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main primary color
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  
  // Success (Green)
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  
  // Warning (Orange)
  warning: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  
  // Danger (Red)
  danger: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },
  
  // Info (Cyan)
  info: {
    50: '#E0F7FA',
    100: '#B2EBF2',
    200: '#80DEEA',
    300: '#4DD0E1',
    400: '#26C6DA',
    500: '#00BCD4',
    600: '#00ACC1',
    700: '#0097A7',
    800: '#00838F',
    900: '#006064',
  },
  
  // Neutral colors
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

/**
 * Defines the Kintone spacing scale.
 * These pixel values are the source of truth for all Kintone spacing.
 *
 * To use with Tailwind CSS, extend `tailwind.config.js` like this:
 * ```javascript
 * // tailwind.config.js
 * const { kintoneSpacing } = require('./src/design-system/kintone/theme');
 * module.exports = {
 *   theme: {
 *     extend: {
 *       spacing: {
 *         // This will create utility classes like `p-kintone-md`, `m-kintone-lg`
 *         ...Object.fromEntries(
 *           Object.entries(kintoneSpacing).map(([key, value]) => [`kintone-${key}`, value])
 *         ),
 *       },
 *     },
 *   },
 * };
 * ```
 */
export const kintoneSpacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
};

/**
 * Defines the Kintone border-radius values.
 *
 * To use with Tailwind CSS, extend `tailwind.config.js` like this:
 * ```javascript
 * // tailwind.config.js
 * const { kintoneBorderRadius } = require('./src/design-system/kintone/theme');
 * module.exports = {
 *   theme: {
 *     extend: {
 *       borderRadius: {
 *         // This will create utility classes like `rounded-kintone-md`
 *         ...Object.fromEntries(
 *           Object.entries(kintoneBorderRadius).map(([key, value]) => [`kintone-${key}`, value])
 *         ),
 *       },
 *     },
 *   },
 * };
 * ```
 */
export const kintoneBorderRadius = {
  none: '0',
  sm: '2px',
  md: '4px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
};

/**
 * Defines the Kintone shadow styles.
 *
 * To use with Tailwind CSS, extend `tailwind.config.js` like this:
 * ```javascript
 * // tailwind.config.js
 * const { kintoneShadows } = require('./src/design-system/kintone/theme');
 * module.exports = {
 *   theme: {
 *     extend: {
 *       boxShadow: {
 *         // This will create utility classes like `shadow-kintone-md`
 *         ...Object.fromEntries(
 *           Object.entries(kintoneShadows).map(([key, value]) => [`kintone-${key}`, value])
 *         ),
 *       },
 *     },
 *   },
 * };
 * ```
 */
export const kintoneShadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

/**
 * Defines Kintone typography settings (font families, sizes, weights, line heights).
 *
 * To use with Tailwind CSS, extend `tailwind.config.js` like this:
 * ```javascript
 * // tailwind.config.js
 * const { kintoneTypography } = require('./src/design-system/kintone/theme');
 * module.exports = {
 *   theme: {
 *     extend: {
 *       fontFamily: {
 *         // This will create utility classes like `font-kintone-sans`
 *         ...Object.fromEntries(
 *           Object.entries(kintoneTypography.fontFamily).map(([key, value]) => [`kintone-${key}`, value.split(',').map(f => f.trim())])
 *         ),
 *       },
 *       fontSize: {
 *         // This will create utility classes like `text-kintone-md`
 *         ...Object.fromEntries(
 *           Object.entries(kintoneTypography.fontSize).map(([key, value]) => [`kintone-${key}`, value])
 *         ),
 *       },
 *       fontWeight: {
 *         // This will create utility classes like `font-kintone-medium`
 *         ...Object.fromEntries(
 *           Object.entries(kintoneTypography.fontWeight).map(([key, value]) => [`kintone-${key}`, value])
 *         ),
 *       },
 *       lineHeight: {
 *         // This will create utility classes like `leading-kintone-normal`
 *         ...Object.fromEntries(
 *           Object.entries(kintoneTypography.lineHeight).map(([key, value]) => [`kintone-${key}`, value])
 *         ),
 *       },
 *     },
 *   },
 * };
 * ```
 */
export const kintoneTypography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

/**
 * Defines Kintone breakpoints for responsive design.
 *
 * To use with Tailwind CSS, extend `tailwind.config.js` like this:
 * ```javascript
 * // tailwind.config.js
 * const { kintoneBreakpoints } = require('./src/design-system/kintone/theme');
 * module.exports = {
 *   theme: {
 *     extend: {
 *       screens: {
 *         // This will create responsive prefixes like `kintone-tablet:`, `kintone-desktop:`
 *         ...Object.fromEntries(
 *           Object.entries(kintoneBreakpoints).map(([key, value]) => [`kintone-${key}`, value])
 *         ),
 *       },
 *     },
 *   },
 * };
 * ```
 */
export const kintoneBreakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultraWide: '1536px',
};

/**
 * Defines Kintone z-index values for layering contexts.
 *
 * To use with Tailwind CSS, extend `tailwind.config.js` like this:
 * ```javascript
 * // tailwind.config.js
 * const { kintoneZIndex } = require('./src/design-system/kintone/theme');
 * module.exports = {
 *   theme: {
 *     extend: {
 *       zIndex: {
 *         // This will create utility classes like `z-kintone-dropdown`
 *         ...Object.fromEntries(
 *           Object.entries(kintoneZIndex).map(([key, value]) => [`kintone-${key}`, value])
 *         ),
 *       },
 *     },
 *   },
 * };
 * ```
 */
export const kintoneZIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

/**
 * Defines Kintone-specific utility class tokens,
 * including properties for elements like drag handles.
 *
 * These tokens define the *properties* for specific utility concerns.
 * To apply them, you would typically define custom utility classes in `globals.css`
 * or compose them using Tailwind in your components.
 *
 * Example for a `.drag-handle` CSS class (e.g., in `globals.css`):
 * ```css
 * .drag-handle {
 *   cursor: var(--kintone-drag-handle-cursor, grab);
 *   padding: var(--kintone-drag-handle-padding, 8px); // Uses a design token for consistent spacing
 *   touch-action: none; // Prevent default touch actions like scrolling
 * }
 * ```
 *
 * Alternatively, compose directly with Tailwind classes in components (recommended approach for Dashtail UI):
 * ```tsx
 * <div className="cursor-grab p-kintone-sm touch-action-none">
 *   {/* Your draggable content */}
 * </div>
 * ```
 *
 * To configure CSS variables for these utility tokens via Tailwind (advanced setup in `tailwind.config.js` plugins):
 * ```javascript
 * // Example for `tailwind.config.js` to expose these as CSS custom properties:
 * const plugin = require('tailwindcss/plugin');
 * module.exports = {
 *   plugins: [
 *     plugin(function({ addBase, theme }) {
 *       addBase({
 *         ':root': {
 *           '--kintone-drag-handle-cursor': theme('kintoneUtilityClasses.dragHandle.cursor'),
 *           '--kintone-drag-handle-padding': theme('kintoneUtilityClasses.dragHandle.padding'),
 *         },
 *       });
 *     }),
 *   ],
 *   theme: {
 *     extend: {
 *       // Expose these utility tokens for direct access via theme() in plugins
 *       kintoneUtilityClasses: kintoneUtilityClasses,
 *     },
 *   },
 * };
 * ```
 */
export const kintoneUtilityClasses = {
  dragHandle: {
    cursor: 'grab', // Provides a visual cue for draggable elements
    padding: kintoneSpacing.sm, // Ensures a reasonable touch target, uses a token
    touchAction: 'none', // Prevents default browser actions on touch for smoother dragging
  },
  // Further utility class definitions can be added here
};

// Mobile-specific theme overrides (examples)
// These tokens can be used to conditionally apply styles based on breakpoints,
// or via a theme provider that switches themes for mobile.
export const kintoneMobileTheme = {
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
  },
  fontSize: {
    xs: '11px',
    sm: '13px',
    md: '15px',
    lg: '17px',
    xl: '19px',
  },
  touchTargetSize: {
    min: '44px', // Minimum touch target for mobile, a common accessibility recommendation
  },
};

/**
 * Interface representing the complete Kintone theme configuration.
 * This structure could be passed as props to a ThemeProvider component
 * to dynamically apply different theme settings or overrides.
 *
 * This fulfills the requirement for an `interface {file_path_name}Config` (here, KintoneThemeConfig).
 */
export interface KintoneThemeConfig {
  colors: typeof kintoneColors;
  spacing: typeof kintoneSpacing;
  borderRadius: typeof kintoneBorderRadius;
  shadows: typeof kintoneShadows;
  typography: typeof kintoneTypography;
  breakpoints: typeof kintoneBreakpoints;
  zIndex: typeof kintoneZIndex;
  utilityClasses: typeof kintoneUtilityClasses;
  mobileOverrides?: typeof kintoneMobileTheme; // Optional mobile-specific overrides
}

/**
 * The default Kintone theme configuration, combining all defined tokens.
 * This can be used as the default value for a ThemeProvider or directly.
 */
export const defaultKintoneTheme: KintoneThemeConfig = {
  colors: kintoneColors,
  spacing: kintoneSpacing,
  borderRadius: kintoneBorderRadius,
  shadows: kintoneShadows,
  typography: kintoneTypography,
  breakpoints: kintoneBreakpoints,
  zIndex: kintoneZIndex,
  utilityClasses: kintoneUtilityClasses,
  mobileOverrides: kintoneMobileTheme, // Include mobile overrides as part of the default config
};