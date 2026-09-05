/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#C2410C",
          dark: "#7C2D12",
          soft: "#FFEDD5",
        },
        cream: "#FAF7F2",
        ink: "#292524",
        muted: "#78716C",
        line: "#E7E5E4",
        success: "#15803D",
        warning: "#A16207",
        danger: "#B91C1C",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(41, 37, 36, 0.06), 0 1px 1px rgba(41, 37, 36, 0.04)",
        pop: "0 8px 24px rgba(124, 45, 18, 0.14)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};
