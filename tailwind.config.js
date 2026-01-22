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
        accent: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        surface: '#f8fafc',
        border: '#e2e8f0',
        muted: '#64748b',
      },
    },
  },
  plugins: [],
}

