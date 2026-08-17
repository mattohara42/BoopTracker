import {
  boopTypeUnlockStates,
  boopTypesUnlockedBetween,
  isBoopTypeUnlocked,
  nextBoopTypeUnlock,
  unlockedBoopTypeIds,
} from '../boopTypesCore';
import { BOOP_TYPES } from '@/config/constants';

/**
 * The Ladder (docs/M4_DESIGN_GATE.md): Classic always on, Boopstache @5,
 * Bellyboop @10, Underboop @15. Thresholds come from constants; these tests
 * pin the unlock *behaviour* the picker relies on.
 */

const classic = BOOP_TYPES.find((t) => t.id === 'classic')!;
const boopstache = BOOP_TYPES.find((t) => t.id === 'boopstache')!;

describe('isBoopTypeUnlocked', () => {
  it('Classic is always unlocked, even at zero boops', () => {
    expect(isBoopTypeUnlocked(classic, 0)).toBe(true);
  });

  it('Boopstache unlocks at exactly 5 boops', () => {
    expect(isBoopTypeUnlocked(boopstache, 4)).toBe(false);
    expect(isBoopTypeUnlocked(boopstache, 5)).toBe(true);
    expect(isBoopTypeUnlocked(boopstache, 6)).toBe(true);
  });
});

describe('unlockedBoopTypeIds', () => {
  it('is just Classic on day one', () => {
    expect(unlockedBoopTypeIds(0)).toEqual(['classic']);
  });

  it('climbs the ladder 5 → 10 → 15', () => {
    expect(unlockedBoopTypeIds(5)).toEqual(['classic', 'boopstache']);
    expect(unlockedBoopTypeIds(10)).toEqual(['classic', 'boopstache', 'bellyboop']);
    expect(unlockedBoopTypeIds(15)).toEqual([
      'classic',
      'boopstache',
      'bellyboop',
      'underboop',
    ]);
  });
});

describe('boopTypeUnlockStates', () => {
  it('marks locked types with the count that unlocks them', () => {
    const states = boopTypeUnlockStates(0);
    expect(states.map((s) => s.unlocked)).toEqual([true, false, false, false]);
    const stache = states.find((s) => s.type.id === 'boopstache')!;
    expect(stache.unlockAtBoops).toBe(5);
  });

  it('preserves BOOP_TYPES display order', () => {
    expect(boopTypeUnlockStates(99).map((s) => s.type.id)).toEqual(
      BOOP_TYPES.map((t) => t.id),
    );
  });
});

describe('nextBoopTypeUnlock', () => {
  it('points at the nearest locked type with the remaining count', () => {
    expect(nextBoopTypeUnlock(0)).toMatchObject({
      type: { id: 'boopstache' },
      boopsRemaining: 5,
    });
    expect(nextBoopTypeUnlock(7)).toMatchObject({
      type: { id: 'bellyboop' },
      boopsRemaining: 3,
    });
  });

  it('is undefined once everything is unlocked', () => {
    expect(nextBoopTypeUnlock(15)).toBeUndefined();
  });
});

describe('boopTypesUnlockedBetween', () => {
  it('reports the single family crossed when totals step up', () => {
    expect(boopTypesUnlockedBetween(4, 5).map((t) => t.id)).toEqual(['boopstache']);
    expect(boopTypesUnlockedBetween(9, 10).map((t) => t.id)).toEqual(['bellyboop']);
  });

  it('reports nothing when no threshold is crossed', () => {
    expect(boopTypesUnlockedBetween(5, 6)).toEqual([]);
    expect(boopTypesUnlockedBetween(10, 9)).toEqual([]); // a denial dropping the total
  });

  it('can cross two families in one jump (e.g. a batch import)', () => {
    expect(boopTypesUnlockedBetween(4, 10).map((t) => t.id)).toEqual([
      'boopstache',
      'bellyboop',
    ]);
  });
});
