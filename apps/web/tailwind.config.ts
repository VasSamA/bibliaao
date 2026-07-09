import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta "espiritual" suave: pergaminho, azul profundo, dourado
        parchment: {
          50: '#fdfbf6',
          100: '#f9f4e9',
          200: '#f0e6cf',
        },
        sacred: {
          50: '#eef4ff',
          100: '#d9e6ff',
          400: '#5b7fd6',
          600: '#2f4b91',
          700: '#243a70',
          900: '#131f3d',
        },
        gold: {
          400: '#d8b45f',
          500: '#c49a3b',
          600: '#a67e28',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
