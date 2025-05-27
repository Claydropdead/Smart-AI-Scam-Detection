import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },      keyframes: {
        typing: {
          '0%': { width: '0%', visibility: 'visible' },
          '40%': { width: '100%', visibility: 'visible' },
          '60%': { width: '100%', visibility: 'visible' },
          '80%': { width: '0%', visibility: 'visible' },
          '100%': { width: '0%', visibility: 'hidden' }
        },
        blink: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: 'white' }
        }
      },
      animation: {
        typing: 'typing 4s steps(40) infinite',
        blink: 'blink 1s step-end infinite'
      }
    },
  },
  plugins: [],
} satisfies Config;
