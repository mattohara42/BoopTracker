import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * persistence — a tiny JSON-over-AsyncStorage wrapper.
 *
 * M1 keeps everything local; this just stops it evaporating on reload so a
 * family playtest can build up over days. All calls swallow errors (storage can
 * be unavailable, e.g. on web) — losing local cache is never worth a crash.
 * M2 replaces this with Firestore as the source of truth.
 */

/** Namespaced so all app keys sort together and are easy to clear. */
export const storageKey = (name: string): string => `booptracker:${name}`;

export async function load<T>(key: string): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export async function save<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort cache; ignore write failures.
  }
}
