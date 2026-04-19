import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#8f3f5d',
        'primary-dark': '#6f2e47',
        bg: '#fff9f8',
        surface: '#ffffff',
        text: '#241919',
        muted: '#7f6762',
        border: '#ead9d5',
        soft: '#fff3f1',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '22px' },
    },
  },
  plugins: [],
};
export default config;
