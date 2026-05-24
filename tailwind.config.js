/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#e8f4f8',
          100: '#c5e4ef',
          200: '#8cc8df',
          300: '#4ea8c9',
          400: '#1e8db5',
          500: '#0d6e7a',
          600: '#0b5e68',
          700: '#094d57',
          800: '#073c45',
          900: '#0a2e4a',
          950: '#071a2b',
        },
        gold: {
          50: '#fdf8ec',
          100: '#f9edcc',
          200: '#f2d98a',
          300: '#e8c05a',
          400: '#c9a84c',
          500: '#b8943a',
          600: '#9a7a2d',
          700: '#7d6225',
          800: '#614c1d',
          900: '#4a3a16',
        },
        sand: {
          50: '#faf8f4',
          100: '#f8f5ef',
          200: '#ede9df',
          300: '#ddd5c5',
          400: '#c5b99a',
          500: '#aa9a7a',
          600: '#8a7d62',
          700: '#6e634e',
          800: '#544c3c',
          900: '#3d3729',
        },
        coral: {
          400: '#e07b5a',
          500: '#c96040',
          600: '#a84e33',
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        heading: ['"Montserrat"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.25em',
        wider: '0.15em',
      },
      backgroundImage: {
        'ocean-gradient': 'linear-gradient(180deg, #071a2b 0%, #0a2e4a 50%, #0d6e7a 100%)',
      }
    },
  },
  plugins: [],
}
