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
        sepia: {
          bg: '#f4ecd8',
          text: '#5b4636',
          card: '#ede0c8',
        }
      }
    },
  },
  plugins: [],
}
