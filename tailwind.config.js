/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        white: "#ffffff",
        black: "#000000",
        red: {
          100: "#F8E7EA",
          500: "#BA0C2F",
        },
        gray: {
          400: "#989A9C",
          600: "#585A5C",
          700: "#3B3C3E",
        },
        blue: {
          100: "#E0F5FF",
          200: "#B2E5FF",
          400: "#405EB8",
          500: "#0028A0",
          600: "#001E78",
          900: "#003955",
        },
        green: {
          100: "#d9f3bc",
          300: "#76c022",
        },
      },
      fontFamily: {
        bliss: ["Bliss Pro", "sans-serif"],
      },
    },
  },
};
