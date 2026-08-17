import { POWERUPS } from '@/config/constants';

/**
 * powerupsCore — the pure logic behind Powerups (M5), no React or Firebase.
 *
 * Two powerups, tracked separately (SPEC → "Powerups"):
 *  - FREE BOOP (offense): overrule a boop you recorded that was denied.
 *  - SHIELD   (defense): block an incoming boop from counting against you.
 *
 * Hard rules (also CLAUDE.md "Hard constraints"): hold at most 3 of each, no
 * stockpiling past the cap, and everyone refills to full on the 1st of the
 * month. The caps live in `constants.ts` (POWERUPS) — the one place to tune
 * numbers — so nothing tunable lives here.
 *
 * Refill is intentionally *month-keyed and lazy* rather than a scheduled Cloud
 * Function: we compute the current month key ("YYYY-MM") and, if it's newer than
 * the last one we refilled for, top both powerups back up to full. That keeps
 * v1 on Firebase's free Spark plan (a scheduled function needs Blaze) while
 * still matching "refill to full on the 1st" — each player refills the first
 * time they open the app in the new month. See CLAUDE.md assumptions log.
 */

export type PowerupKind = 'freeBoop' | 'shield';

export interface PowerupState {
  freeBoops: number;
  shields: number;
  /** The month ("YYYY-MM") we last refilled for. */
  refillMonth: string;
}

/** The month key ("YYYY-MM") for a timestamp, in the device's local time. */
export function monthKey(atMs: number): string {
  const d = new Date(atMs);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
}

/** A brand-new player starts topped up, keyed to the month they joined. */
export function initialPowerups(nowMs: number): PowerupState {
  return {
    freeBoops: POWERUPS.MAX_FREE_BOOPS,
    shields: POWERUPS.MAX_SHIELDS,
    refillMonth: monthKey(nowMs),
  };
}

/** Clamp a count into [0, cap] so a bug can never stockpile past the hard cap. */
function clamp(n: number, cap: number): number {
  return Math.max(0, Math.min(cap, n));
}

/**
 * Apply the monthly refill if we've crossed into a new month. Tops BOTH
 * powerups to full (unused slots are wasted — that's the point, it discourages
 * hoarding). No-op within the same month. Returns the same object shape; the
 * caller persists it only when `refillMonth` actually changed.
 */
export function applyMonthlyRefill(state: PowerupState, nowMs: number): PowerupState {
  const key = monthKey(nowMs);
  if (key === state.refillMonth) return state;
  return {
    freeBoops: POWERUPS.MAX_FREE_BOOPS,
    shields: POWERUPS.MAX_SHIELDS,
    refillMonth: key,
  };
}

/** Did a refill actually change anything? (So the provider only writes on change.) */
export function needsRefill(state: PowerupState, nowMs: number): boolean {
  return monthKey(nowMs) !== state.refillMonth;
}

const CAP: Record<PowerupKind, number> = {
  freeBoop: POWERUPS.MAX_FREE_BOOPS,
  shield: POWERUPS.MAX_SHIELDS,
};

const FIELD: Record<PowerupKind, keyof Pick<PowerupState, 'freeBoops' | 'shields'>> = {
  freeBoop: 'freeBoops',
  shield: 'shields',
};

/** How many of a kind the player holds. */
export function count(state: PowerupState, kind: PowerupKind): number {
  return state[FIELD[kind]];
}

/** Whether the player has at least one of a kind to spend. */
export function canSpend(state: PowerupState, kind: PowerupKind): boolean {
  return count(state, kind) > 0;
}

/**
 * Grant one powerup of the chosen kind (a "big deal" achievement reward),
 * clamped to the cap. Granting when already at the cap is a no-op — the reward
 * is simply wasted, consistent with the no-stockpiling rule.
 */
export function grant(state: PowerupState, kind: PowerupKind): PowerupState {
  const field = FIELD[kind];
  return { ...state, [field]: clamp(state[field] + 1, CAP[kind]) };
}

/**
 * Spend one powerup of a kind. Returns the new state, or `null` if there are
 * none to spend (the caller should have gated on `canSpend`, but this makes the
 * "can't go negative" rule total).
 */
export function spend(state: PowerupState, kind: PowerupKind): PowerupState | null {
  if (!canSpend(state, kind)) return null;
  const field = FIELD[kind];
  return { ...state, [field]: state[field] - 1 };
}
