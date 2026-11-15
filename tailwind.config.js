/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#153C35',
          50: '#EAF2F0',
          600: '#1C4F45',
          900: '#0C241F',
        },
        eco: {
          DEFAULT: '#198C76',
          50: '#E8F6F2',
          100: '#CBEBE2',
          500: '#198C76',
          600: '#147765',
          700: '#0F5E4F',
        },
        mint: '#DDF5E9',
        cream: '#F8FAF5',
        ink: '#172B25',
        muted: '#667770',
        amber: {
          DEFAULT: '#F2BA62',
          soft: '#FDF3E2',
          deep: '#B9801F',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(21, 60, 53, 0.04), 0 8px 24px -12px rgba(21, 60, 53, 0.14)',
        lift: '0 2px 4px rgba(21, 60, 53, 0.05), 0 18px 40px -16px rgba(21, 60, 53, 0.22)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        shimmer: 'shimmer 1.8s infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
