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

import { useAuth } from '@/auth/AuthContext';
import {
  WEEK_ONE_ACHIEVEMENTS,
  buildAchievementInput,
  evaluateAchievements,
  type WeekOneAchievement,
  type WeekOneAchievementId,
} from '@/features/achievements/achievementsCore';
import { useBoopLog } from '@/state/BoopLog';
import { usePendingBoops } from '@/state/PendingBoops';
import { usePeople } from '@/state/People';
import { usePersistentState } from '@/state/usePersistentState';
import { storageKey } from '@/state/persistence';

/**
 * Achievements — M4's live wiring. Joins the player's given boops to their
 * people (for `relation`), pulls received-count + friends-count from the other
 * providers, and runs the pure `achievementsCore` evaluator over the result.
 *
 * Badges are *kept once earned* (M4 design gate): we persist the earned set as
 * a growing union so a later denial that drops a total below a threshold never
 * revokes a badge. The persisted union — not the live evaluation — is what the
 * Awards screen shows.
 *
 * Newly-earned badges are pushed onto a `celebration` queue for the unlock
 * moment (confetti). Seeding is careful: the first time we have real data we
 * adopt whatever's already earned *silently* (no confetti for history), so
 * shipping M4 to an account that already has boops doesn't fire 10 celebrations
 * at once. Only badges earned *after* that baseline celebrate.
 *
 * Persistence is local (AsyncStorage), per-uid — consistent with the app's
 * existing local-cache pattern. Moving the earned set to Firestore (so badges
 * follow across devices) is a future improvement, not a v1 blocker.
 */
interface AchievementsValue {
  /** The canonical 14, in display order (for the Awards screen). */
  all: readonly WeekOneAchievement[];
  /** Ids the player has earned (kept forever), in canonical order. */
  unlocked: readonly WeekOneAchievementId[];
  /** Freshly-earned ids awaiting their unlock moment; oldest first. */
  celebration: readonly WeekOneAchievementId[];
  /** Dismiss the front of the celebration queue once it's been shown. */
  dismissCelebration: () => void;
}

const AchievementsContext = createContext<AchievementsValue | null>(null);

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? 'anon';

  const { boops, loaded: boopsLoaded } = useBoopLog();
  const { people, loaded: peopleLoaded } = usePeople();
  const { timesBooped, loaded: pendingLoaded } = usePendingBoops();

  // The set the player has earned so far, persisted per-account and grown-only.
  const [unlocked, setUnlocked, hydrated] = usePersistentState<WeekOneAchievementId[]>(
    storageKey(`achievements:${uid}`),
    [],
  );
  const [celebration, setCelebration] = useState<WeekOneAchievementId[]>([]);

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

  const dataReady = boopsLoaded && peopleLoaded && pendingLoaded && hydrated;

  // Which uid we've already taken a silent baseline for. Resets on account swap.
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    if (!dataReady) return;

    if (seededFor.current !== uid) {
      // First real look at this account: adopt what's already earned quietly.
      seededFor.current = uid;
      setUnlocked((prev) => unionInOrder(prev, earned));
      return;
    }

    const have = new Set(unlocked);
    const fresh = earned.filter((id) => !have.has(id));
    if (fresh.length > 0) {
      setUnlocked((prev) => unionInOrder(prev, earned));
      setCelebration((q) => [...q, ...fresh]);
    }
  }, [dataReady, uid, earned, unlocked, setUnlocked]);

  const dismissCelebration = useCallback(() => {
    setCelebration((q) => q.slice(1));
  }, []);

  const value = useMemo<AchievementsValue>(
    () => ({ all: WEEK_ONE_ACHIEVEMENTS, unlocked, celebration, dismissCelebration }),
    [unlocked, celebration, dismissCelebration],
  );

  return <AchievementsContext.Provider value={value}>{children}</AchievementsContext.Provider>;
}

/** Union of two id lists, kept in canonical `WEEK_ONE_ACHIEVEMENTS` order. */
function unionInOrder(
  a: readonly WeekOneAchievementId[],
  b: readonly WeekOneAchievementId[],
): WeekOneAchievementId[] {
  const have = new Set<WeekOneAchievementId>([...a, ...b]);
  return WEEK_ONE_ACHIEVEMENTS.filter((ach) => have.has(ach.id)).map((ach) => ach.id);
}

export function useAchievements(): AchievementsValue {
  const ctx = useContext(AchievementsContext);
  if (!ctx) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return ctx;
}
