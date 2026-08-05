/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#5B5FEF',
          deep: '#4548C9',
          soft: '#EEF0FE',
        },
        ink: {
          DEFAULT: '#14171F',
          soft: '#1C2030',
          faint: '#2A2F42',
        },
        paper: '#F5F6F8',
        slate: {
          custom: '#6B7280',
          soft: '#F0F1F3',
        },
        success: {
          DEFAULT: '#1E9E6B',
          soft: '#E7F6EF',
        },
        warning: {
          DEFAULT: '#C6820F',
          soft: '#FBF0DD',
        },
        danger: {
          DEFAULT: '#E5484D',
          soft: '#FDECEC',
        },
        info: {
          DEFAULT: '#3B82F6',
          soft: '#EAF1FE',
        },
      },
      fontFamily: {
        display: ["'Inter'", 'sans-serif'],
        body: ["'Inter'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      // Standardized type scale — replaces 16 arbitrary text-[Npx] one-offs
      // that had accumulated with no semantic meaning behind the differences.
      fontSize: {
        micro: ['10px', { lineHeight: '1.4' }],
        caption: ['11px', { lineHeight: '1.45' }],
        label: ['12px', { lineHeight: '1.45' }],
        body: ['13px', { lineHeight: '1.5' }],
        'body-lg': ['14px', { lineHeight: '1.5' }],
        subhead: ['15px', { lineHeight: '1.4' }],
        heading: ['22px', { lineHeight: '1.25' }],
        display: ['32px', { lineHeight: '1.15' }],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        orbitSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        orbitSpinReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-9px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.15', transform: 'scale(0.85)' },
          '50%': { opacity: '0.9', transform: 'scale(1)' },
        },
        auroraA: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(40px,30px) scale(1.15)' },
          '66%': { transform: 'translate(15px,55px) scale(0.9)' },
        },
        auroraB: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-35px,-40px) scale(1.2)' },
        },
        auroraC: {
          '0%, 100%': { transform: 'translate(0,0) scale(0.9)' },
          '40%': { transform: 'translate(-25px,20px) scale(1.1)' },
          '75%': { transform: 'translate(20px,-15px) scale(1)' },
        },
        lightSweep: {
          '0%': { left: '-40%', opacity: '0' },
          '12%': { opacity: '1' },
          '45%': { left: '110%', opacity: '1' },
          '58%': { opacity: '0' },
          '100%': { left: '110%', opacity: '0' },
        },
        emberRise: {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '15%': { opacity: '0.9' },
          '100%': { transform: 'translateY(-40px)', opacity: '0' },
        },
        dustDrift: {
          '0%, 100%': { transform: 'translate(0,0)', opacity: '0.35' },
          '50%': { transform: 'translate(6px,-10px)', opacity: '0.7' },
        },
        drawerSlideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out both',
        'fade-in': 'fadeIn 0.35s ease-out both',
        'pop-in': 'popIn 0.18s ease-out both',
        'orbit-spin': 'orbitSpin 16s linear infinite',
        'orbit-spin-slow': 'orbitSpinReverse 26s linear infinite',
        float: 'float 6s ease-in-out infinite',
        twinkle: 'twinkle 3.2s ease-in-out infinite',
        'aurora-a': 'auroraA 18s ease-in-out infinite',
        'aurora-b': 'auroraB 22s ease-in-out infinite',
        'aurora-c': 'auroraC 26s ease-in-out infinite',
        'light-sweep': 'lightSweep 6s ease-in-out infinite',
        'ember-rise': 'emberRise 5s ease-in-out infinite',
        'dust-drift': 'dustDrift 9s ease-in-out infinite',
        'drawer-slide-in': 'drawerSlideIn 0.25s cubic-bezier(0.2,0.8,0.3,1) both',
      },
    },
  },
  plugins: [],
}
