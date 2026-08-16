/**
 * Design tokens. One warm, playful, kid-friendly system so screens don't
 * hardcode values. Changing a token here re-skins the whole app.
 */
export const colors = {
  background: '#FFF7EC', // soft warm cream
  surface: '#FFFFFF',
  surfaceAlt: '#FFF0E2', // tinted cards / pills
  primary: '#FF6F61', // coral — the brand
  primaryText: '#FFFFFF',
  accent: '#F5A524', // warm gold — stat numbers, highlights
  text: '#2A2320', // warm near-black
  muted: '#9B8E82', // warm gray
  border: '#F1E5D6',
  danger: '#E5484D',
  success: '#2E9E6B',
} as const;

/** Gradient stops (used with expo-linear-gradient). */
export const gradients = {
  boop: ['#FF9A5A', '#FF5E7E'] as const, // sunset: orange → pink
} as const;

export const radius = { sm: 12, md: 16, lg: 22, pill: 999 } as const;

export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 } as const;

/** Reusable elevation presets. */
export const shadow = {
  card: {
    shadowColor: '#7A4A2B',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  button: {
    shadowColor: '#FF5E7E',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },
} as const;
