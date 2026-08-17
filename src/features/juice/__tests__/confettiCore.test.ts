import {
  CONFETTI_COLORS,
  confettiTotalDurationMs,
  makeConfettiPieces,
} from '../confettiCore';

/** A deterministic rand cycling through fixed values, for stable assertions. */
function seededRand(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe('makeConfettiPieces', () => {
  it('makes exactly `count` pieces with unique keys', () => {
    const pieces = makeConfettiPieces(20, Math.random);
    expect(pieces).toHaveLength(20);
    expect(new Set(pieces.map((p) => p.key)).size).toBe(20);
  });

  it('handles a zero count', () => {
    expect(makeConfettiPieces(0, Math.random)).toEqual([]);
  });

  it('keeps every piece within its designed ranges', () => {
    for (const p of makeConfettiPieces(200, Math.random)) {
      expect(p.xStart).toBeGreaterThanOrEqual(0);
      expect(p.xStart).toBeLessThanOrEqual(1);
      expect(Math.abs(p.xDrift)).toBeLessThanOrEqual(80);
      expect(p.delay).toBeGreaterThanOrEqual(0);
      expect(p.delay).toBeLessThanOrEqual(400);
      expect(p.duration).toBeGreaterThanOrEqual(1400);
      expect(p.duration).toBeLessThanOrEqual(2200);
      expect(Math.abs(p.rotations)).toBeLessThanOrEqual(3);
      expect(p.size).toBeGreaterThanOrEqual(8);
      expect(p.size).toBeLessThanOrEqual(15);
      expect(CONFETTI_COLORS).toContain(p.color);
    }
  });

  it('is deterministic for a given rand', () => {
    const seq = [0.1, 0.9, 0.25, 0.5, 0.75, 0.33];
    const a = makeConfettiPieces(5, seededRand(seq));
    const b = makeConfettiPieces(5, seededRand(seq));
    expect(a).toEqual(b);
  });

  it('only picks colors from the given palette', () => {
    const palette = ['#111111', '#222222'];
    const pieces = makeConfettiPieces(30, Math.random, palette);
    for (const p of pieces) expect(palette).toContain(p.color);
  });
});

describe('confettiTotalDurationMs', () => {
  it('is the latest delay + duration', () => {
    const pieces = makeConfettiPieces(40, Math.random);
    const expected = Math.max(...pieces.map((p) => p.delay + p.duration));
    expect(confettiTotalDurationMs(pieces)).toBe(expected);
  });

  it('is 0 for no pieces', () => {
    expect(confettiTotalDurationMs([])).toBe(0);
  });
});
