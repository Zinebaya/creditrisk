import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fbf5ea",
          100: "#f7e8cc",
          200: "#efd19c",
          300: "#e6b966",
          400: "#dd9b35",
          500: "#d58225",
          600: "#bc6e20",
          700: "#9c571a",
          800: "#7d4414",
          900: "#5f3310"
        },
        forest: {
          50: "#eff6f2",
          100: "#dfe9e1",
          200: "#bdd3c4",
          300: "#98b59d",
          400: "#6c8b70",
          500: "#4d774e",
          600: "#345f39",
          700: "#1f3f26",
          800: "#102816",
          900: "#09140b"
        }
      },
      boxShadow: {
        glass: "0 20px 60px rgba(20, 74, 65, 0.08)",
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        arabic: ["Noto Sans Arabic", "Noto Sans", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        glass: "radial-gradient(circle at top left, rgba(241, 178, 74, 0.16), transparent 35%), radial-gradient(circle at bottom right, rgba(77, 119, 78, 0.12), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;
