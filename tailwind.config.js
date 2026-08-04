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
        display: ["'Space Grotesk'", 'sans-serif'],
        body: ["'Inter'", 'sans-serif'],
        mono: ["'IBM Plex Mono'", 'monospace'],
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
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out both',
        'fade-in': 'fadeIn 0.35s ease-out both',
        'pop-in': 'popIn 0.18s ease-out both',
      },
    },
  },
  plugins: [],
}
