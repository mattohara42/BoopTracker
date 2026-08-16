import {
  collection,
  deleteDoc,
  doc,
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
interface PeopleValue {
  people: Person[];
  addPeople: (incoming: Person[]) => void;
  removePerson: (id: string) => void;
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
        const data = p.relation ? { name: p.name, relation: p.relation } : { name: p.name };
        void setDoc(doc(db, 'users', uid, 'people', id), data).catch(() => {});
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
    () => ({ people, addPeople, removePerson }),
    [people, addPeople, removePerson],
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
