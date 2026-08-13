import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import { load, save } from './persistence';

/**
 * useState that hydrates from AsyncStorage on mount and writes back on change.
 *
 * The `hydrated` guard matters: we must not save the initial value over stored
 * data before the load finishes, or the first render would wipe what's on disk.
 * So writes are held until hydration completes.
 */
export function usePersistentState<T>(
  key: string,
  initial: T | (() => T),
): readonly [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    load<T>(key).then((stored) => {
      if (!active) return;
      if (stored !== undefined) setState(stored);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    if (hydrated) save(key, state);
  }, [key, state, hydrated]);

  return [state, setState, hydrated] as const;
}
