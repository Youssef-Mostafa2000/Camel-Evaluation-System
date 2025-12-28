/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Cairo', 'IBM Plex Sans Arabic', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#FAF6F3',
          100: '#F3EBE3',
          200: '#E6D5C7',
          300: '#D4B8A3',
          400: '#B8886E',
          500: '#875539',
          600: '#6F4530',
          700: '#573627',
          800: '#3F281E',
          900: '#271A15',
        },
        secondary: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        cream: {
          50: '#FEFDFB',
          100: '#FEF9F5',
          200: '#FDF4ED',
          300: '#FCEEE3',
          400: '#FAE8D8',
          500: '#F8E2CC',
        },
      },
    },
  },
  plugins: [],
};
