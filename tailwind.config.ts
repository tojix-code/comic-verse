import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { fontFamily: { sans: ["Arial", "Helvetica", "sans-serif"] }, boxShadow: { glow: "0 0 70px rgba(139,92,246,.18)" } } },
  plugins: []
};
export default config;
