import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          mid: '#111E35',
          card: '#172240',
          light: '#1E2E50',
        },
        gold: {
          DEFAULT: '#C8A84B',
          light: '#E5C97A',
          dim: '#7A6030',
        },
        cream: '#F2EDE0',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
