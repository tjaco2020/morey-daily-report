import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── beAcon brand palette ─────────────────────────────────────
        // Premium operational intelligence. Navy dominates. Teal signals
        // intelligence / live state / AI. Gold is sparing premium accent.
        beacon: {
          navy:      "#0F172A",
          charcoal:  "#1E293B",
          teal:      "#00B3A7",
          tealDark:  "#008F86",
          tealSoft:  "#E0F7F5",
          gold:      "#FFC72C",
          goldDark:  "#E5B226",
          goldSoft:  "#FFF4D6",
          gray:      "#C6C8CA",
          offwhite:  "#F8FAFC",
          line:      "#E2E8F0",
          mid:       "#475569",
        },

        // ── Legacy morey-* aliases ───────────────────────────────────
        // Kept for backward compat while we sweep classes across files.
        // Hex values remapped to align with beAcon palette where it
        // makes sense, so visual rebrand takes effect immediately.
        morey: {
          yellow:      "#FFC72C", // gold — used sparingly now
          yellowDark:  "#E5B226",
          yellowSoft:  "#FFF4D6",
          orange:      "#DB821F", // kept (warm accent, used rarely)
          orangeDark:  "#B86A15",
          brown:       "#975A11",
          teal:        "#00B3A7", // remapped → beacon teal
          tealSoft:    "#E0F7F5",
          ocean:       "#00B3A7", // remapped → beacon teal (was cyan)
          deep:        "#0F172A", // navy
          deepHover:   "#1E293B", // charcoal
          mid:         "#475569",
          line:        "#E2E8F0",
          sand:        "#F8FAFC", // remapped → off-white (was warm cream)
          paper:       "#FFFFFF",
        },
      },
      fontFamily: {
        // Geist + Inter family for that operational-SaaS feel
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["var(--font-yesteryear)", "cursive"],
      },
      fontSize: {
        xs:   ["0.75rem",  { lineHeight: "1rem" }],
        sm:   ["0.875rem", { lineHeight: "1.35rem" }],
        base: ["1rem",     { lineHeight: "1.55rem" }],
      },
      borderRadius: {
        bubble: "1rem",
        soft:   "0.625rem",
      },
      boxShadow: {
        card:       "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.05)",
        cardHover:  "0 4px 8px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)",
        bubble:     "0 20px 40px -16px rgba(15, 23, 42, 0.40), 0 8px 16px -8px rgba(0, 179, 167, 0.18)",
        panel:      "0 24px 48px -20px rgba(15, 23, 42, 0.28), 0 8px 20px -8px rgba(15, 23, 42, 0.10)",
        focus:      "0 0 0 3px rgba(0, 179, 167, 0.30)",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          // Teal halo — signals live / AI / intelligence
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 179, 167, 0.40)" },
          "50%":      { boxShadow: "0 0 0 12px rgba(0, 179, 167, 0)" },
        },
      },
      animation: {
        "fade-in":   "fadeIn 0.2s ease-out",
        "slide-up":  "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft":"pulseSoft 2.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
