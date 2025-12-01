import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        modern:
          "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        "modern-lg":
          "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        pastel: {
          primary: "#F8B4D9",
          secondary: "#B4E4F8",
          accent: "#C9F8B4",
          neutral: "#4A5568",
          "base-100": "#FEFEFE",
          "base-200": "#F8F9FA",
          "base-300": "#EDF2F7",
          info: "#93C5FD",
          success: "#86EFAC",
          warning: "#FCD34D",
          error: "#FCA5A5",
        },
        professional: {
          primary: "#3B82F6",
          secondary: "#14B8A6",
          accent: "#06B6D4",
          neutral: "#1E293B",
          "base-100": "#FFFFFF",
          "base-200": "#F8FAFC",
          "base-300": "#E2E8F0",
          info: "#3B82F6",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        },
        vibrant: {
          primary: "#F97316",
          secondary: "#EC4899",
          accent: "#8B5CF6",
          neutral: "#18181B",
          "base-100": "#FAFAFA",
          "base-200": "#F5F5F5",
          "base-300": "#E5E5E5",
          info: "#3B82F6",
          success: "#22C55E",
          warning: "#EAB308",
          error: "#DC2626",
        },
        dark: {
          primary: "#A78BFA",
          secondary: "#34D399",
          accent: "#60A5FA",
          neutral: "#0F172A",
          "base-100": "#1E293B",
          "base-200": "#0F172A",
          "base-300": "#020617",
          info: "#38BDF8",
          success: "#4ADE80",
          warning: "#FBBF24",
          error: "#F87171",
        },
        luxury: {
          primary: "#D4AF37",
          secondary: "#9333EA",
          accent: "#F59E0B",
          neutral: "#1C1917",
          "base-100": "#FAF9F6",
          "base-200": "#F5F5F0",
          "base-300": "#E8E6E0",
          info: "#0EA5E9",
          success: "#059669",
          warning: "#D97706",
          error: "#DC2626",
        },
      },
    ],
  },
};
