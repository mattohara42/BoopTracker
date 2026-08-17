import { BOOP_TYPES, type BoopType, type BoopTypeId } from '@/config/constants';

/**
 * boopTypesCore — the pure logic for which boop types are unlocked (M4).
 *
 * Classic is always available; Boopstache / Bellyboop / Underboop start locked
 * and unlock by total-boops count — "the Ladder" Frankie chose at the M4 design
 * gate (docs/M4_DESIGN_GATE.md): Boopstache @5, Bellyboop @10, Underboop @15.
 * The thresholds themselves live on `BOOP_TYPES[].unlockAtBoops` in
 * `constants.ts` (one place to tune numbers); nothing tunable lives here.
 *
 * Like the other `*Core.ts` files this is plain functions with no React, so the
 * unlock rules can be unit-tested without a device. The PickType UI reads these
 * to grey out the still-locked types.
 */

/** A boop type plus whether the player can pick it yet, for the picker UI. */
export interface BoopTypeUnlock {
  type: BoopType;
  unlocked: boolean;
  /** For a still-locked type, the total-boops count that unlocks it. */
  unlockAtBoops?: number;
}

/**
 * Is this type pickable at the given total-boops count? Classic (and anything
 * flagged `unlockedByDefault`) is always on; a locked type needs its
 * `unlockAtBoops` threshold met. A locked type with no threshold stays locked.
 */
export function isBoopTypeUnlocked(type: BoopType, totalBoops: number): boolean {
  if (type.unlockedByDefault) return true;
  return type.unlockAtBoops !== undefined && totalBoops >= type.unlockAtBoops;
}

/** The ids the player can pick right now, in `BOOP_TYPES` order. */
export function unlockedBoopTypeIds(totalBoops: number): BoopTypeId[] {
  return BOOP_TYPES.filter((t) => isBoopTypeUnlocked(t, totalBoops)).map((t) => t.id);
}

/**
 * Every v1 type tagged with its unlock state at the given total, in display
 * order — what the picker renders (unlocked cards + greyed "unlock at N" cards).
 */
export function boopTypeUnlockStates(totalBoops: number): BoopTypeUnlock[] {
  return BOOP_TYPES.map((type) => {
    const unlocked = isBoopTypeUnlocked(type, totalBoops);
    return unlocked
      ? { type, unlocked }
      : { type, unlocked, unlockAtBoops: type.unlockAtBoops };
  });
}

/**
 * The next boop type about to unlock and how many more boops it needs — for the
 * "N more to unlock <type>" teaser. Undefined once everything is unlocked.
 */
export function nextBoopTypeUnlock(
  totalBoops: number,
): { type: BoopType; boopsRemaining: number } | undefined {
  const next = BOOP_TYPES.filter(
    (t) => !isBoopTypeUnlocked(t, totalBoops) && t.unlockAtBoops !== undefined,
  ).sort((a, b) => (a.unlockAtBoops ?? 0) - (b.unlockAtBoops ?? 0))[0];
  if (!next) return undefined;
  return { type: next, boopsRemaining: Math.max(0, next.unlockAtBoops! - totalBoops) };
}

/**
 * Whether crossing from `before` to `after` total boops unlocks a new type
 * family — the "big deal" moment (SPEC: unlocking a type family grants a
 * powerup choice). Returns the newly-unlocked types (usually 0 or 1).
 */
export function boopTypesUnlockedBetween(before: number, after: number): BoopType[] {
  if (after <= before) return [];
  return BOOP_TYPES.filter(
    (t) =>
      !t.unlockedByDefault &&
      t.unlockAtBoops !== undefined &&
      before < t.unlockAtBoops &&
      after >= t.unlockAtBoops,
  );
}
