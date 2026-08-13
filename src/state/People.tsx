import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { FAKE_FRIENDS, type Person } from '@/data/fakeFriends';

import { mergePeople } from './contactsCore';

/**
 * People — the in-session list of who you can boop.
 *
 * Seeded from the hardcoded FAKE_FRIENDS (M1 has no backend) and grown by
 * importing from the phone's Contacts. Like BoopLog, this is in-memory only and
 * resets on reload; M2 replaces it with a real, persisted friends list.
 */
interface PeopleValue {
  people: Person[];
  addPeople: (incoming: Person[]) => void;
}

const PeopleContext = createContext<PeopleValue | null>(null);

export function PeopleProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>(() => [...FAKE_FRIENDS]);

  const addPeople = useCallback((incoming: Person[]) => {
    setPeople((prev) => mergePeople(prev, incoming));
  }, []);

  const value = useMemo<PeopleValue>(() => ({ people, addPeople }), [people, addPeople]);

  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>;
}

export function usePeople(): PeopleValue {
  const ctx = useContext(PeopleContext);
  if (!ctx) {
    throw new Error('usePeople must be used within a PeopleProvider');
  }
  return ctx;
}
