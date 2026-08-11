import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { BoopTypeId } from '@/config/constants';

/**
 * BoopLog — the M1 local "database".
 *
 * Everything lives in in-memory React state (no persistence, no backend). It
 * exists only so the three-tap flow has somewhere to write and the Home stats
 * have something real to count. M2 swaps this for Firestore; keeping the shape
 * small and boring makes that swap easy.
 */
export interface Boop {
  id: string;
  personId: string;
  personName: string;
  boopType: BoopTypeId;
  /** Camera-roll photo, attached optionally on the finish screen. */
  photoUri?: string;
  /** When it was recorded (epoch ms). */
  at: number;
}

export interface RecordBoopInput {
  personId: string;
  personName: string;
  boopType: BoopTypeId;
}

/** A person the player has booped before, most-recent first. */
export interface RecentPerson {
  id: string;
  name: string;
}

interface BoopLogValue {
  boops: Boop[];
  totalBoops: number;
  uniquePeopleBooped: number;
  recentPeople: RecentPerson[];
  recordBoop: (input: RecordBoopInput) => Boop;
  attachPhoto: (boopId: string, photoUri: string) => void;
}

const BoopLogContext = createContext<BoopLogValue | null>(null);

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function BoopLogProvider({ children }: { children: ReactNode }) {
  const [boops, setBoops] = useState<Boop[]>([]);

  const recordBoop = useCallback((input: RecordBoopInput): Boop => {
    const boop: Boop = { ...input, id: makeId(), at: Date.now() };
    setBoops((prev) => [boop, ...prev]);
    return boop;
  }, []);

  const attachPhoto = useCallback((boopId: string, photoUri: string) => {
    setBoops((prev) =>
      prev.map((b) => (b.id === boopId ? { ...b, photoUri } : b)),
    );
  }, []);

  const value = useMemo<BoopLogValue>(() => {
    const seen = new Set<string>();
    const recentPeople: RecentPerson[] = [];
    for (const b of boops) {
      if (!seen.has(b.personId)) {
        seen.add(b.personId);
        recentPeople.push({ id: b.personId, name: b.personName });
      }
    }
    return {
      boops,
      totalBoops: boops.length,
      uniquePeopleBooped: seen.size,
      recentPeople,
      recordBoop,
      attachPhoto,
    };
  }, [boops, recordBoop, attachPhoto]);

  return <BoopLogContext.Provider value={value}>{children}</BoopLogContext.Provider>;
}

export function useBoopLog(): BoopLogValue {
  const ctx = useContext(BoopLogContext);
  if (!ctx) {
    throw new Error('useBoopLog must be used within a BoopLogProvider');
  }
  return ctx;
}
