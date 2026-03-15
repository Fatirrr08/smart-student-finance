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
        primary: '#4F46E5', // Indigo
        secondary: '#22C55E', // Green
        danger: '#EF4444', // Red
        background: '#F9FAFB', // Light bg
        darkbg: '#111827', // Dark bg
      }
    },
  },
  plugins: [],
}
