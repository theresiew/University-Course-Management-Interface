/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f8ff',
          100: '#dde8ff',
          200: '#bccffd',
          500: '#3465d9',
          700: '#1f428f',
        },
        ink: {
          950: '#10213d',
        },
        sand: {
          50: '#fffdf8',
          100: '#f6f1e8',
          200: '#eadfcd',
        },
        success: {
          100: '#dcfce7',
          700: '#166534',
        },
        danger: {
          100: '#fee2e2',
          700: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
