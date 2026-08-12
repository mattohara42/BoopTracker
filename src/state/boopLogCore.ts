import type { BoopTypeId } from '@/config/constants';

/**
 * boopLogCore — the pure logic behind the BoopLog, with no React in it.
 *
 * Keeping the reducers and derivations as plain functions makes them unit
 * testable without rendering, and makes the M2 swap (in-memory → Firestore)
 * a matter of changing *where* the Boop[] lives, not how it's shaped.
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

export interface BoopStats {
  totalBoops: number;
  uniquePeopleBooped: number;
}

/**
 * Build a Boop from user input. `now` and `rand` are injected so the id and
 * timestamp are deterministic in tests; callers in the app pass Date.now and
 * Math.random.
 */
export function createBoop(
  input: RecordBoopInput,
  now: number,
  rand: number,
): Boop {
  const suffix = Math.floor(rand * 1e8)
    .toString(36)
    .padStart(5, '0');
  return { ...input, id: `${now.toString(36)}-${suffix}`, at: now };
}

/** New boops go to the front so "recent" ordering falls out for free. */
export function prependBoop(boops: readonly Boop[], boop: Boop): Boop[] {
  return [boop, ...boops];
}

export function attachPhotoTo(
  boops: readonly Boop[],
  boopId: string,
  photoUri: string,
): Boop[] {
  return boops.map((b) => (b.id === boopId ? { ...b, photoUri } : b));
}

/** Distinct people, most-recently-booped first, deduped by personId. */
export function deriveRecentPeople(boops: readonly Boop[]): RecentPerson[] {
  const seen = new Set<string>();
  const recent: RecentPerson[] = [];
  for (const b of boops) {
    if (!seen.has(b.personId)) {
      seen.add(b.personId);
      recent.push({ id: b.personId, name: b.personName });
    }
  }
  return recent;
}

export function deriveStats(boops: readonly Boop[]): BoopStats {
  const unique = new Set(boops.map((b) => b.personId));
  return { totalBoops: boops.length, uniquePeopleBooped: unique.size };
}
