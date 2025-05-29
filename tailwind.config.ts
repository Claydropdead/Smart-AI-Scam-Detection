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
        },
        uploadArrow: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
          '100%': { transform: 'translateY(0)' }
        },
        particle1: {
          '0%': { transform: 'translate(-50%, -50%)', opacity: '0' },
          '25%': { transform: 'translate(-150%, -100%)', opacity: '0.8' },
          '100%': { transform: 'translate(-200%, -200%)', opacity: '0' }
        },
        particle2: {
          '0%': { transform: 'translate(-50%, -50%)', opacity: '0' },
          '25%': { transform: 'translate(100%, -80%)', opacity: '0.8' },
          '100%': { transform: 'translate(150%, -150%)', opacity: '0' }
        },
        particle3: {
          '0%': { transform: 'translate(-50%, -50%)', opacity: '0' },
          '25%': { transform: 'translate(-70%, 100%)', opacity: '0.8' },
          '100%': { transform: 'translate(-100%, 150%)', opacity: '0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        pulse3D: {
          '0%, 100%': { transform: 'scale3d(1, 1, 1)' },
          '50%': { transform: 'scale3d(1.05, 1.05, 1.05)' }
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' }
        }
      },
      animation: {
        typing: 'typing 4s steps(40) infinite',
        blink: 'blink 1s step-end infinite',
        uploadArrow: 'uploadArrow 1.5s ease-in-out infinite',
        particle1: 'particle1 2s ease-out forwards',
        particle2: 'particle2 2s ease-out forwards',
        particle3: 'particle3 2s ease-out forwards',
        float: 'float 5s ease-in-out infinite',
        pulse3D: 'pulse3D 3s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite'
      }
    },
  },
  plugins: [],
} satisfies Config;
