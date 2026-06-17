/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        space: { 950: "#060913", 900: "#0a0f1f", 800: "#0d1224", 700: "#131a33" },
        glass: "rgba(13,18,36,0.78)",
        gem: { blue: "#4285F4", violet: "#9B72CB", coral: "#D96570" },
        tele: "#22d3ee",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(66,133,244,0.35)",
        panel: "0 8px 40px rgba(0,0,0,0.55)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
        pulseRing: { "0%,100%": { opacity: 0.45 }, "50%": { opacity: 1 } },
        rise: { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        shimmer: "shimmer 3s linear infinite",
        pulseRing: "pulseRing 1.6s ease-in-out infinite",
        rise: "rise .35s ease-out both",
      },
    },
  },
  plugins: [],
};
