import type { Person } from '@/data/fakeFriends';

/**
 * contactsCore — pure helpers for turning a device contact into one of our
 * `Person` records, with no `expo-contacts` import in here so it stays unit
 * testable. The native calls live in the screens that use it.
 */

/** The slice of an `expo-contacts` Contact we actually care about. */
export interface RawContact {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

/** Best display name for a contact, falling back to first + last. */
export function contactDisplayName(c: RawContact): string {
  if (c.name && c.name.trim()) return c.name.trim();
  return [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
}

/**
 * Map a raw contact to a Person, or null if it has no usable name. The id is
 * derived from the contact id when present (so re-picking the same contact
 * dedupes), otherwise from the name.
 */
export function contactToPerson(c: RawContact): Person | null {
  const name = contactDisplayName(c);
  if (!name) return null;
  const id = c.id ? `contact:${c.id}` : `contact:${name.toLowerCase()}`;
  return { id, name };
}

/** Append `incoming` people to `existing`, skipping ids already present. */
export function mergePeople(
  existing: readonly Person[],
  incoming: readonly Person[],
): Person[] {
  const seen = new Set(existing.map((p) => p.id));
  const result = [...existing];
  for (const p of incoming) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      result.push(p);
    }
  }
  return result;
}
