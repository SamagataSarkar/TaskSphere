/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        ink: '#F4F7FB', muted: '#A8B5C7', subtle: '#95A5BA',
        canvas: '#06101D', panel: '#0D1D2E', elevated: '#12253B', line: '#2C4158',
        brand: {
          50: '#102E38', 100: '#153D45', 200: '#23616A', 300: '#31848A',
          500: '#42ECE5', 600: '#25D7D3', 700: '#6EE7E1', 900: '#102E38',
        },
        surface: '#06101D',
        red: { 50: '#392332', 100: '#492936', 200: '#874359', 300: '#A95770', 500: '#FDA4AF', 600: '#FDA4AF', 700: '#FDA4AF', 800: '#FDA4AF' },
        amber: { 50: '#352D1F', 100: '#443922', 200: '#67542C', 500: '#FCD777', 600: '#FCD777', 700: '#FCD777', 800: '#FCD777' },
        emerald: { 50: '#113B34', 100: '#194C41', 200: '#245B4D', 500: '#6EE7B7', 600: '#6EE7B7', 700: '#6EE7B7', 800: '#6EE7B7' },
        blue: { 50: '#142E4B', 100: '#1C3C60', 200: '#31547C', 500: '#93C5FD', 600: '#93C5FD', 700: '#93C5FD' },
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
