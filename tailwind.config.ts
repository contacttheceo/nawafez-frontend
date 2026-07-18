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
        // Brand primary — Warm Slate Blue (replaced the heavier Navy #1B2C6E
        // after the color audit). Classifieds-appropriate: light enough to
        // let listings/images be the visual anchor, dark enough to stay
        // WCAG AA compliant on white. `navy` alias kept so existing
        // components don't need a bulk rename.
        slate: {
          DEFAULT: '#526483',
          dark:    '#3B4A65',
          light:   '#94A3B8',
          tint:    '#E2E8F0',
          bg:      '#F1F5F9',
        },
        navy: {
          DEFAULT: '#526483',   // ← was #1B2C6E; alias for backward compat
          dark:    '#3B4A65',   // ← was #0F1E52
          light:   '#94A3B8',   // ← was #243580
        },
        emerald: {
          DEFAULT: '#0D9B6C',
          dark:    '#087054',
          light:   '#10B981',
          bg:      '#ECFDF5',
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
