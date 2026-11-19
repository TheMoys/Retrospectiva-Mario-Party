/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mario: {
          red: '#E52521',
          blue: '#002688',
          yellow: '#FBD100',
          green: '#43B047',
          orange: '#FF7700',
          purple: '#8C38FF',
          dark: '#0D1117',
          gold: '#FFD700',
        },
        rainbow: {
          red: '#ff0033',
          orange: '#ff6600',
          yellow: '#ffee00',
          green: '#00ff66',
          cyan: '#00ccff',
          purple: '#9900ff',
        }
      },
      fontFamily: {
        game: ['"Fredoka"', '"Nunito"', 'system-ui', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      animation: {
        'bounce-subtle': 'bounce 2s infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.3))' },
        }
      }
    },
  },
  plugins: [],
}
