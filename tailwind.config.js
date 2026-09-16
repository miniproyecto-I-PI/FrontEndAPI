/**
 * Tailwind configuration for Convoka.
 *
 * IMPORTANT: These design tokens (colors, radii, fonts) are copied 1:1 from the
 * original static HTML prototype ("Hoy" view mockup) provided by the design/UX
 * team, so that the React implementation is visually identical to the approved
 * prototype. If the UX team updates the visual language, update the tokens here
 * ONLY — every component consumes these tokens via Tailwind class names instead
 * of hardcoded hex values, so a single change here propagates everywhere.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "paper-base": "#F2EBE1",
        "paper-card": "#FAF6F0",
        "paper-linen": "#EDE5DA",
        "paper-accent": "#E6DCCE",
        "ink-charcoal": "#222026",
        "ink-muted": "#68615A",
        "ink-subtle": "#877E75",
        terracotta: "#8B5A3C",
        "terracotta-dark": "#6E4228",
        "terracotta-light": "#F2E4D8",
        "crimson-urgent": "#B83D2B",
        "crimson-paper": "#FAEDE9",
        "crimson-tag": "#962D1D",
        "sage-wax": "#3F563F",
        "sage-light": "#E4ECE2",
        "sepia-border": "#D8CBC0",
        "sepia-dark": "#A89785",
      },
      borderRadius: {
        "asym-book": "18px 4px 18px 4px",
        sharp: "3px",
        "btn-editorial": "3px",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'Plus Jakarta Sans'", "sans-serif"],
        stamp: ["'Space Mono'", "monospace"],
      },
      keyframes: {
        warmPulse: {
          "0%, 100%": { backgroundColor: "#EAE2D7" },
          "50%": { backgroundColor: "#DCD0C2" },
        },
      },
      animation: {
        "warm-pulse": "warmPulse 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
