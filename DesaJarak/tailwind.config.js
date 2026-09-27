/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    screens: {
      xs: '360px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Admin's own named brand tokens (kept for backward-compat, unused in current admin code)
        adminBrand: {
          dark: '#027a38',
          primary: '#008748',
          light: '#22c55e',
          bg: '#e6faf0',
          cardBg: '#ebfbf2',
          surface: '#ffffff',
        },
        // Numeric brand scale used throughout the citizen/user pages (src/user/**)
        brand: {
          50: '#eafcf1',
          100: '#d7f5e2',
          200: '#c3f0d6',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#12813f',
          900: '#0f6b34',
          950: '#0b4a26',
        },
        mint: {
          50: '#eafcf1',
          100: '#e1faec',
        },
        accent: {
          500: '#f5a623',
          600: '#ea9410',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
