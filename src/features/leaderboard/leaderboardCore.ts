import { PERSON_RELATIONS, type LeaderboardStat } from '@/config/constants';
import type { Person } from '@/data/fakeFriends';

/**
 * leaderboardCore — the pure logic behind the M6 leaderboards, no React or
 * Firebase in it (the `*Core.ts` pattern), so the ranking + grouping rules are
 * unit-testable without rendering or a network.
 *
 * v1 leaderboards are **all-time only** (SPEC: week/month views are BACKLOG) and
 * cover two groups — Family and Friends — over the four `LEADERBOARD_STATS`.
 *
 * How the data gets here without a Cloud Function: every player publishes a
 * small aggregate doc (`users/{uid}/public/stats`, see `StatsPublisher`). The
 * screen reads one tiny doc per group member and ranks them here. That keeps
 * reads cheap and, unlike reading everyone's raw boops, exposes only the three
 * aggregate numbers — which is why the rules widening M6 needs is a narrow
 * `users/{uid}/public/{doc}` read, not a boops read-scope blowout.
 */

export type LeaderboardGroup = 'family' | 'friends';

/**
 * Which tagged relations count as "family". Derived from the single source of
 * relations (`PERSON_RELATIONS`) minus the plain "Friend" tag, so adding a new
 * relation in constants automatically counts as family without a change here.
 */
export const FAMILY_RELATIONS: readonly string[] = PERSON_RELATIONS.filter(
  (r) => r !== 'Friend',
);

export function isFamilyRelation(relation?: string): boolean {
  return relation != null && FAMILY_RELATIONS.includes(relation);
}

/**
 * The app-account friends that belong in a group's leaderboard. The caller adds
 * *themselves* (a player is always in their own leaderboards), so this returns
 * only the others. Non-app people (contacts/guests, no `friendUid`) are excluded
 * — they have no account and so no stats doc to rank.
 */
export function groupMemberUids(
  people: readonly Person[],
  group: LeaderboardGroup,
): string[] {
  const uids = new Set<string>();
  for (const p of people) {
    if (!p.friendUid) continue;
    if (group === 'family' && !isFamilyRelation(p.relation)) continue;
    uids.add(p.friendUid);
  }
  return [...uids];
}

/** One player's published leaderboard numbers. */
export interface MemberStats {
  uid: string;
  username: string;
  totalBoops: number;
  uniquePeopleBooped: number;
  boopsReceived: number;
}

export interface RankedRow extends MemberStats {
  /** 1-based; tied players share a rank (competition ranking: 1, 2, 2, 4). */
  rank: number;
  /** The value of the stat this row is ranked by (for display). */
  value: number;
}

export function statValue(row: MemberStats, stat: LeaderboardStat): number {
  switch (stat) {
    case 'most_unique_people':
      return row.uniquePeopleBooped;
    case 'most_total_boops':
      return row.totalBoops;
    case 'most_boops_received':
    case 'least_boops_received':
      return row.boopsReceived;
  }
}

/** Only "least boops received" ranks ascending; every other stat is most-wins. */
export function isAscending(stat: LeaderboardStat): boolean {
  return stat === 'least_boops_received';
}

/**
 * Rank members by a stat. Ties share a rank (competition ranking); the display
 * order within a tie is a stable alphabetical fallback so the list doesn't
 * jitter between renders.
 */
export function rankMembers(
  rows: readonly MemberStats[],
  stat: LeaderboardStat,
): RankedRow[] {
  const asc = isAscending(stat);
  const sorted = [...rows].sort((a, b) => {
    const va = statValue(a, stat);
    const vb = statValue(b, stat);
    if (va !== vb) return asc ? va - vb : vb - va;
    return a.username.localeCompare(b.username);
  });

  let prevValue: number | null = null;
  let prevRank = 0;
  return sorted.map((row, i) => {
    const value = statValue(row, stat);
    const rank = prevValue !== null && value === prevValue ? prevRank : i + 1;
    prevValue = value;
    prevRank = rank;
    return { ...row, rank, value };
  });
}
