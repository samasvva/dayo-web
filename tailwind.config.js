/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F7F7F5',
        card: '#FFFFFF',
        personA: '#3D5A80',
        personB: '#7C4A3A',
        success: '#4CAF50',
        text1: '#1A1A1A',
        text2: '#9E9E9E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
    },
  },
  plugins: [],
}
