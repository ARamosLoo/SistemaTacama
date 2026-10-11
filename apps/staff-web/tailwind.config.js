/** @type {import('tailwindcss').Config} */
// Paleta tomada de tambodetacama.com: verde hoja de vid (#577A17), tinta (#1F1F1F) y blanco.
const verde = {
  50: '#F4F8EA', 100: '#E6F0D0', 200: '#CFE1A5', 300: '#B1CC72', 400: '#8FB339',
  500: '#6F9524', 600: '#577A17', 700: '#466212', 800: '#384F0F', 900: '#2E4310', 950: '#1A2808',
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Los acentos "amber" y "purple" del diseño original pasan al verde de marca
        amber: verde,
        purple: verde,
        tacama: verde,
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
