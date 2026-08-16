import {
  addDoc,
  collection,
  deleteDoc,
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

import {
  deriveRecentPeople,
  deriveStats,
  subjectUidFromPersonId,
  type Boop,
  type RecentPerson,
  type RecordBoopInput,
} from './boopLogCore';

// Re-exported so screens can keep importing these from '@/state/BoopLog'.
export type { Boop, RecentPerson, RecordBoopInput } from './boopLogCore';

/**
 * BoopLog — the signed-in user's boops, stored in Firestore (`boops`, filtered
 * to `booperUid == me`) and kept live with onSnapshot. Derivations (stats,
 * recent people) stay in the pure, unit-tested `boopLogCore.ts`. M2 replaced
 * the old local store with this so a score follows the account across devices.
 *
 * We sort client-side (no orderBy in the query) so no composite index is
 * needed. `photoUri` is still a local device path for now; uploading photos to
 * Firebase Storage (so they load cross-device) is M3.
 */
interface BoopLogValue {
  boops: Boop[];
  totalBoops: number;
  uniquePeopleBooped: number;
  recentPeople: RecentPerson[];
  recordBoop: (input: RecordBoopInput) => Promise<Boop>;
  attachPhoto: (boopId: string, photoUri: string) => void;
  removeBoop: (boopId: string) => void;
}

const BoopLogContext = createContext<BoopLogValue | null>(null);

export function BoopLogProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? null;
  const [boops, setBoops] = useState<Boop[]>([]);

  useEffect(() => {
    if (!uid) {
      setBoops([]);
      return;
    }
    const q = query(collection(db, 'boops'), where('booperUid', '==', uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        const at = data.at as { toMillis?: () => number } | undefined;
        return {
          id: d.id,
          personId: data.personId,
          personName: data.personName,
          boopType: data.boopType,
          photoUri: data.photoUri,
          subjectUid: data.subjectUid,
          status: data.status,
          typeConfirmed: data.typeConfirmed,
          // `at` is null for a beat on a pending write; treat that as "now".
          at: typeof at?.toMillis === 'function' ? at.toMillis() : Date.now(),
        } as Boop;
      });
      list.sort((a, b) => b.at - a.at); // newest first
      setBoops(list);
    });
  }, [uid]);

  const recordBoop = useCallback(
    async (input: RecordBoopInput): Promise<Boop> => {
      if (!uid) throw new Error('Not signed in');
      // App-user boops start `pending` (they'll confirm); everyone else is
      // self-reported until a witness photo lands (M3c).
      const subjectUid = subjectUidFromPersonId(input.personId);
      const status = subjectUid ? 'pending' : 'self_reported';
      const ref = await addDoc(collection(db, 'boops'), {
        booperUid: uid,
        booperName: profile?.username ?? '',
        personId: input.personId,
        personName: input.personName,
        boopType: input.boopType,
        at: serverTimestamp(),
        status,
        ...(subjectUid ? { subjectUid } : {}),
      });
      return { id: ref.id, ...input, at: Date.now(), status, subjectUid };
    },
    [uid, profile],
  );

  const attachPhoto = useCallback((boopId: string, photoUri: string) => {
    void updateDoc(doc(db, 'boops', boopId), { photoUri }).catch(() => {});
  }, []);

  const removeBoop = useCallback((boopId: string) => {
    void deleteDoc(doc(db, 'boops', boopId)).catch(() => {});
  }, []);

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
