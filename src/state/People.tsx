import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
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
import type { Person } from '@/data/fakeFriends';
import { db } from '@/firebase/app';

/**
 * People — the signed-in user's list of who they can boop, stored in Firestore
 * under `users/{uid}/people` and kept live with onSnapshot. Grown by importing
 * from the phone's Contacts (and typed guests). M2 replaced the old local /
 * fake-seeded list with this per-account cloud list.
 */
/** Result of an add-by-username attempt, for showing UI feedback. */
export type AddByUsernameResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

interface PeopleValue {
  people: Person[];
  addPeople: (incoming: Person[]) => void;
  removePerson: (id: string) => void;
  addByUsername: (username: string) => Promise<AddByUsernameResult>;
}

const PeopleContext = createContext<PeopleValue | null>(null);

/** Firestore doc ids can't contain '/' (and we avoid whitespace); keep the
 * source id otherwise so re-importing the same contact dedupes. */
function personDocId(sourceId: string): string {
  return sourceId.replace(/[/\s#?%]+/g, '_');
}

export function PeopleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    if (!uid) {
      setPeople([]);
      return;
    }
    const col = collection(db, 'users', uid, 'people');
    return onSnapshot(col, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Person, 'id'>) }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setPeople(list);
    });
  }, [uid]);

  const addPeople = useCallback(
    (incoming: Person[]) => {
      if (!uid) return;
      for (const p of incoming) {
        const id = personDocId(p.id);
        const data: Omit<Person, 'id'> = { name: p.name };
        if (p.relation) data.relation = p.relation;
        if (p.friendUid) data.friendUid = p.friendUid;
        void setDoc(doc(db, 'users', uid, 'people', id), data).catch(() => {});
      }
    },
    [uid],
  );

  const addByUsername = useCallback(
    async (username: string): Promise<AddByUsernameResult> => {
      if (!uid) return { ok: false, error: 'Not signed in.' };
      const handle = username.trim();
      const handleLower = handle.toLowerCase();
      if (!handleLower) return { ok: false, error: 'Type a username first.' };
      try {
        const nameSnap = await getDoc(doc(db, 'usernames', handleLower));
        if (!nameSnap.exists()) {
          return { ok: false, error: `No one goes by “${handle}”.` };
        }
        const friendUid = (nameSnap.data() as { uid: string }).uid;
        if (friendUid === uid) return { ok: false, error: "That's you!" };

        // Use their canonical username (correct capitalization) for display.
        const profileSnap = await getDoc(doc(db, 'users', friendUid));
        const displayName =
          (profileSnap.data() as { username?: string } | undefined)?.username ?? handle;

        await setDoc(doc(db, 'users', uid, 'people', `app:${friendUid}`), {
          name: displayName,
          relation: 'Friend',
          friendUid,
        });
        return { ok: true, name: displayName };
      } catch {
        return { ok: false, error: 'Could not add them. Check your connection.' };
      }
    },
    [uid],
  );

  const removePerson = useCallback(
    (id: string) => {
      if (!uid) return;
      void deleteDoc(doc(db, 'users', uid, 'people', id)).catch(() => {});
    },
    [uid],
  );

  const value = useMemo<PeopleValue>(
    () => ({ people, addPeople, removePerson, addByUsername }),
    [people, addPeople, removePerson, addByUsername],
  );

  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>;
}

export function usePeople(): PeopleValue {
  const ctx = useContext(PeopleContext);
  if (!ctx) {
    throw new Error('usePeople must be used within a PeopleProvider');
  }
  return ctx;
}
