/**
 * TrvicERP Design System - Tailwind Configuration
 *
 * Primary Color: Navigator Blue (#1E3A8A)
 * Design Philosophy: Enterprise-grade, Taiwan market optimized
 *
 * @see DESIGN_SYSTEM.md for full specification
 * @see src/lib/design-tokens.ts for TypeScript tokens
 */

import { designTokens } from './src/lib/design-tokens.ts';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {
      // Colors from design tokens
      colors: {
        // Primary - Navigator Blue (Enterprise trust, stability)
        primary: designTokens.colors.primary,
        // Neutral Colors
        neutral: designTokens.colors.neutral,
        // Semantic Colors
        success: {
          light: designTokens.colors.success.light,
          DEFAULT: designTokens.colors.success.main,
          dark: designTokens.colors.success.dark,
        },
        warning: {
          light: designTokens.colors.warning.light,
          DEFAULT: designTokens.colors.warning.main,
          dark: designTokens.colors.warning.dark,
        },
        error: {
          light: designTokens.colors.error.light,
          DEFAULT: designTokens.colors.error.main,
          dark: designTokens.colors.error.dark,
        },
        info: {
          light: designTokens.colors.info.light,
          DEFAULT: designTokens.colors.info.main,
          dark: designTokens.colors.info.dark,
        },
        // Status Colors (Tour/Order workflows)
        status: designTokens.colors.status,
        // Payment Status
        payment: designTokens.colors.payment,
      },
      // Font families from design tokens
      fontFamily: {
        sans: designTokens.typography.fontFamily.body.split(', '),
        ui: designTokens.typography.fontFamily.ui.split(', '),
        chinese: designTokens.typography.fontFamily.chinese.split(', '),
        mono: designTokens.typography.fontFamily.mono.split(', '),
      },
      // Font sizes from design tokens
      fontSize: {
        'xs': [designTokens.typography.fontSize.xs, { lineHeight: String(designTokens.typography.lineHeight.tight) }],
        'sm': [designTokens.typography.fontSize.sm, { lineHeight: String(designTokens.typography.lineHeight.normal) }],
        'base': [designTokens.typography.fontSize.base, { lineHeight: String(designTokens.typography.lineHeight.relaxed) }],
        'lg': [designTokens.typography.fontSize.lg, { lineHeight: String(designTokens.typography.lineHeight.normal) }],
        'xl': [designTokens.typography.fontSize.xl, { lineHeight: String(designTokens.typography.lineHeight.tight) }],
        '2xl': [designTokens.typography.fontSize['2xl'], { lineHeight: String(designTokens.typography.lineHeight.tight) }],
      },
      // Font weights from design tokens
      fontWeight: {
        normal: String(designTokens.typography.fontWeight.normal),
        medium: String(designTokens.typography.fontWeight.medium),
        semibold: String(designTokens.typography.fontWeight.semibold),
        bold: String(designTokens.typography.fontWeight.bold),
      },
      // Spacing from design tokens
      spacing: designTokens.spacing,
      // Shadows from design tokens
      boxShadow: {
        'sm': designTokens.shadow.sm,
        'md': designTokens.shadow.md,
        'lg': designTokens.shadow.lg,
        'xl': designTokens.shadow.xl,
        'inner': designTokens.shadow.inner,
        'focus': designTokens.shadow.focus,
      },
      // Border radius from design tokens
      borderRadius: designTokens.borderRadius,
      // Component-specific sizes from design tokens
      height: {
        'btn-sm': designTokens.components.button.sm,
        'btn-md': designTokens.components.button.md,
        'btn-lg': designTokens.components.button.lg,
        'input': designTokens.components.input.md,
        'row': designTokens.components.tableRow,
        'fab': designTokens.components.fab,
      },
      minHeight: {
        'btn': designTokens.components.button.md,
        'input': designTokens.components.input.md,
        'touch': designTokens.components.button.md, // WCAG minimum touch target
      },
      maxWidth: {
        'container': '1280px',
        'content': '1024px',
        'form': '640px',
      },
      // Z-index from design tokens
      zIndex: designTokens.zIndex,
      // Transitions
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      // Animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
