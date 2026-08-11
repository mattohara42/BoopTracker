/**
 * colors.ts — shared palette so screens don't hardcode hex values.
 * Kept small and boring on purpose; the real "juice" pass is M7.5.
 */
export const colors = {
  background: '#FFF6E9',
  surface: '#FFFFFF',
  primary: '#FF7A59', // the BOOP button
  primaryText: '#FFFFFF',
  text: '#2A2A2A',
  muted: '#8A8A8A',
  border: '#EADfce',
} as const;
