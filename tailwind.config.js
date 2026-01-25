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
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b7ccff',
          300: '#8ab0ff',
          400: '#5c92ff',
          500: '#1f6feb',
          600: '#1758c7',
          700: '#12439a',
          800: '#0d2f6d',
          900: '#0b1f3a',
        },
        // TripERP 深色主題色階 (Vision Pro 風格)
        trip: {
          950: '#030712',  // 最深背景
          900: '#0B1120',  // 主背景 (接近黑的深藍)
          800: '#151e32',  // 卡片背景
          700: '#1e293b',  // 次要背景
          brand: '#1E40AF', // 主色深藍
          accent: '#3B82F6', // 亮部點綴
          glow: '#60A5FA',   // 光暈色
        },
        accent: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        surface: '#f8fafc',
        border: '#e2e8f0',
        muted: '#64748b',
      },
      backgroundImage: {
        // 噪點紋理 - 高級感的秘密武器
        'noise': "url('https://grainy-gradients.vercel.app/noise.svg')",
        // 玻璃漸層
        'glass-gradient': 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        // 極光漸層
        'aurora': 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(59, 130, 246, 0.05) 100%)',
        // 徑向光暈
        'radial-glow': 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',
        'glow-brand': '0 0 30px rgba(31, 111, 235, 0.35)',
        'glow-purple': '0 0 25px rgba(147, 51, 234, 0.35)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'depth': '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'aurora': 'aurora 15s ease infinite',
        'spin-slow': 'spin 8s linear infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

