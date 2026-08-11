/**
 * constants.ts — THE one place to tune numbers.
 *
 * Per CLAUDE.md ("One place to tune numbers") every tunable value in the game
 * lives here, not scattered through screens and logic. The SPEC warns that the
 * week-one achievement thresholds were *guessed* during brainstorming and will
 * be retuned once M1–M3 are actually played (see the "Design gate before M4"
 * note in docs/BUILD_PLAN.md). When that retune happens, it should be a diff to
 * this file and nothing else.
 *
 * Source of truth for these values: docs/SPEC.md and docs/ACHIEVEMENTS.md.
 * If you change a number here, check whether the docs need updating too — the
 * docs are meant to stay the source of truth (CLAUDE.md, "Planning docs").
 */

// ---------------------------------------------------------------------------
// Powerups  (SPEC.md → "Powerups")
// ---------------------------------------------------------------------------
// Hard caps. Do not raise these without a design discussion — CLAUDE.md lists
// the powerup caps as a hard constraint, not a tunable convenience.
export const POWERUPS = {
  /** Max Free Boops a player can hold at once. Hard cap, no stockpiling. */
  MAX_FREE_BOOPS: 3,
  /** Max Boop Shields a player can hold at once. Hard cap, no stockpiling. */
  MAX_SHIELDS: 3,
  /**
   * Everyone refills to full on this day of the month, all at once.
   * 1 = the 1st. Unused slots are wasted at refill (that's intentional — it
   * discourages hoarding).
   */
  REFILL_DAY_OF_MONTH: 1,
} as const;

// ---------------------------------------------------------------------------
// Boop types  (SPEC.md → "Boop Types")
// ---------------------------------------------------------------------------
// v1 ships four. `Classic` is always unlocked; the other three unlock via
// achievements. Locked types still render (greyed out with a lock) so players
// can see there's more to earn. Unlock *order / prerequisites* beyond these
// four is an open question (see CLAUDE.md / BACKLOG.md) — do not invent it here.
export type BoopTypeId = 'classic' | 'boopstache' | 'bellyboop' | 'underboop';

export interface BoopType {
  id: BoopTypeId;
  label: string;
  /** One-line description shown on the pick-a-type step. */
  blurb: string;
  /** Classic is always available; the rest start locked and unlock later. */
  unlockedByDefault: boolean;
}

export const BOOP_TYPES: readonly BoopType[] = [
  {
    id: 'classic',
    label: 'Classic Boop',
    blurb: 'The original. Finger to the nose.',
    unlockedByDefault: true,
  },
  {
    id: 'boopstache',
    label: 'Boopstache',
    blurb: 'Sideways finger under the nose.',
    unlockedByDefault: false,
  },
  {
    id: 'bellyboop',
    label: 'Bellyboop',
    blurb: 'Bellybutton boop.',
    unlockedByDefault: false,
  },
  {
    id: 'underboop',
    label: 'Underboop',
    blurb: 'Boop under a table.',
    unlockedByDefault: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Achievement thresholds  (SPEC.md → "Achievements (v1 scope: Week One set)")
// ---------------------------------------------------------------------------
// GUESSED NUMBERS. These are the values most likely to move after playtesting
// (M1–M3). Keeping them here means the retune is a one-file change.
export const ACHIEVEMENT_THRESHOLDS = {
  /** "Classic Booper" — total boops. */
  CLASSIC_BOOPER_BOOPS: 5,
  /** "Boop Collector" — total boops (also a "big deal" achievement). */
  BOOP_COLLECTOR_BOOPS: 10,
  /** "Triple Threat" — distinct people booped within a single day. */
  TRIPLE_THREAT_PEOPLE_PER_DAY: 3,
  /** "Three Day Streak" — consecutive days with at least one boop. */
  STREAK_DAYS: 3,
  /** "Friend Circle" — friends added. */
  FRIEND_CIRCLE_FRIENDS: 5,
  /** "Early Bird" — booped strictly before this hour (24h clock). */
  EARLY_BIRD_BEFORE_HOUR: 8, // before 8am
  /** "Night Owl" — booped at or after this hour (24h clock). */
  NIGHT_OWL_AFTER_HOUR: 22, // after 10pm
} as const;

// Post-week-one milestones. Not part of the week-one unlock set, but listed in
// SPEC as "big deal" achievements — kept here so the milestone rule has its
// numbers in one place when M4 wires them up.
export const MILESTONE_BOOPS = {
  FIFTY: 50,
  ONE_HUNDRED: 100,
} as const;

// ---------------------------------------------------------------------------
// "Big deal" achievements  (SPEC.md → "Big deal" achievements)
// ---------------------------------------------------------------------------
// Only these grant the Free Boop / Shield *choice*; everything else is
// badge-only. CLAUDE.md keeps this set deliberately rare (~8–10 in the whole
// game). Adding to this list is a design decision, not a tuning tweak.
export type AchievementId =
  | 'boop_received'
  | 'boop_collector'
  | 'reach_50'
  | 'reach_100'
  | 'unlock_boop_type_family'
  | 'win_monthly_leaderboard';

export const BIG_DEAL_ACHIEVEMENTS: readonly AchievementId[] = [
  'boop_received', // first time you get booped
  'boop_collector', // 10 boops
  'reach_50', // 50 boops
  'reach_100', // 100 boops
  'unlock_boop_type_family', // unlocking a new boop-type family
  'win_monthly_leaderboard', // winning a leaderboard for a full month
] as const;

// ---------------------------------------------------------------------------
// Leaderboards  (SPEC.md → "Leaderboards (v1 scope)")
// ---------------------------------------------------------------------------
// v1 is all-time only. Time-windowed views (week/month) are BACKLOG, not v1.
export type LeaderboardStat =
  | 'most_unique_people'
  | 'most_total_boops'
  | 'most_boops_received'
  | 'least_boops_received';

export const LEADERBOARD_STATS: readonly LeaderboardStat[] = [
  'most_unique_people',
  'most_total_boops',
  'most_boops_received',
  'least_boops_received',
] as const;
