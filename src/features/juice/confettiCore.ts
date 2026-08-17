/**
 * confettiCore — the pure math behind the M7.5 confetti burst, no React or
 * Animated in it, so the piece layout is deterministic and unit-testable (the
 * `*Core.ts` pattern). The `Confetti` component turns each spec into an animated
 * view; this file just decides where the pieces start, how they drift, spin, and
 * how long they take, given an injected `rand` (Math.random in the app, a seeded
 * stub in tests).
 */

/** The warm palette the pieces are tinted with (pulled toward the theme). */
export const CONFETTI_COLORS: readonly string[] = [
  '#FF6F61', // coral (brand)
  '#F5A524', // gold
  '#FF9A5A', // orange
  '#FF5E7E', // pink
  '#2E9E6B', // green
  '#5B8DEF', // blue
];

export interface ConfettiPiece {
  /** Stable list key. */
  key: number;
  /** Horizontal start, as a 0..1 fraction of the container width. */
  xStart: number;
  /** Sideways drift over the fall, in px (can be negative). */
  xDrift: number;
  /** Stagger before this piece starts falling, in ms. */
  delay: number;
  /** Fall duration, in ms. */
  duration: number;
  /** Full turns of spin over the fall (can be negative). */
  rotations: number;
  /** Fill color, from `CONFETTI_COLORS`. */
  color: string;
  /** Edge length in px. */
  size: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Build `count` confetti pieces. Ranges are tuned for a short, lively burst:
 * pieces start across the full width, stagger in over ~400ms, and fall for
 * ~1.4–2.2s with a bit of sideways drift and a few spins.
 */
export function makeConfettiPieces(
  count: number,
  rand: () => number,
  colors: readonly string[] = CONFETTI_COLORS,
): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < count; i++) {
    pieces.push({
      key: i,
      xStart: clamp01(rand()),
      xDrift: (rand() - 0.5) * 160, // -80..80 px
      delay: rand() * 400, // 0..400 ms stagger
      duration: 1400 + rand() * 800, // 1.4..2.2 s
      rotations: (rand() - 0.5) * 6, // -3..3 turns
      color: colors[Math.floor(rand() * colors.length) % colors.length],
      size: 8 + Math.floor(rand() * 8), // 8..15 px
    });
  }
  return pieces;
}

/** Total time from the first piece starting to the last one landing, in ms. */
export function confettiTotalDurationMs(pieces: readonly ConfettiPiece[]): number {
  return pieces.reduce((max, p) => Math.max(max, p.delay + p.duration), 0);
}
