import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { BOOP_TYPES, type BoopTypeId } from '@/config/constants';
import { useAuth } from '@/auth/AuthContext';
import {
  WEEK_ONE_ACHIEVEMENTS,
  buildAchievementInput,
  evaluateAchievements,
  type WeekOneAchievement,
  type WeekOneAchievementId,
} from '@/features/achievements/achievementsCore';
import { unlockedBoopTypeFamilies } from '@/features/boop/boopTypesCore';
import { useBoopLog } from '@/state/BoopLog';
import { usePendingBoops } from '@/state/PendingBoops';
import { usePeople } from '@/state/People';
import { usePersistentState } from '@/state/usePersistentState';
import { storageKey } from '@/state/persistence';

/**
 * Achievements — M4's live wiring (+ the M5 boop-type-family reward).
 *
 * Joins the player's given boops to their people (for `relation`), pulls
 * received-count + friends-count from the other providers, and runs the pure
 * `achievementsCore` evaluator over the result.
 *
 * Badges are *kept once earned* (M4 design gate): we persist the earned set as
 * a growing union so a later denial that drops a total below a threshold never
 * revokes a badge. The persisted union — not the live evaluation — is what the
 * Awards screen shows.
 *
 * Two things drive the `celebration` queue (the unlock moment, confetti):
 *  - a **badge** earned; the two "big deal" ones (Boop Received, Boop Collector)
 *    grant a Free Boop / Shield choice.
 *  - a **boop-type family** unlocked at 5/10/15 total boops — also a "big deal"
 *    per SPEC, so it grants a choice too. These deliberately *stack*: crossing
 *    10 boops fires Boop Collector *and* the Bellyboop unlock, i.e. two picks
 *    (Matt's call). We persist a grow-only set of families already granted so a
 *    denial that drops you below a threshold and back can't double-grant.
 *
 * Seeding is careful: the first time we have real data we adopt whatever's
 * already earned/unlocked *silently* (no confetti, no retroactive powerups), so
 * shipping to an account that already has boops doesn't fire a pile of
 * celebrations. Only things crossed *after* that baseline celebrate.
 *
 * Persistence is local (AsyncStorage), per-uid — consistent with the app's
 * existing local-cache pattern. Moving these sets to Firestore (so they follow
 * across devices) is a future improvement, not a v1 blocker.
 */

/** One entry in the unlock-celebration queue. */
export type CelebrationItem =
  | { kind: 'badge'; id: WeekOneAchievementId }
  | { kind: 'boopType'; id: BoopTypeId };

interface AchievementsValue {
  /** The canonical 14, in display order (for the Awards screen). */
  all: readonly WeekOneAchievement[];
  /** Ids the player has earned (kept forever), in canonical order. */
  unlocked: readonly WeekOneAchievementId[];
  /** Freshly-unlocked things awaiting their moment; oldest first. */
  celebration: readonly CelebrationItem[];
  /** Dismiss the front of the celebration queue once it's been shown. */
  dismissCelebration: () => void;
}

const AchievementsContext = createContext<AchievementsValue | null>(null);

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? 'anon';

  const { boops, totalBoops, loaded: boopsLoaded } = useBoopLog();
  const { people, loaded: peopleLoaded } = usePeople();
  const { timesBooped, loaded: pendingLoaded } = usePendingBoops();

  // The badges the player has earned so far, persisted per-account, grown-only.
  const [unlocked, setUnlocked, hydrated] = usePersistentState<WeekOneAchievementId[]>(
    storageKey(`achievements:${uid}`),
    [],
  );
  // The boop-type families we've already granted a powerup choice for.
  const [grantedFamilies, setGrantedFamilies, familiesHydrated] = usePersistentState<
    BoopTypeId[]
  >(storageKey(`boopTypeFamilies:${uid}`), []);
  const [celebration, setCelebration] = useState<CelebrationItem[]>([]);

  // Live evaluation from the current data (denials already drop out in-core).
  const earned = useMemo(() => {
    const input = buildAchievementInput({
      givenBoops: boops,
      people,
      timesBooped,
      // "Friends" = everyone in your people list (added contacts + app friends);
      // counting only app-accounts would leave a small family unable to reach 5.
      friendsCount: people.length,
    });
    return evaluateAchievements(input);
  }, [boops, people, timesBooped]);

  // Lockable boop-type families unlocked at the current total (Classic excluded).
  const families = useMemo(() => unlockedBoopTypeFamilies(totalBoops), [totalBoops]);

  const dataReady =
    boopsLoaded && peopleLoaded && pendingLoaded && hydrated && familiesHydrated;

  // Which uid we've already taken a silent baseline for. Resets on account swap.
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    if (!dataReady) return;

    if (seededFor.current !== uid) {
      // First real look at this account: adopt what's already earned/unlocked
      // quietly — no confetti and no retroactive powerups for history.
      seededFor.current = uid;
      setUnlocked((prev) => unionBadges(prev, earned));
      setGrantedFamilies((prev) => unionFamilies(prev, families));
      return;
    }

    const haveBadges = new Set(unlocked);
    const freshBadges = earned.filter((id) => !haveBadges.has(id));
    const haveFamilies = new Set(grantedFamilies);
    const freshFamilies = families.filter((id) => !haveFamilies.has(id));

    if (freshBadges.length === 0 && freshFamilies.length === 0) return;

    if (freshBadges.length > 0) setUnlocked((prev) => unionBadges(prev, earned));
    if (freshFamilies.length > 0) setGrantedFamilies((prev) => unionFamilies(prev, families));

    // Badges first, then the type-family unlock(s) — so at 10 boops you get the
    // Boop Collector pick, then the Bellyboop-unlocked pick.
    setCelebration((q) => [
      ...q,
      ...freshBadges.map((id): CelebrationItem => ({ kind: 'badge', id })),
      ...freshFamilies.map((id): CelebrationItem => ({ kind: 'boopType', id })),
    ]);
  }, [dataReady, uid, earned, families, unlocked, grantedFamilies, setUnlocked, setGrantedFamilies]);

  const dismissCelebration = useCallback(() => {
    setCelebration((q) => q.slice(1));
  }, []);

  const value = useMemo<AchievementsValue>(
    () => ({ all: WEEK_ONE_ACHIEVEMENTS, unlocked, celebration, dismissCelebration }),
    [unlocked, celebration, dismissCelebration],
  );

  return <AchievementsContext.Provider value={value}>{children}</AchievementsContext.Provider>;
}

/** Union of two badge-id lists, kept in canonical `WEEK_ONE_ACHIEVEMENTS` order. */
function unionBadges(
  a: readonly WeekOneAchievementId[],
  b: readonly WeekOneAchievementId[],
): WeekOneAchievementId[] {
  const have = new Set<WeekOneAchievementId>([...a, ...b]);
  return WEEK_ONE_ACHIEVEMENTS.filter((ach) => have.has(ach.id)).map((ach) => ach.id);
}

/** Union of two boop-type-id lists, kept in canonical `BOOP_TYPES` order. */
function unionFamilies(a: readonly BoopTypeId[], b: readonly BoopTypeId[]): BoopTypeId[] {
  const have = new Set<BoopTypeId>([...a, ...b]);
  return BOOP_TYPES.filter((t) => have.has(t.id)).map((t) => t.id);
}

export function useAchievements(): AchievementsValue {
  const ctx = useContext(AchievementsContext);
  if (!ctx) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return ctx;
}
