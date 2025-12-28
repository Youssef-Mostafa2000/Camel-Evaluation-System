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
          50: '#FFF8E6',
          100: '#FFEFC2',
          200: '#FFE099',
          300: '#FFD170',
          400: '#FFC247',
          500: '#D97706',
          600: '#B86304',
          700: '#974F03',
          800: '#763B02',
          900: '#552801',
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
