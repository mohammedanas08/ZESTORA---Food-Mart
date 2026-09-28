/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF6B00',
          600: '#E05300',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          dark: '#1A1412',
        },
        surface: {
          light: '#FFFFFF',
          soft: '#F8FAFC',
          border: '#E2E8F0',
          muted: '#64748B',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        elevated: '0 10px 30px -4px rgba(255, 107, 0, 0.12)',
        float: '0 20px 40px -6px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
