import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        luxgold: {
          bg: '#040604', // Deep Rich Black
          surface: '#0D140F', // Dark Charcoal with forest tint
          card: '#131A15', // Card background
          primary: '#10B981', // Emerald Profit Green
          secondary: '#D4AF37', // Dark Golden / Metallic Gold
          accent: '#FBBF24', // Amber Gold Accent
          emerald: '#059669', // Deep Emerald
          gold: '#C5A059', // Rich Luxury Gold
          muted: '#9CA3AF', // Muted Gray
        },
      },
      backgroundImage: {
        'lux-gradient': 'linear-gradient(135deg, #D4AF37 0%, #10B981 50%, #059669 100%)',
        'gold-gradient': 'linear-gradient(135deg, #F59E0B 0%, #D4AF37 100%)',
        'green-gradient': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
