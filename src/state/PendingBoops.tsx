import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/auth/AuthContext';
import { db } from '@/firebase/app';
import type { BoopTypeId } from '@/config/constants';

/**
 * PendingBoops — boops where *I'm the one who got booped* and haven't confirmed
 * yet (M3a). Powers the "boops to confirm" card + modal. Confirm/deny writes
 * just the status fields on the boop; the booper sees the result live via their
 * own subscription (and a denied boop stops counting for them).
 *
 * Queried by `subjectUid == me` with status filtered client-side, so no
 * composite index is needed.
 */
export interface PendingBoop {
  id: string;
  booperName: string;
  boopType: BoopTypeId;
  at: number;
}

interface PendingBoopsValue {
  pending: PendingBoop[];
  /**
   * How many boops the player has RECEIVED that still count — pending +
   * confirmed (not denied, not shielded). Feeds the "Boop Received" achievement.
   * A pending boop counts immediately (M3a), so it's included here too.
   */
  timesBooped: number;
  /** False until the first Firestore snapshot lands (gates achievement seeding). */
  loaded: boolean;
  confirm: (boopId: string, typeConfirmed: boolean) => void;
  deny: (boopId: string) => void;
  /** Block an incoming boop with a Shield (M5): it happened but won't count. */
  shield: (boopId: string) => void;
}

const PendingBoopsContext = createContext<PendingBoopsValue | null>(null);

export function PendingBoopsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [pending, setPending] = useState<PendingBoop[]>([]);
  const [timesBooped, setTimesBooped] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setTimesBooped(0);
    if (!uid) {
      setPending([]);
      return;
    }
    const q = query(collection(db, 'boops'), where('subjectUid', '==', uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs
        .filter((d) => d.data().status === 'pending')
        .map((d) => {
          const data = d.data();
          const at = data.at as { toMillis?: () => number } | undefined;
          return {
            id: d.id,
            booperName: data.booperName ?? 'Someone',
            boopType: data.boopType as BoopTypeId,
            at: typeof at?.toMillis === 'function' ? at.toMillis() : Date.now(),
          };
        });
      list.sort((a, b) => b.at - a.at);
      setPending(list);
      // Received boops that still count (not denied, not shielded).
      setTimesBooped(
        snap.docs.filter((d) => {
          const s = d.data().status;
          return s !== 'denied' && s !== 'shielded';
        }).length,
      );
      setLoaded(true);
    });
  }, [uid]);

  const confirm = useCallback((boopId: string, typeConfirmed: boolean) => {
    void updateDoc(doc(db, 'boops', boopId), {
      status: 'confirmed',
      typeConfirmed,
      resolvedAt: serverTimestamp(),
    }).catch(() => {});
  }, []);

  const deny = useCallback((boopId: string) => {
    void updateDoc(doc(db, 'boops', boopId), {
      status: 'denied',
      resolvedAt: serverTimestamp(),
    }).catch(() => {});
  }, []);

  // Only 'status' + 'resolvedAt' change here, so the subject-update rule (which
  // allows status/typeConfirmed/resolvedAt) permits it — no rule change needed.
  const shield = useCallback((boopId: string) => {
    void updateDoc(doc(db, 'boops', boopId), {
      status: 'shielded',
      resolvedAt: serverTimestamp(),
    }).catch(() => {});
  }, []);

  const value = useMemo<PendingBoopsValue>(
    () => ({ pending, timesBooped, loaded, confirm, deny, shield }),
    [pending, timesBooped, loaded, confirm, deny, shield],
  );

  return <PendingBoopsContext.Provider value={value}>{children}</PendingBoopsContext.Provider>;
}

export function usePendingBoops(): PendingBoopsValue {
  const ctx = useContext(PendingBoopsContext);
  if (!ctx) {
    throw new Error('usePendingBoops must be used within a PendingBoopsProvider');
  }
  return ctx;
}
