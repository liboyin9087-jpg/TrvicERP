export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors
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
        
        // Primary color system (main brand)
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)", // Default
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
          950: "var(--color-primary-950)",
          DEFAULT: "var(--color-primary-500)",
        },

        // Secondary color system (neutrals)
        secondary: {
          50: "var(--color-secondary-50)",
          100: "var(--color-secondary-100)",
          200: "var(--color-secondary-200)",
          300: "var(--color-secondary-300)",
          400: "var(--color-secondary-400)",
          500: "var(--color-secondary-500)",
          600: "var(--color-secondary-600)",
          700: "var(--color-secondary-700)",
          800: "var(--color-secondary-800)",
          900: "var(--color-secondary-900)",
          950: "var(--color-secondary-950)",
          DEFAULT: "var(--color-secondary-500)",
        },

        // Travel theme brand colors (sky to ocean)
        // All values reference CSS variables defined in index.css :root
        brand: {
          50: "var(--color-brand-50)",
          100: "var(--color-brand-100)",
          200: "var(--color-brand-200)",
          300: "var(--color-brand-300)",
          400: "var(--color-brand-400)",
          500: "var(--color-brand-500)",
          600: "var(--color-brand-600)",
          700: "var(--color-brand-700)",
          800: "var(--color-brand-800)",
          900: "var(--color-brand-900)",
          DEFAULT: "var(--color-brand-500)",
          sky: "var(--color-brand-sky)",
          ocean: "var(--color-brand-ocean)",
          deep: "var(--color-brand-deep)",
        },

        // Travel auxiliary colors (referenced from CSS variables)
        travel: {
          sunrise: "var(--color-travel-sunrise)",
          sunset: "var(--color-travel-sunset)",
          sand: "var(--color-travel-sand)",
          forest: "var(--color-travel-forest)",
          coral: "var(--color-travel-coral)",
          lavender: "var(--color-travel-lavender)",
        },

        // Simplified neutral colors (referenced from CSS variables)
        neutral: {
          50: "var(--color-neutral-50)",
          200: "var(--color-neutral-200)",
          500: "var(--color-neutral-500)",
          700: "var(--color-neutral-700)",
          900: "var(--color-neutral-900)",
        },

        // Semantic colors
        success: {
          DEFAULT: "var(--color-success)",
          light: "var(--color-success-light)",
          dark: "var(--color-success-dark)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          light: "var(--color-info-light)",
          dark: "var(--color-info-dark)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          light: "var(--color-warning-light)",
          dark: "var(--color-warning-dark)",
        },
        error: {
          DEFAULT: "var(--color-error)",
          light: "var(--color-error-light)",
          dark: "var(--color-error-dark)",
        },

        // System colors (use semantic mapping instead of hard-coded values)
        accent: "var(--color-accent)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        muted: "var(--color-muted)",
        overlay: "var(--color-overlay)",
        backdrop: "var(--color-backdrop)",

        // Keep existing TripERP colors for compatibility
        trip: {
          950: "var(--dark-bg-primary)",
          900: "var(--dark-bg-secondary)",
          800: "var(--dark-bg-tertiary)",
          700: "var(--dark-bg-elevated)",
          brand: "var(--color-brand-600)",
          accent: "var(--aurora-blue)",
          glow: "var(--dark-glow-primary)",
        },

        // Legacy mappings - DEPRECATED: Use primary/secondary instead
        black: "var(--color-black)",
        white: "var(--color-white)",
      },
      backgroundImage: {
        // 噪點紋理 - 高級感的秘密武器
        noise: "url('https://grainy-gradients.vercel.app/noise.svg')",
        // 玻璃漸層
        "glass-gradient":
          "linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
        // 極光漸層
        aurora:
          "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(59, 130, 246, 0.05) 100%)",
        // 徑向光暈
        "radial-glow":
          "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
      },
      backdropBlur: {
        xs: "2px",
        "3xl": "64px",
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.1)",
        "glass-lg": "0 8px 32px rgba(0, 0, 0, 0.12)",
        glow: "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.4)",
        "glow-brand": "0 0 30px rgba(31, 111, 235, 0.35)",
        "glow-purple": "0 0 25px rgba(147, 51, 234, 0.35)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        depth: "0 20px 40px -15px rgba(0, 0, 0, 0.3)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        aurora: "aurora 15s ease infinite",
        "spin-slow": "spin 8s linear infinite",
        "gradient-shift": "gradient-shift 3s ease infinite",
        breathe: "breathe 4s ease-in-out infinite",
        // Travel theme animations (use CSS-defined keyframes)
        'fly': 'fly-across 15s linear infinite',
        'float-cloud': 'float-cloud 8s ease-in-out infinite',
        'float-delayed': 'float-cloud 8s ease-in-out 2s infinite',
        'ripple': 'ripple 1.5s ease-out infinite',
        'bounce-marker': 'bounce-marker 1s ease-in-out infinite',
        'flip-passport': 'flip-passport 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        aurora: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.02)", opacity: "1" },
        },
        // Note: Travel theme keyframes defined in styles/travel-animations.css
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
