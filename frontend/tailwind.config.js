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
        primary: '#4F46E5', // Indigo 600
        secondary: '#10B981', // Emerald 500
        danger: '#E11D48', // Rose 600 / Ruby
        info: '#0EA5E9', // Sky 500
        dark: '#1C1917', // Stone 900 / Charcoal
        muted: '#78716C', // Stone 500
        background: '#FAF9F6', // Off-white / Stone 50
        darkbg: '#0C0A09', // Stone 950
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
