/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary_purple: "#6A2E92",
      },
      boxShadow: {
        custom: "0 4px 6px 0 #6A2E92",
      },
      animation: {
        bounceInOut: "bounceInOut 0.6s ease-in-out",
        blink: "blink 1.5s infinite ease-in-out",
      },
      keyframes: {
        bounceInOut: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        blink: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.4 },
        },
      },
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};