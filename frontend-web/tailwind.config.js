/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          dark: '#0F47BC',
          medium: '#0D439A',
          light: '#3B82F6',
          white: '#FEFEFE',
        },
        bg: {
          app: '#070B14',
          primary: '#0C1220',
          secondary: '#111827',
          elevated: '#1A2332',
        },
        ink: {
          primary: '#F0F4F8',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        severity: {
          critica: '#EF4444',
          alta: '#F97316',
          media: '#EAB308',
          baixa: '#22C55E',
        },
        start: {
          vermelho: '#EF4444',
          amarelo: '#EAB308',
          verde: '#22C55E',
          preto: '#374151',
        },
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        md: '0 4px 12px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.25)',
        lg: '0 12px 32px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
        brand: '0 0 0 1px rgba(15,71,188,0.4), 0 4px 16px rgba(15,71,188,0.2)',
        critica: '0 0 0 1px rgba(239,68,68,0.4), 0 4px 16px rgba(239,68,68,0.2)',
        inner: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'fade-in': 'iara-fadeIn 0.25s ease',
        'slide-in': 'iara-slideInRight 0.25s ease',
        'pulse-dot': 'iara-pulse-dot 2s ease-in-out infinite',
        'pulse-critica': 'iara-pulse-critica 2s ease infinite',
        shimmer: 'iara-shimmer 1.5s ease infinite',
        spin: 'iara-spin 0.8s linear infinite',
      },
      keyframes: {
        'iara-fadeIn': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'iara-slideInRight': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'iara-pulse-critica': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.2)' },
        },
        'iara-pulse-dot': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 6px currentColor' },
          '50%': { opacity: '0.6', boxShadow: '0 0 2px currentColor' },
        },
        'iara-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'iara-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      screens: {
        '3xl': '1920px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      maxWidth: {
        content: '1440px',
      },
    },
  },
  plugins: [],
};
