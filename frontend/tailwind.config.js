/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#d41f2c', dark: '#b3131f', light: '#fdecee' },
        cream: { DEFAULT: '#f6f2ed', deep: '#ece6df' },
        ink: '#1c1917',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Poppins', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(60, 30, 20, 0.18)',
        lift: '0 18px 40px -16px rgba(60, 30, 20, 0.28)',
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'none' } },
        pop: { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.25)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: { rise: 'rise .6s ease-out both', pop: 'pop .25s ease-out' },
    },
  },
  plugins: [],
};
