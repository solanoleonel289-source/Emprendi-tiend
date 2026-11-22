/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/app/**/*.{js,jsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#00cd6b",
          dark: "#121212",
          card: "#1e1e1e",
          border: "#2c2c2c",
          muted: "#888888",
        },
      },
      fontFamily: {
        sans: ["'Arial Black'", "'Arial Bold'", "Gadget", "sans-serif"],
      },
    },
  },
  plugins: [],
};
