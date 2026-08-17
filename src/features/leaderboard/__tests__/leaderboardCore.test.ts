import { PERSON_RELATIONS } from '@/config/constants';
import type { Person } from '@/data/fakeFriends';

import {
  FAMILY_RELATIONS,
  groupMemberUids,
  isAscending,
  isFamilyRelation,
  rankMembers,
  statValue,
  type MemberStats,
} from '../leaderboardCore';

function member(uid: string, over: Partial<MemberStats> = {}): MemberStats {
  return {
    uid,
    username: uid,
    totalBoops: 0,
    uniquePeopleBooped: 0,
    boopsReceived: 0,
    ...over,
  };
}

describe('family relations', () => {
  it('includes every relation except plain "Friend"', () => {
    expect(FAMILY_RELATIONS).not.toContain('Friend');
    for (const r of PERSON_RELATIONS) {
      expect(isFamilyRelation(r)).toBe(r !== 'Friend');
    }
  });

  it('is false for untagged / unknown relations', () => {
    expect(isFamilyRelation(undefined)).toBe(false);
    expect(isFamilyRelation('Nemesis')).toBe(false);
  });
});

describe('groupMemberUids', () => {
  const people: Person[] = [
    { id: 'app:a', name: 'Alex', relation: 'Brother', friendUid: 'a' },
    { id: 'app:b', name: 'Bea', relation: 'Friend', friendUid: 'b' },
    { id: 'app:c', name: 'Cy', relation: 'Cousin', friendUid: 'c' },
    { id: 'contact:d', name: 'Grandma (no account)', relation: 'Grandma' }, // no friendUid
    { id: 'app:e', name: 'Eve', friendUid: 'e' }, // app friend, untagged
  ];

  it('friends group = every app-account friend, regardless of relation', () => {
    expect(groupMemberUids(people, 'friends').sort()).toEqual(['a', 'b', 'c', 'e']);
  });

  it('family group = app friends tagged with a family relation only', () => {
    expect(groupMemberUids(people, 'family').sort()).toEqual(['a', 'c']);
  });

  it('never includes non-app people (no friendUid, so no stats doc)', () => {
    expect(groupMemberUids(people, 'friends')).not.toContain('contact:d');
    expect(groupMemberUids(people, 'family')).not.toContain('contact:d');
  });

  it('dedupes repeated friendUids', () => {
    const dupes: Person[] = [
      { id: 'app:a', name: 'Alex', friendUid: 'a' },
      { id: 'recent:a', name: 'Alex again', friendUid: 'a' },
    ];
    expect(groupMemberUids(dupes, 'friends')).toEqual(['a']);
  });
});

describe('statValue / direction', () => {
  const m = member('m', {
    totalBoops: 7,
    uniquePeopleBooped: 3,
    boopsReceived: 4,
  });

  it('maps each stat to the right number', () => {
    expect(statValue(m, 'most_total_boops')).toBe(7);
    expect(statValue(m, 'most_unique_people')).toBe(3);
    expect(statValue(m, 'most_boops_received')).toBe(4);
    expect(statValue(m, 'least_boops_received')).toBe(4);
  });

  it('only least_boops_received sorts ascending', () => {
    expect(isAscending('least_boops_received')).toBe(true);
    expect(isAscending('most_boops_received')).toBe(false);
    expect(isAscending('most_total_boops')).toBe(false);
    expect(isAscending('most_unique_people')).toBe(false);
  });
});

describe('rankMembers', () => {
  it('ranks most-wins stats high-to-low', () => {
    const rows = [
      member('low', { totalBoops: 1 }),
      member('high', { totalBoops: 9 }),
      member('mid', { totalBoops: 5 }),
    ];
    const ranked = rankMembers(rows, 'most_total_boops');
    expect(ranked.map((r) => r.uid)).toEqual(['high', 'mid', 'low']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(ranked.map((r) => r.value)).toEqual([9, 5, 1]);
  });

  it('ranks "least received" low-to-high (fewest is best)', () => {
    const rows = [
      member('shielded', { boopsReceived: 0 }),
      member('popular', { boopsReceived: 8 }),
      member('some', { boopsReceived: 3 }),
    ];
    const ranked = rankMembers(rows, 'least_boops_received');
    expect(ranked.map((r) => r.uid)).toEqual(['shielded', 'some', 'popular']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('gives tied players the same rank and skips the next (competition ranking)', () => {
    const rows = [
      member('anna', { totalBoops: 5 }),
      member('bram', { totalBoops: 5 }),
      member('cleo', { totalBoops: 2 }),
    ];
    const ranked = rankMembers(rows, 'most_total_boops');
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3]);
    // stable alphabetical order within the tie
    expect(ranked.map((r) => r.uid)).toEqual(['anna', 'bram', 'cleo']);
  });

  it('does not mutate the input array', () => {
    const rows = [member('a', { totalBoops: 1 }), member('b', { totalBoops: 2 })];
    const before = rows.map((r) => r.uid);
    rankMembers(rows, 'most_total_boops');
    expect(rows.map((r) => r.uid)).toEqual(before);
  });

  it('handles an empty group', () => {
    expect(rankMembers([], 'most_total_boops')).toEqual([]);
  });
});
