/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          blue: '#00d4ff',
          purple: '#a855f7',
          red: '#ef4444',
          green: '#22c55e',
          orange: '#f97316',
          dark: '#0a0a1a',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
