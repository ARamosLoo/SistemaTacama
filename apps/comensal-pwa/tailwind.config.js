/** @type {import('tailwindcss').Config} */
// Paleta del logo de Tambo de Tacama: verde hoja de vid (#577A17), verde oscuro (#2E4310), tinta (#1F1F1F) y blanco.
// Todo lo demás se deriva de esos colores para que el sistema se vea como una sola marca:
//   verde  → marca, acciones y estados correctos
//   piedra → neutros (grises con un matiz oliva, en vez de grises fríos o marrones)
//   vino   → alertas y alergias (el viñedo: un granate apagado, distinto del verde)
//   tierra → avisos e información (un ocre apagado)
const verde = {
  50: '#F4F8EA', 100: '#E6F0D0', 200: '#CFE1A5', 300: '#B1CC72', 400: '#8FB339',
  500: '#6F9524', 600: '#577A17', 700: '#466212', 800: '#384F0F', 900: '#2E4310', 950: '#1A2808',
};
const piedra = {
  50: '#F7F8F2', 100: '#EEF0E4', 200: '#DFE3CF', 300: '#C5CBAF', 400: '#9BA384',
  500: '#6B7355', 600: '#555D41', 700: '#434A33', 800: '#2E3422', 900: '#1E2316', 950: '#12150C',
};
const vino = {
  50: '#FBF3F4', 100: '#F5E1E4', 200: '#E9C3C9', 300: '#D79AA4', 400: '#C06A79',
  500: '#A24556', 600: '#8A3345', 700: '#712A38', 800: '#5C2430', 900: '#4B202A', 950: '#2A0F16',
};
const tierra = {
  50: '#FAF6EF', 100: '#F2E8D5', 200: '#E4D0A8', 300: '#D2B374', 400: '#BF9645',
  500: '#A67D2E', 600: '#8A6424', 700: '#6E4E1F', 800: '#583F1D', 900: '#4A361B', 950: '#2A1E0D',
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tacama: verde,
        // Los colores que traía el diseño original se reemplazan por los de la marca
        amber: verde, purple: verde, emerald: verde, green: verde, teal: verde, lime: verde,
        stone: piedra, gray: piedra, slate: piedra, zinc: piedra, neutral: piedra,
        rose: vino, red: vino, pink: vino,
        orange: tierra, yellow: tierra, sky: tierra, blue: tierra,
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
