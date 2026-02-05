/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warehouse: {
          bg: '#0d0f14',
          panel: '#16181f',
          panelHover: '#1c1f27',
          border: '#262a34',
          text: {
            primary: '#f9fafb',
            secondary: '#d1d5db',
            tertiary: '#9ca3af',
          },
          accent: {
            primary: '#60a5fa',
            secondary: '#22d3ee',
            tertiary: '#818cf8',
          },
          status: {
            success: '#34d399',
            warning: '#fbbf24',
            critical: '#f87171',
          }
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
