/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dinkes: {
          50: "#eef5ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#4089f6",
          600: "#2872dc",
          700: "#1d5db8",
          800: "#1e4c91",
          900: "#1d3f73"
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
        soft: "0 18px 50px rgba(64, 137, 246, 0.10)",
        etpp: "0 10px 28px rgba(15, 23, 42, 0.06)",
        button: "0 4px 12px rgba(64, 137, 246, 0.28)"
      }
    }
  },
  plugins: []
};
