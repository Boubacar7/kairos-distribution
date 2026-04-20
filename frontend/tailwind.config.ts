import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#fbf4ef', 2: '#f6ebe3' },
        rose: { 50: '#fbe8e3', 100: '#f5d9d3', 200: '#edc5bd' },
        bordeaux: { DEFAULT: '#6d1e3a', dark: '#521529', light: '#8a2d4d' },
        ink: { DEFAULT: '#1a1414', 2: '#3b2e2e' },
        muted: { DEFAULT: '#7a6a6a', 2: '#a99999' },
        'line-soft': 'rgba(26,20,20,0.08)',
        'line-strong': 'rgba(26,20,20,0.14)',
        // Legacy aliases used by admin pages
        primary: '#6d1e3a',
        'primary-dark': '#521529',
        bg: '#ffffff',
        surface: '#ffffff',
        text: '#1a1414',
        border: 'rgba(26,20,20,0.08)',
        soft: '#fbe8e3',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '12px',
        md: '18px',
        lg: '28px',
        xl2: '40px',
        pill: '999px',
      },
      boxShadow: {
        'soft-sm': '0 1px 2px rgba(26,20,20,.04), 0 2px 6px rgba(109,30,58,.04)',
        'soft-md': '0 4px 14px rgba(109,30,58,.08), 0 1px 3px rgba(26,20,20,.05)',
        'soft-lg': '0 20px 60px rgba(109,30,58,.14), 0 6px 20px rgba(26,20,20,.06)',
      },
    },
  },
  plugins: [],
};
export default config;
