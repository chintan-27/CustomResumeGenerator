/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      colors: {
        bg: '#faf9f6',
        surface: '#ffffff',
        dark: '#0f1f18',
        'dark-surface': '#162820',
        fg: '#1a1a1a',
        muted: '#6b7280',
        accent: '#2d6a4f',
        'accent-bright': '#4ade80',
        warm: '#c97d3f',
        border: '#e5e3de',
      },
      borderColor: {
        DEFAULT: '#e5e3de',
      },
    },
  },
  plugins: [],
}
