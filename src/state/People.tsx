import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import { FAKE_FRIENDS, type Person } from '@/data/fakeFriends';

import { mergePeople } from './contactsCore';
import { storageKey } from './persistence';
import { usePersistentState } from './usePersistentState';

/**
 * People — the in-session list of who you can boop.
 *
 * Seeded from the hardcoded FAKE_FRIENDS (M1 has no backend) and grown by
 * importing from the phone's Contacts. Persisted locally so imports and
 * removals survive a reload; M2 replaces it with a real, persisted friends
 * list.
 */
const PEOPLE_KEY = storageKey('people');

interface PeopleValue {
  people: Person[];
  addPeople: (incoming: Person[]) => void;
  removePerson: (id: string) => void;
}

const PeopleContext = createContext<PeopleValue | null>(null);

export function PeopleProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = usePersistentState<Person[]>(PEOPLE_KEY, () => [
    ...FAKE_FRIENDS,
  ]);

  const addPeople = useCallback(
    (incoming: Person[]) => {
      setPeople((prev) => mergePeople(prev, incoming));
    },
    [setPeople],
  );

  const removePerson = useCallback(
    (id: string) => {
      setPeople((prev) => prev.filter((p) => p.id !== id));
    },
    [setPeople],
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
