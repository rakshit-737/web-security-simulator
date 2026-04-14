/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          850: '#1a1f2e',
          950: '#0d1117',
        },
      },
    },
  },
  plugins: [],
};
