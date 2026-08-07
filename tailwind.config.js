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
        sans: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
        display: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
        mono: ["'JetBrains Mono'", "'SF Mono'", 'Monaco', 'monospace'],
      },
      // Type scale — matches Pipeline Pulse design tokens exactly.
      fontSize: {
        // Standard Tailwind names mapped to Pipeline Pulse token values
        xs: ['0.75rem', { lineHeight: '1.5' }],       // 12px — PP --pp-font-size-xs
        sm: ['0.875rem', { lineHeight: '1.5' }],      // 14px — PP --pp-font-size-sm
        base: ['1rem', { lineHeight: '1.5' }],        // 16px — PP --pp-font-size-md
        lg: ['1.125rem', { lineHeight: '1.5' }],      // 18px — PP --pp-font-size-lg
        xl: ['1.25rem', { lineHeight: '1.25' }],      // 20px — PP --pp-font-size-xl
        '2xl': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.015em' }],   // 24px — PP --pp-font-size-2xl
        '3xl': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],  // 30px — PP --pp-font-size-3xl
        '4xl': ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],   // 36px — PP --pp-font-size-4xl

        // Semantic aliases — corrected to the sizes the app actually converged
        // on in practice (most UI text is hand-set with arbitrary text-[13px]
        // etc. rather than these). Currently unused anywhere in src/, so free
        // to reach for on new work instead of picking another one-off value.
        caption: ['0.6875rem', { lineHeight: '1.4' }],      // 11px — badges, meta labels
        body: ['0.8125rem', { lineHeight: '1.5' }],         // 13px — default UI text
        subhead: ['0.9375rem', { lineHeight: '1.4' }],      // 15px — modal titles, brand text
        heading: ['1.0625rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }], // 17px — page titles
        title: ['1.375rem', { lineHeight: '1.25' }],        // 22px — auth screen headings
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
      },
      // Spacing — matches Pipeline Pulse spacing tokens (--pp-space-*)
      spacing: {
        0: '0rem',
        1: '0.25rem',     // 4px
        2: '0.5rem',      // 8px
        3: '0.75rem',     // 12px
        4: '1rem',        // 16px
        5: '1.25rem',     // 20px
        6: '1.5rem',      // 24px
        8: '2rem',        // 32px
        10: '2.5rem',     // 40px
        12: '3rem',       // 48px
        16: '4rem',       // 64px
        20: '5rem',       // 80px
      },
      // Border radius — matches Pipeline Pulse radius tokens (--pp-radius-*)
      borderRadius: {
        none: '0',
        sm: '0.125rem',   // 2px
        DEFAULT: '0.375rem', // 6px
        md: '0.375rem',   // 6px
        lg: '0.5rem',     // 8px
        xl: '0.75rem',    // 12px
        '2xl': '1rem',    // 16px
        full: '9999px',
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
        ribbonSway: {
          '0%': { transform: 'translateX(0) skewX(0deg)' },
          '25%': { transform: 'translateX(10px) skewX(6deg)' },
          '50%': { transform: 'translateX(-6px) skewX(-4deg)' },
          '75%': { transform: 'translateX(14px) skewX(3deg)' },
          '100%': { transform: 'translateX(0) skewX(0deg)' },
        },
        dustDrift: {
          '0%, 100%': { transform: 'translate(0,0)', opacity: '0.35' },
          '50%': { transform: 'translate(6px,-10px)', opacity: '0.7' },
        },
        cometStreak: {
          '0%, 72%': { opacity: '0', transform: 'rotate(-22deg) translateX(0)' },
          '74%': { opacity: '1' },
          '85%, 100%': { opacity: '0', transform: 'rotate(-22deg) translateX(180px)' },
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
        'ribbon-sway': 'ribbonSway 8s ease-in-out infinite',
        'comet-streak': 'cometStreak 10s linear infinite',
        'dust-drift': 'dustDrift 9s ease-in-out infinite',
        'drawer-slide-in': 'drawerSlideIn 0.25s cubic-bezier(0.2,0.8,0.3,1) both',
      },
    },
  },
  plugins: [],
}
