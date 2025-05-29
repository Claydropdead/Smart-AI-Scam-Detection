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
          '0%': { width: '0%' },
          '25%': { width: '100%' },
          '75%': { width: '100%' },
          '100%': { width: '0%' }
        },        blink: {
          '0%': { borderRightColor: 'transparent' },
          '50%': { borderRightColor: 'white' },
          '100%': { borderRightColor: 'transparent' }
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
      },      animation: {
        typing: 'typing 6s steps(40) infinite',
        blink: 'blink 0.8s step-end infinite',
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
