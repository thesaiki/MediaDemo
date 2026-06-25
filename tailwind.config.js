/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        akamai: {
          blue: '#0071ce',
          dark: '#003a6b',
          light: '#e8f4fd',
          orange: '#ff9933',
          cyan: '#0099CC',
        },
        bitmovin: {
          purple: '#2d1b69',
          light: '#f0e6ff',
        },
        unified: {
          green: '#1a4d2e',
          light: '#e8f5e9',
        },
      },
    },
  },
  plugins: [],
}

