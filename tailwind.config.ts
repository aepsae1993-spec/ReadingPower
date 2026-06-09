import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sarabun)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#e8ecff",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,.04) inset, 0 18px 40px -20px rgba(0,0,0,.8)",
        glow: "0 0 18px -2px rgba(129,140,248,.7), 0 0 0 1px rgba(255,255,255,.08) inset",
        neon: "0 0 24px -6px rgba(167,139,250,.65)",
      },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { floaty: "floaty 6s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
