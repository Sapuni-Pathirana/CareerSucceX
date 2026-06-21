/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        aurora: {
          from: '#6366f1',
          via:  '#8b5cf6',
          to:   '#ec4899',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8f9ff',
          100: '#f1f2ff',
          200: '#e8eaff',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'aurora':          'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        'aurora-soft':     'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #fdf2f8 100%)',
        'aurora-card':     'linear-gradient(145deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)',
        'glass':           'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
        'sidebar-glow':    'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
      },
      boxShadow: {
        'glow-sm':   '0 0 12px rgba(99,102,241,0.2)',
        'glow':      '0 0 24px rgba(99,102,241,0.25)',
        'glow-lg':   '0 0 40px rgba(99,102,241,0.3)',
        'glass':     '0 8px 32px rgba(99,102,241,0.12), 0 1px 0 rgba(255,255,255,0.8) inset',
        'card':      '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(99,102,241,0.08)',
        'card-hover':'0 4px 12px rgba(0,0,0,0.08), 0 16px 48px rgba(99,102,241,0.14)',
        'aurora':    '0 8px 32px rgba(99,102,241,0.35)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        'shimmer': {
          from: { backgroundPosition: '200% center' },
          to:   { backgroundPosition: '-200% center' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(99,102,241,0.2)' },
          '50%':       { boxShadow: '0 0 28px rgba(99,102,241,0.45)' },
        },
        'gauge-fill': {
          from: { strokeDashoffset: '339.3' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-6px)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.9)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'progress-fill': {
          from: { width: '0%' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(99,102,241,0.3)' },
          '50%':       { borderColor: 'rgba(99,102,241,0.8)' },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.5s ease-out both',
        'fade-in-left':  'fade-in-left 0.5s ease-out both',
        'fade-in-right': 'fade-in-right 0.5s ease-out both',
        'scale-in':      'scale-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':      'slide-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'marquee':       'marquee 28s linear infinite',
        'shimmer':       'shimmer 3s linear infinite',
        'pulse-glow':    'pulse-glow 2.5s ease-in-out infinite',
        'float':         'float 3s ease-in-out infinite',
        'spin-slow':     'spin-slow 12s linear infinite',
        'count-up':      'count-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'progress-fill': 'progress-fill 1.2s cubic-bezier(0.16,1,0.3,1) both',
        'border-glow':   'border-glow 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
