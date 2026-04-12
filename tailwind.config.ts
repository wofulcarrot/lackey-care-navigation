import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        base: '18px',
      },
      colors: {
        urgency: {
          'life-threatening': '#FEE2E2',
          emergent: '#FFEDD5',
          urgent: '#FEF9C3',
          'semi-urgent': '#DCFCE7',
          routine: '#DBEAFE',
          elective: '#EDE9FE',
        },
      },
    },
  },
  plugins: [],
}

export default config
