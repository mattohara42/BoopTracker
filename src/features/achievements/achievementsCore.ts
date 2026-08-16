import {
  ACHIEVEMENT_THRESHOLDS,
  type BoopTypeId,
} from '@/config/constants';
import type { BoopStatus } from '@/state/boopLogCore';

/**
 * achievementsCore — the pure logic for M4's week-one achievements.
 *
 * Like `boopLogCore`, this is plain functions with no React and no Firestore,
 * so the 14 badge rules can be unit-tested exhaustively without a device. The
 * app layer (a later M4 slice) will feed it the player's boops + a bit of
 * context and diff the result against what's already unlocked to fire the
 * confetti/badge moment.
 *
 * Thresholds come from `@/config/constants` (the one place to tune numbers,
 * retuned at the M4 design gate — docs/M4_DESIGN_GATE.md). Nothing tunable
 * lives here.
 */

// ---------------------------------------------------------------------------
// The 14 week-one achievements (docs/SPEC.md → "Achievements (Week One set)")
// ---------------------------------------------------------------------------
export type WeekOneAchievementId =
  | 'first_boop'
  | 'boop_received'
  | 'classic_booper'
  | 'sibling_boop'
  | 'double_sibling'
  | 'triple_threat'
  | 'boopstache'
  | 'bellyboop'
  | 'underboop'
  | 'boop_collector'
  | 'three_day_streak'
  | 'friend_circle'
  | 'early_bird'
  | 'night_owl';

export interface WeekOneAchievement {
  id: WeekOneAchievementId;
  label: string;
  description: string;
  /**
   * "Big deal" achievements also grant the Free Boop / Shield choice (SPEC).
   * Kept deliberately rare — only two of the week-one set qualify.
   */
  bigDeal: boolean;
}

/**
 * The canonical list + copy, in display order. `evaluate()` returns earned ids
 * in this order, and the (later) achievements-list screen renders from here.
 */
export const WEEK_ONE_ACHIEVEMENTS: readonly WeekOneAchievement[] = [
  { id: 'first_boop', label: 'First Boop', description: 'Record your first boop ever.', bigDeal: false },
  { id: 'boop_received', label: 'Boop Received', description: 'Get booped for the first time.', bigDeal: true },
  { id: 'classic_booper', label: 'Classic Booper', description: `Reach ${ACHIEVEMENT_THRESHOLDS.CLASSIC_BOOPER_BOOPS} boops total.`, bigDeal: false },
  { id: 'sibling_boop', label: 'Sibling Boop', description: 'Boop your brother or sister.', bigDeal: false },
  { id: 'double_sibling', label: 'Double Sibling', description: 'Boop two of your siblings.', bigDeal: false },
  { id: 'triple_threat', label: 'Triple Threat', description: `Boop ${ACHIEVEMENT_THRESHOLDS.TRIPLE_THREAT_PEOPLE_PER_DAY} different people in one day.`, bigDeal: false },
  { id: 'boopstache', label: 'Boopstache', description: 'Land your first Boopstache.', bigDeal: false },
  { id: 'bellyboop', label: 'Bellyboop', description: 'Land your first Bellyboop.', bigDeal: false },
  { id: 'underboop', label: 'Underboop', description: 'Land your first Underboop.', bigDeal: false },
  { id: 'boop_collector', label: 'Boop Collector', description: `Reach ${ACHIEVEMENT_THRESHOLDS.BOOP_COLLECTOR_BOOPS} boops total.`, bigDeal: true },
  { id: 'three_day_streak', label: 'Three Day Streak', description: `Boop on ${ACHIEVEMENT_THRESHOLDS.STREAK_DAYS} different days in a row.`, bigDeal: false },
  { id: 'friend_circle', label: 'Friend Circle', description: `Add your first ${ACHIEVEMENT_THRESHOLDS.FRIEND_CIRCLE_FRIENDS} friends.`, bigDeal: false },
  { id: 'early_bird', label: 'Early Bird', description: `Boop someone before ${ACHIEVEMENT_THRESHOLDS.EARLY_BIRD_BEFORE_HOUR}am.`, bigDeal: false },
  { id: 'night_owl', label: 'Night Owl', description: 'Boop someone late at night.', bigDeal: false },
] as const;

/** Relation strings that count as a sibling for the sibling achievements. */
const SIBLING_RELATIONS = new Set(['brother', 'sister', 'sibling']);

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/**
 * A boop the player GAVE, reduced to just what the achievement rules read.
 * The app derives `relation` by joining the boop's person to the people list.
 */
export interface AchievementBoop {
  personId: string;
  boopType: BoopTypeId;
  /** When it was recorded (epoch ms). */
  at: number;
  status?: BoopStatus;
  /** Did the booped person reject the claimed type? (M3a "not that type".) */
  typeConfirmed?: boolean;
  /** The booped person's relation, if known ('brother', 'sister', …). */
  relation?: string;
}

export interface AchievementInput {
  /** Boops the player has given (booperUid == me). */
  boops: readonly AchievementBoop[];
  /** How many boops the player has RECEIVED that counted (for Boop Received). */
  timesBooped: number;
  /** Friends added (people with a friendUid). */
  friendsCount: number;
  /**
   * Local calendar-day index for a timestamp (integer; consecutive days differ
   * by 1). Injected for deterministic, timezone-independent tests; the app
   * passes the default below.
   */
  dayIndex?: (atMs: number) => number;
  /** Local hour-of-day 0–23 for a timestamp. Injected for the same reason. */
  hourOf?: (atMs: number) => number;
}

/** Default local-day index: days since the epoch in the device's timezone. */
export function localDayIndex(atMs: number): number {
  const d = new Date(atMs);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

/** Default local hour-of-day (0–23). */
export function localHourOf(atMs: number): number {
  return new Date(atMs).getHours();
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

/** A denied boop doesn't count — mirrors boopLogCore's `counted`. */
function counted(boops: readonly AchievementBoop[]): AchievementBoop[] {
  return boops.filter((b) => b.status !== 'denied');
}

/** Longest run of consecutive day-indices in a set (e.g. {1,2,3,5} → 3). */
function longestConsecutiveRun(days: ReadonlySet<number>): number {
  let best = 0;
  for (const day of days) {
    if (days.has(day - 1)) continue; // only start counting from a run's first day
    let len = 1;
    while (days.has(day + len)) len += 1;
    if (len > best) best = len;
  }
  return best;
}

/**
 * Which of the 14 week-one achievements the player has earned, given their
 * current boops + context. Pure and order-stable (returns ids in
 * `WEEK_ONE_ACHIEVEMENTS` order). Denied boops are excluded; a pending boop
 * counts (M3a "counts immediately, subtracted on denial").
 */
export function evaluateAchievements(input: AchievementInput): WeekOneAchievementId[] {
  const dayIndex = input.dayIndex ?? localDayIndex;
  const hourOf = input.hourOf ?? localHourOf;
  const boops = counted(input.boops);
  const T = ACHIEVEMENT_THRESHOLDS;

  const total = boops.length;

  // A boop "lands" a claimed type unless the subject rejected the type.
  const landed = (type: BoopTypeId) =>
    boops.some((b) => b.boopType === type && b.typeConfirmed !== false);

  // Distinct people booped per local day → the max in any single day.
  const perDay = new Map<number, Set<string>>();
  for (const b of boops) {
    const key = dayIndex(b.at);
    (perDay.get(key) ?? perDay.set(key, new Set()).get(key)!).add(b.personId);
  }
  const maxPeopleInADay = Math.max(0, ...[...perDay.values()].map((s) => s.size));

  const streak = longestConsecutiveRun(new Set(perDay.keys()));

  const siblingPeople = new Set(
    boops
      .filter((b) => b.relation && SIBLING_RELATIONS.has(b.relation.toLowerCase()))
      .map((b) => b.personId),
  );

  const earned: Record<WeekOneAchievementId, boolean> = {
    first_boop: total >= 1,
    boop_received: input.timesBooped >= 1,
    classic_booper: total >= T.CLASSIC_BOOPER_BOOPS,
    sibling_boop: siblingPeople.size >= 1,
    double_sibling: siblingPeople.size >= 2,
    triple_threat: maxPeopleInADay >= T.TRIPLE_THREAT_PEOPLE_PER_DAY,
    boopstache: landed('boopstache'),
    bellyboop: landed('bellyboop'),
    underboop: landed('underboop'),
    boop_collector: total >= T.BOOP_COLLECTOR_BOOPS,
    three_day_streak: streak >= T.STREAK_DAYS,
    friend_circle: input.friendsCount >= T.FRIEND_CIRCLE_FRIENDS,
    early_bird: boops.some((b) => hourOf(b.at) < T.EARLY_BIRD_BEFORE_HOUR),
    night_owl: boops.some((b) => hourOf(b.at) >= T.NIGHT_OWL_AFTER_HOUR),
  };

  return WEEK_ONE_ACHIEVEMENTS.filter((a) => earned[a.id]).map((a) => a.id);
}

/**
 * Achievements that are newly earned this time — the set to celebrate. Given
 * the ids already unlocked, returns the freshly-earned ones (order-stable).
 * Badges are kept once earned (M4 design gate), so this never "loses" any.
 */
export function newlyEarned(
  alreadyUnlocked: readonly WeekOneAchievementId[],
  input: AchievementInput,
): WeekOneAchievementId[] {
  const have = new Set(alreadyUnlocked);
  return evaluateAchievements(input).filter((id) => !have.has(id));
}

/** Whether an achievement grants the Free Boop / Shield choice (SPEC). */
export function isBigDeal(id: WeekOneAchievementId): boolean {
  return WEEK_ONE_ACHIEVEMENTS.find((a) => a.id === id)?.bigDeal ?? false;
}
