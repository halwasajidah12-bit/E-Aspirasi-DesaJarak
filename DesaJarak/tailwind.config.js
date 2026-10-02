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
        // Numeric brand scale used throughout the citizen/user pages (src/user/**)4
        brand: {
        50:  '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        500: '#34d399',
        600: '#10b981',
        700: '#059669',  // = emerald-600, primer admin
        800: '#047857',  // = emerald-700, teks hijau admin
        900: '#065f46',  // = emerald-800
        950: '#064e3b',
        },
        mint: {
          50:  '#e6faf0',
          100: '#d1fae5',
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
