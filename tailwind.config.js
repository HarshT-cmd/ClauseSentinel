/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F2338',
          800: '#16324F', // primary navy
          700: '#1E4369',
          600: '#2A5885'
        },
        teal: {
          500: '#0D9488', // accent teal
          600: '#0F766E',
          50: '#F0FDFA',
          100: '#CCFBF1'
        },
        surface: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          text: '#1E293B',
          muted: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
}
