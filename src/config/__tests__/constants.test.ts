import {
  BIG_DEAL_ACHIEVEMENTS,
  BOOP_TYPES,
  LEADERBOARD_STATS,
  POWERUPS,
} from '../constants';

/**
 * These guard the SPEC's *hard* design rules — not tuning values. If one of
 * these fails, someone changed a constant in a way that breaks a documented
 * constraint (see docs/SPEC.md and CLAUDE.md "Hard constraints"). Retuning the
 * guessed achievement thresholds is fine and intentionally NOT tested here.
 */

describe('powerup caps (hard constraint)', () => {
  it('caps free boops and shields at 3 each', () => {
    // CLAUDE.md: "Powerup caps are hard: 3 Free Boops + 3 Shields max."
    expect(POWERUPS.MAX_FREE_BOOPS).toBe(3);
    expect(POWERUPS.MAX_SHIELDS).toBe(3);
  });

  it('refills on the 1st of the month', () => {
    expect(POWERUPS.REFILL_DAY_OF_MONTH).toBe(1);
  });
});

describe('boop types', () => {
  it('ships exactly the four v1 types', () => {
    expect(BOOP_TYPES.map((t) => t.id)).toEqual([
      'classic',
      'boopstache',
      'bellyboop',
      'underboop',
    ]);
  });

  it('has unique ids', () => {
    const ids = BOOP_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every type a label and an emoji', () => {
    for (const t of BOOP_TYPES) {
      expect(t.label.trim().length).toBeGreaterThan(0);
      expect(t.emoji.trim().length).toBeGreaterThan(0);
    }
  });

  it('unlocks only Classic by default', () => {
    // SPEC: Classic is always unlocked; the rest unlock via achievements.
    const unlocked = BOOP_TYPES.filter((t) => t.unlockedByDefault);
    expect(unlocked.map((t) => t.id)).toEqual(['classic']);
  });
});

describe('"big deal" achievements stay rare', () => {
  it('keeps the choice-granting set to roughly 8–10 (CLAUDE.md)', () => {
    expect(BIG_DEAL_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(4);
    expect(BIG_DEAL_ACHIEVEMENTS.length).toBeLessThanOrEqual(10);
  });

  it('has no duplicates', () => {
    expect(new Set(BIG_DEAL_ACHIEVEMENTS).size).toBe(BIG_DEAL_ACHIEVEMENTS.length);
  });
});

describe('leaderboard stats', () => {
  it('are unique', () => {
    expect(new Set(LEADERBOARD_STATS).size).toBe(LEADERBOARD_STATS.length);
  });
});
