import type { BoopTypeId } from '@/config/constants';

/**
 * boopLogCore — the pure logic behind the BoopLog, with no React in it.
 *
 * Keeping the reducers and derivations as plain functions makes them unit
 * testable without rendering, and makes the M2 swap (in-memory → Firestore)
 * a matter of changing *where* the Boop[] lives, not how it's shaped.
 */

/**
 * A boop's verification state (M3).
 * - `pending`      — booped an app user; awaiting their confirm/deny.
 * - `confirmed`    — the booped person confirmed it.
 * - `denied`       — the booped person said it didn't happen (stops counting).
 * - `self_reported`— booped a non-app person; nothing to confirm (yet).
 */
export type BoopStatus = 'pending' | 'confirmed' | 'denied' | 'self_reported';

export interface Boop {
  id: string;
  personId: string;
  personName: string;
  boopType: BoopTypeId;
  /** Camera-roll photo, attached optionally on the finish screen. */
  photoUri?: string;
  /** When it was recorded (epoch ms). */
  at: number;
  /** The booped person's uid, when they're an app user (M3). */
  subjectUid?: string;
  status?: BoopStatus;
  /** Whether the booped person agreed it was the claimed type (M3). */
  typeConfirmed?: boolean;
}

/**
 * Our people-list ids for app-user friends look like `app:{uid}`. A boop's
 * `subjectUid` is derived from the picked person's id, so it works whether the
 * person was picked from the friends list or from "recent".
 */
export function subjectUidFromPersonId(personId: string): string | undefined {
  return personId.startsWith('app:') ? personId.slice(4) : undefined;
}

/** A denied boop doesn't count — filter those out before deriving anything. */
function counted(boops: readonly Boop[]): Boop[] {
  return boops.filter((b) => b.status !== 'denied');
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

/** Remove a boop by id (used by undo). No-op if the id isn't present. */
export function removeBoopById(boops: readonly Boop[], boopId: string): Boop[] {
  return boops.filter((b) => b.id !== boopId);
}

/** Distinct people, most-recently-booped first, deduped by personId. */
export function deriveRecentPeople(boops: readonly Boop[]): RecentPerson[] {
  const seen = new Set<string>();
  const recent: RecentPerson[] = [];
  for (const b of counted(boops)) {
    if (!seen.has(b.personId)) {
      seen.add(b.personId);
      recent.push({ id: b.personId, name: b.personName });
    }
  }
  return recent;
}

export function deriveStats(boops: readonly Boop[]): BoopStats {
  const active = counted(boops);
  const unique = new Set(active.map((b) => b.personId));
  return { totalBoops: active.length, uniquePeopleBooped: unique.size };
}
