/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        anima: {
          bg: '#0a0a0f',
          'bg-light': '#12121a',
          'bg-card': '#16161f',
          gold: '#c9a84c',
          'gold-dim': '#8a7533',
          blue: '#4c7bc9',
          'blue-dim': '#3a5d99',
          green: '#4cc97b',
          red: '#c94c4c',
          text: '#e8e6e3',
          'text-dim': '#8a8780',
          border: '#2a2a35',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      width: {
        'phi-primary': '61.8%',
        'phi-secondary': '38.2%',
      },
      maxWidth: {
        'phi-primary': '61.8%',
        'phi-secondary': '38.2%',
      },
      animation: {
        'pulse-pi': 'pulsePi 3.14s ease-in-out infinite',
        'spin-phi': 'spinPhi 1.618s linear infinite',
        'fade-in': 'fadeIn 0.618s ease-out',
      },
      keyframes: {
        pulsePi: {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 1 },
        },
        spinPhi: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
