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
          50: '#e6f9f0', 100: '#b3edcf', 200: '#80e1ae', 300: '#4dd58d',
          400: '#26cc76', 500: '#06c167', 600: '#05a85a', 700: '#048f4d',
          800: '#037640', 900: '#025d33',
        },
      },
    },
  },
  plugins: [],
}

