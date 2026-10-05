/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#7C3AED",
          cyan: "#06B6D4",
          emerald: "#10B981",
          dark: "#0F172A"
        }
      }
    },
  },
  plugins: [],
}