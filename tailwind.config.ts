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
        // Morey's Piers brand palette (per 2017 logo guidelines).
        // Yellow is the primary. Orange and brown are accents/shadows.
        // Teal is the supporting background tone seen throughout the guide.
        morey: {
          yellow:      "#FFC72C", // Pantone 123 C — PRIMARY
          yellowDark:  "#E5B226", // hover / shadow
          yellowSoft:  "#FFF4D6", // tints
          orange:      "#DB821F", // Pantone 145 C — secondary
          orangeDark:  "#B86A15",
          brown:       "#975A11", // Pantone 1395 C — depth accent
          teal:        "#5DBEC9", // brand supporting (banners)
          tealSoft:    "#E0EBE8", // brand background mint
          ocean:       "#0891B2", // info / links (kept from prior pass)
          deep:        "#0F172A", // primary text + dark surface
          deepHover:   "#1E293B",
          mid:         "#475569",
          line:        "#E2E8F0",
          sand:        "#FAF8F1", // warm cream page background
          paper:       "#FFFFFF",
        },
      },
      fontFamily: {
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
        bubble: "1.25rem",
        soft:   "0.75rem",
      },
      boxShadow: {
        card:       "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        cardHover:  "0 4px 8px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)",
        bubble:     "0 20px 40px -16px rgba(255, 199, 44, 0.55), 0 8px 16px -8px rgba(151, 90, 17, 0.18)",
        panel:      "0 24px 48px -20px rgba(15, 23, 42, 0.25), 0 8px 20px -8px rgba(15, 23, 42, 0.08)",
        focus:      "0 0 0 3px rgba(255, 199, 44, 0.30)",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 199, 44, 0.45)" },
          "50%":      { boxShadow: "0 0 0 12px rgba(255, 199, 44, 0)" },
        },
      },
      animation: {
        "fade-in":   "fadeIn 0.2s ease-out",
        "slide-up":  "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft":"pulseSoft 2.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
