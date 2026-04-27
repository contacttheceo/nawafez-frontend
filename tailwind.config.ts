import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B2C6E',
          dark:    '#0F1E52',
          light:   '#243580',
        },
        emerald: {
          DEFAULT: '#0D9B6C',
          dark:    '#097A54',
          light:   '#10B87F',
          bg:      '#F0FAF6',
        },
      },
      fontFamily: {
        sans: ['var(--font-arabic)', 'Segoe UI', 'Tahoma', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(27,44,110,0.08)',
        'card-lg': '0 8px 32px rgba(27,44,110,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
