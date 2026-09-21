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
        cream: {
          50: '#FCFBF8',
          100: '#F7F5F0',
          200: '#EFECE6',
          300: '#E4DFD5',
        },
        slate: {
          850: '#151D2E',
          950: '#0B0F19',
        }
      },
      boxShadow: {
        'soft-card': '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 4px 12px -2px rgba(0, 0, 0, 0.02)',
        'soft-hover': '0 20px 40px -10px rgba(0, 0, 0, 0.07), 0 8px 16px -4px rgba(0, 0, 0, 0.03)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
