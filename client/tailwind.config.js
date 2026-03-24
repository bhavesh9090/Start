/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAFAFA',
        saffron: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF6B00',
          600: '#EA580C',
          700: '#C2410C',
        },
        forest: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        maroon: {
          50: '#F8F8FA',
          100: '#ECECF1',
          200: '#D5D5DC',
          300: '#A3A3B3',
          400: '#6B6B80',
          500: '#1a1a2e',
          600: '#111122',
          700: '#0a0a18',
          800: '#060610',
          900: '#030308',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        hindi: ['Tiro Devanagari Hindi', 'serif'],
      },
      backgroundImage: {
        'mountain': "url('/mountain-bg.svg')",
      },
    },
  },
  plugins: [],
}
