import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#43a047",
          dark: "#2e7d32",
          soft: "#e8f5e9",
        },
        nav: {
          active: "#e6f4f4",
        },
        side: "#f4f5f7",
      },
    },
  },
  plugins: [],
};

export default config;
