/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dinkes: {
          50: "#f1f8fd",
          100: "#dceffa",
          200: "#bae0f5",
          300: "#88cbed",
          400: "#4dafdf",
          500: "#2694cc",
          600: "#1878ad",
          700: "#155f8c",
          800: "#164f74",
          900: "#18435f"
        },
        govgold: {
          50: "#fff9eb",
          100: "#ffefc5",
          300: "#ffd86b",
          500: "#d89b17",
          700: "#95640e"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(21, 95, 140, 0.10)"
      }
    }
  },
  plugins: []
};
