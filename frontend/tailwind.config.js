/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        indigo: {
          50: 'rgb(var(--theme-50) / <alpha-value>)',
          100: 'rgb(var(--theme-100) / <alpha-value>)',
          200: 'rgb(var(--theme-200) / <alpha-value>)',
          300: 'rgb(var(--theme-300) / <alpha-value>)',
          400: 'rgb(var(--theme-400) / <alpha-value>)',
          500: 'rgb(var(--theme-500) / <alpha-value>)',
          600: 'rgb(var(--theme-600) / <alpha-value>)',
          700: 'rgb(var(--theme-700) / <alpha-value>)',
          800: 'rgb(var(--theme-800) / <alpha-value>)',
          900: 'rgb(var(--theme-900) / <alpha-value>)',
          950: 'rgb(var(--theme-950) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
        malayalam: ['Manjari', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2.5s infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
