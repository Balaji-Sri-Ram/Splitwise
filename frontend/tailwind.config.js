export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D3A2D',
          light: '#4A5D4E',
        },
        accent: '#9B5A46',
        charcoal: '#1A1A1A',
        graphite: '#706F6C',
        'bg-base': '#FBFBF9',
        'bg-card': '#F5F3EF',
        'border-soft': '#E5E2DC',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(45, 58, 45, 0.08), 0 2px 4px -1px rgba(45, 58, 45, 0.04)',
      }
    },
  },
  plugins: [],
}
