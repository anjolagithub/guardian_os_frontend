/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void:    "#080A0F",
        surface: "#0D1117",
        panel:   "#111827",
        border:  "#1F2937",
        muted:   "#374151",
        dim:     "#6B7280",
        ghost:   "#9CA3AF",
        primary: "#E2E8F0",
        cyan:    { DEFAULT: "#00D4FF", dim: "#0891B2" },
        green:   { DEFAULT: "#00FF88", dim: "#059669" },
        amber:   { DEFAULT: "#FFB800", dim: "#D97706" },
        red:     { DEFAULT: "#FF3B3B", dim: "#DC2626"  },
        violet:  { DEFAULT: "#8B5CF6", dim: "#6D28D9" },
      },
      fontFamily: {
        mono:    ["'JetBrains Mono'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        "radial-glow":  "radial-gradient(ellipse at center, rgba(0,212,255,0.06) 0%, transparent 70%)",
      },
      backgroundSize: { "grid": "40px 40px" },
      animation: {
        pulse_slow: "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        glow_cyan:  "glowCyan 2s ease-in-out infinite alternate",
        glow_red:   "glowRed 1.5s ease-in-out infinite alternate",
        float:      "float 6s ease-in-out infinite",
        slide_up:   "slideUp 0.4s ease-out forwards",
        fade_in:    "fadeIn 0.6s ease-out forwards",
      },
      keyframes: {
        glowCyan: { from: { boxShadow: "0 0 8px rgba(0,212,255,0.3)" },  to: { boxShadow: "0 0 24px rgba(0,212,255,0.6)" } },
        glowRed:  { from: { boxShadow: "0 0 8px rgba(255,59,59,0.4)" },  to: { boxShadow: "0 0 28px rgba(255,59,59,0.8)" } },
        float:    { "0%,100%": { transform: "translateY(0)" },            "50%": { transform: "translateY(-8px)" } },
        slideUp:  { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn:   { from: { opacity: "0" },                               to: { opacity: "1" } },
      },
    },
  },
  plugins: [],
}
