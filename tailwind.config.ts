import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-ibm-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          950: "#070b14",
          900: "#0b1220",
          850: "#101826",
          800: "#152033",
          700: "#1c2b44",
          600: "#2a3d5c",
        },
        accent: {
          DEFAULT: "#2dd4bf",
          dim: "#115e59",
        },
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(148, 163, 184, 0.08), 0 18px 40px rgba(0,0,0,0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
