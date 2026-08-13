import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import {
  attachPhotoTo,
  createBoop,
  deriveRecentPeople,
  deriveStats,
  prependBoop,
  removeBoopById,
  type Boop,
  type RecentPerson,
  type RecordBoopInput,
} from './boopLogCore';
import { storageKey } from './persistence';
import { usePersistentState } from './usePersistentState';

// Re-exported so screens can keep importing these from '@/state/BoopLog'.
export type { Boop, RecentPerson, RecordBoopInput } from './boopLogCore';

/**
 * BoopLog — the M1 local "database".
 *
 * Everything lives in in-memory React state (no persistence, no backend). It
 * exists only so the three-tap flow has somewhere to write and the Home stats
 * have something real to count. The logic itself lives in `boopLogCore.ts`
 * (pure + unit-tested); this file just wires it to React state, persisted
 * locally so a playtest survives a reload. M2 swaps the storage for Firestore.
 */
const BOOPS_KEY = storageKey('boops');
interface BoopLogValue {
  boops: Boop[];
  totalBoops: number;
  uniquePeopleBooped: number;
  recentPeople: RecentPerson[];
  recordBoop: (input: RecordBoopInput) => Boop;
  attachPhoto: (boopId: string, photoUri: string) => void;
  removeBoop: (boopId: string) => void;
}

const BoopLogContext = createContext<BoopLogValue | null>(null);

export function BoopLogProvider({ children }: { children: ReactNode }) {
  const [boops, setBoops] = usePersistentState<Boop[]>(BOOPS_KEY, []);

  const recordBoop = useCallback(
    (input: RecordBoopInput): Boop => {
      const boop = createBoop(input, Date.now(), Math.random());
      setBoops((prev) => prependBoop(prev, boop));
      return boop;
    },
    [setBoops],
  );

  const attachPhoto = useCallback(
    (boopId: string, photoUri: string) => {
      setBoops((prev) => attachPhotoTo(prev, boopId, photoUri));
    },
    [setBoops],
  );

  const removeBoop = useCallback(
    (boopId: string) => {
      setBoops((prev) => removeBoopById(prev, boopId));
    },
    [setBoops],
  );

  const value = useMemo<BoopLogValue>(() => {
    const stats = deriveStats(boops);
    return {
      boops,
      totalBoops: stats.totalBoops,
      uniquePeopleBooped: stats.uniquePeopleBooped,
      recentPeople: deriveRecentPeople(boops),
      recordBoop,
      attachPhoto,
      removeBoop,
    };
  }, [boops, recordBoop, attachPhoto, removeBoop]);

  return <BoopLogContext.Provider value={value}>{children}</BoopLogContext.Provider>;
}

export function useBoopLog(): BoopLogValue {
  const ctx = useContext(BoopLogContext);
  if (!ctx) {
    throw new Error('useBoopLog must be used within a BoopLogProvider');
  }
  return ctx;
}
