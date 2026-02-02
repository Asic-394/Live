/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warehouse: {
          bg: '#0a0a0a',
          panel: '#12141a',
          panelHover: '#1a1d24',
          border: '#262a34',
          text: {
            primary: '#e8eaed',
            secondary: '#9ba1ac',
            tertiary: '#6b7280',
          },
          accent: {
            cyan: '#22d3ee',
            cyanMuted: '#06b6d4',
            blue: '#3b82f6',
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
