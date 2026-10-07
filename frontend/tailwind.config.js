/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#e8590c', dark: '#c2410c', light: '#fff4e6' },
      },
    },
  },
  plugins: [],
};
