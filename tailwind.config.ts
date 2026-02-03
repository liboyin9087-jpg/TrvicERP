/**
 * TrvicERP Design System - Tailwind CSS Configuration
 * 
 * 將 Design Tokens 整合至 Tailwind 配置
 * 使用方式: 在專案的 tailwind.config.js 中 import 此檔案
 * 
 * @example
 * // tailwind.config.js
 * const trvicConfig = require('./design-system/tailwind.config.ts');
 * module.exports = {
 *   presets: [trvicConfig],
 *   // 其他配置...
 * }
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [],
  theme: {
    extend: {
      // ========================================
      // COLORS
      // ========================================
      colors: {
        // Brand Colors
        coral: {
          50: '#FFF5F5',
          100: '#FFE3E3',
          200: '#FFC9C9',
          300: '#FFA8A8',
          400: '#FF8787',
          500: '#FF6B6B',
          600: '#FA5252',
          700: '#F03E3E',
          800: '#E03131',
          900: '#C92A2A',
        },
        teal: {
          50: '#E6FFFA',
          100: '#B2F5EA',
          200: '#81E6D9',
          300: '#4FD1C5',
          400: '#38B2AC',
          500: '#4ECDC4',
          600: '#319795',
          700: '#2C7A7B',
          800: '#285E61',
          900: '#234E52',
        },
        sunshine: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FFE66D',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },

      // ========================================
      // FONT FAMILY
      // ========================================
      fontFamily: {
        sans: ['"Noto Sans TC"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Noto Sans TC"', 'Inter', 'system-ui', 'sans-serif'],
      },

      // ========================================
      // FONT SIZE
      // ========================================
      fontSize: {
        'xxs': ['10px', { lineHeight: '14px' }],
        'xs': ['11px', { lineHeight: '16px' }],
        'sm': ['12px', { lineHeight: '18px' }],
        'base': ['14px', { lineHeight: '20px' }],
        'md': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '26px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['28px', { lineHeight: '36px' }],
        '4xl': ['32px', { lineHeight: '40px' }],
      },

      // ========================================
      // SPACING
      // ========================================
      spacing: {
        '4.5': '18px',
        '5.5': '22px',
        '13': '52px',
        '15': '60px',
        '18': '72px',
        '22': '88px',
        '26': '104px',
        '30': '120px',
      },

      // ========================================
      // BORDER RADIUS
      // ========================================
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },

      // ========================================
      // BOX SHADOW
      // ========================================
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.07)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.15)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'dropdown': '0 10px 40px rgba(0, 0, 0, 0.15)',
        'inner-sm': 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
      },

      // ========================================
      // ANIMATION
      // ========================================
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 0.3s ease-out',
        'progress-fill': 'progressFill 1s cubic-bezier(0.4, 0, 0.2, 1)',
        'count-up': 'countUp 0.4s ease-out 0.8s both',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceSoft: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        progressFill: {
          '0%': { strokeDashoffset: 'var(--circumference)' },
          '100%': { strokeDashoffset: 'var(--target-offset)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      // ========================================
      // TRANSITION
      // ========================================
      transitionDuration: {
        '0': '0ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '1000': '1000ms',
      },

      transitionTimingFunction: {
        'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      // ========================================
      // Z-INDEX
      // ========================================
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },

      // ========================================
      // BACKDROP BLUR
      // ========================================
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
    },
  },
  plugins: [],
};

export default config;
