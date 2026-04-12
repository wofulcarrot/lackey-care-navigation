import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      fontSize: {
        base: ['18px', '1.5'],
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
