/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        bg: '#06080c',
        panel: '#0b0f16',
        raised: '#111722',
        line: 'rgba(255,255,255,0.07)',
        accent: { DEFAULT: '#6d8bff', soft: '#8ea4ff', deep: '#3b57d9' },
        teal: { DEFAULT: '#2dd4bf' },
        ok: '#34d399',
        warn: '#fbbf24',
        orng: '#fb923c',
        bad: '#f87171',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(109,139,255,0.35), 0 8px 40px -8px rgba(109,139,255,0.35)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.7)',
      },
      keyframes: {
        scan: { '0%': { top: '0%' }, '100%': { top: '100%' } },
        pulseRing: { '0%': { transform: 'scale(.9)', opacity: '.7' }, '100%': { transform: 'scale(1.8)', opacity: '0' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        scan: 'scan 2.4s linear infinite alternate',
        pulseRing: 'pulseRing 1.8s ease-out infinite',
        shimmer: 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [],
}
