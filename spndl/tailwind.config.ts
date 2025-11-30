import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#8b5cf6",
        "primary-light": "#a78bfa",
        "background-light": "#f6f6f8",
        "background-dark": "#1a1625",
        "surface-dark": "#2a243b",
      },
      fontFamily: {
        display: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-lora)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;