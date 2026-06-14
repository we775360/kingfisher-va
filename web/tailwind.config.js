/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kf-red': '#c0121e',
        'kf-red-dark': '#8b0000',
        'kf-red-light': '#e8192c',
        'kf-gold': '#d4af37',
        'kf-black': '#0a0a0a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}