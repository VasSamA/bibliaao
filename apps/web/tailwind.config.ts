import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta "petróleo" — redesign 2026-08-14 (ver HANDOFF.md), a partir de
        // --navy/--ink/--gold/--cream/--paper da proposta de referência.
        parchment: {
          50: '#fbfaf7',
          100: '#f5f0e8',
          200: '#ece3d3',
        },
        sacred: {
          50: '#eef4f4',
          100: '#d7e4e4',
          400: '#4f747d',
          600: '#1c4d59',
          700: '#113642',
          900: '#0d2935',
        },
        gold: {
          400: '#d9a962',
          500: '#c58c43',
          600: '#a97a3a',
        },
      },
      fontFamily: {
        serif: ['var(--font-display)', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['var(--font-sans)', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
