import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nice: {
          pink: {
            DEFAULT: "#E0489A",
            light: "#FFF0F7",
            soft: "#FDE2F0",
            hover: "#D03689",
            dark: "#B81D70",
          },
          wine: {
            DEFAULT: "#5B1F3A",
            dark: "#3B1024",
            deep: "#240815",
            light: "#823659",
          },
          gold: {
            DEFAULT: "#C9A45C",
            light: "#F7ECCC",
            dark: "#A6823B",
          },
          cream: {
            DEFAULT: "#FFFAF5",
            card: "#FFFFFF",
            warm: "#FFF4EB",
          },
          blush: "#FFF5FA",
        },
      },
      fontFamily: {
        script: ["var(--font-script)", "cursive"],
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
      },
      boxShadow: {
        luxury: "0 10px 30px -10px rgba(224, 72, 154, 0.15), 0 4px 6px -2px rgba(91, 31, 58, 0.05)",
        "luxury-lg": "0 20px 40px -15px rgba(224, 72, 154, 0.25), 0 8px 12px -3px rgba(91, 31, 58, 0.08)",
        "card-3d": "0 12px 28px rgba(91, 31, 58, 0.08), 0 2px 4px rgba(224, 72, 154, 0.04)",
      },
      borderRadius: {
        luxury: "1.25rem",
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.5s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 8px rgba(224,72,154,0.4))" },
          "50%": { opacity: "0.85", filter: "drop-shadow(0 0 16px rgba(224,72,154,0.7))" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
