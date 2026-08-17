import {
  attachPhotoTo,
  createBoop,
  deriveDeniedBoops,
  deriveRecentPeople,
  deriveStats,
  prependBoop,
  removeBoopById,
  subjectUidFromPersonId,
  type Boop,
} from '../boopLogCore';

function boop(partial: Partial<Boop> & Pick<Boop, 'personId'>): Boop {
  return {
    id: partial.id ?? `id-${partial.personId}`,
    personName: partial.personName ?? partial.personId,
    boopType: partial.boopType ?? 'classic',
    at: partial.at ?? 0,
    photoUri: partial.photoUri,
    personId: partial.personId,
    status: partial.status,
    subjectUid: partial.subjectUid,
    typeConfirmed: partial.typeConfirmed,
  };
}

describe('createBoop', () => {
  it('stamps the timestamp and carries the input through', () => {
    const b = createBoop(
      { personId: 'matt', personName: 'Matt', boopType: 'boopstache' },
      1_700_000_000_000,
      0.5,
    );
    expect(b.at).toBe(1_700_000_000_000);
    expect(b.personId).toBe('matt');
    expect(b.personName).toBe('Matt');
    expect(b.boopType).toBe('boopstache');
    expect(b.photoUri).toBeUndefined();
  });

  it('gives different boops different ids at the same instant', () => {
    const now = 1_700_000_000_000;
    const a = createBoop({ personId: 'a', personName: 'A', boopType: 'classic' }, now, 0.1);
    const b = createBoop({ personId: 'b', personName: 'B', boopType: 'classic' }, now, 0.9);
    expect(a.id).not.toBe(b.id);
  });
});

describe('prependBoop', () => {
  it('puts the newest boop first and does not mutate the input', () => {
    const existing = [boop({ personId: 'a' })];
    const next = prependBoop(existing, boop({ personId: 'b' }));
    expect(next.map((x) => x.personId)).toEqual(['b', 'a']);
    expect(existing).toHaveLength(1); // original untouched
  });
});

describe('attachPhotoTo', () => {
  it('sets the photo on the matching boop only', () => {
    const boops = [boop({ personId: 'a', id: 'a1' }), boop({ personId: 'b', id: 'b1' })];
    const next = attachPhotoTo(boops, 'b1', 'file://pic.jpg');
    expect(next.find((x) => x.id === 'b1')?.photoUri).toBe('file://pic.jpg');
    expect(next.find((x) => x.id === 'a1')?.photoUri).toBeUndefined();
  });

  it('is a no-op when the id is unknown', () => {
    const boops = [boop({ personId: 'a', id: 'a1' })];
    expect(attachPhotoTo(boops, 'nope', 'x')).toEqual(boops);
  });
});

describe('removeBoopById', () => {
  it('drops the matching boop and leaves the rest', () => {
    const boops = [boop({ personId: 'a', id: 'a1' }), boop({ personId: 'b', id: 'b1' })];
    expect(removeBoopById(boops, 'a1').map((x) => x.id)).toEqual(['b1']);
  });

  it('is a no-op when the id is unknown, without mutating', () => {
    const boops = [boop({ personId: 'a', id: 'a1' })];
    expect(removeBoopById(boops, 'nope')).toEqual(boops);
    expect(boops).toHaveLength(1);
  });
});

describe('deriveRecentPeople', () => {
  it('dedupes by personId, keeping the most recent first', () => {
    // boops arrive newest-first (see prependBoop).
    const boops = [
      boop({ personId: 'sam', personName: 'Sam' }),
      boop({ personId: 'matt', personName: 'Matt' }),
      boop({ personId: 'sam', personName: 'Sam' }),
    ];
    expect(deriveRecentPeople(boops)).toEqual([
      { id: 'sam', name: 'Sam' },
      { id: 'matt', name: 'Matt' },
    ]);
  });

  it('is empty when there are no boops', () => {
    expect(deriveRecentPeople([])).toEqual([]);
  });
});

describe('deriveStats', () => {
  it('counts total boops and unique people separately', () => {
    const boops = [
      boop({ personId: 'sam' }),
      boop({ personId: 'sam' }),
      boop({ personId: 'matt' }),
    ];
    expect(deriveStats(boops)).toEqual({ totalBoops: 3, uniquePeopleBooped: 2 });
  });

  it('is all zeros with no boops', () => {
    expect(deriveStats([])).toEqual({ totalBoops: 0, uniquePeopleBooped: 0 });
  });

  it('excludes denied boops (they stop counting)', () => {
    const boops = [
      boop({ personId: 'sam', status: 'confirmed' }),
      boop({ personId: 'matt', status: 'denied' }),
      boop({ personId: 'jo', status: 'pending' }),
    ];
    // matt's denied boop drops from both the total and the unique count.
    expect(deriveStats(boops)).toEqual({ totalBoops: 2, uniquePeopleBooped: 2 });
    expect(deriveRecentPeople(boops).map((p) => p.id)).toEqual(['sam', 'jo']);
  });

  it('excludes shielded boops too (M5 — blocked, so they do not count)', () => {
    const boops = [
      boop({ personId: 'sam', status: 'confirmed' }),
      boop({ personId: 'matt', status: 'shielded' }),
    ];
    expect(deriveStats(boops)).toEqual({ totalBoops: 1, uniquePeopleBooped: 1 });
    expect(deriveRecentPeople(boops).map((p) => p.id)).toEqual(['sam']);
  });
});

describe('deriveDeniedBoops (M5 overrule candidates)', () => {
  it('returns only denied boops, not shielded or counting ones', () => {
    const boops = [
      boop({ personId: 'a', id: 'a1', status: 'confirmed' }),
      boop({ personId: 'b', id: 'b1', status: 'denied' }),
      boop({ personId: 'c', id: 'c1', status: 'shielded' }),
      boop({ personId: 'd', id: 'd1', status: 'pending' }),
    ];
    expect(deriveDeniedBoops(boops).map((x) => x.id)).toEqual(['b1']);
  });

  it('is empty when nothing was denied', () => {
    expect(deriveDeniedBoops([boop({ personId: 'a', status: 'confirmed' })])).toEqual([]);
  });
});

describe('subjectUidFromPersonId', () => {
  it('extracts the uid from an app-friend person id', () => {
    expect(subjectUidFromPersonId('app:abc123')).toBe('abc123');
  });

  it('returns undefined for contacts / guests / seed ids', () => {
    expect(subjectUidFromPersonId('contact:42')).toBeUndefined();
    expect(subjectUidFromPersonId('guest:mom')).toBeUndefined();
    expect(subjectUidFromPersonId('matt')).toBeUndefined();
  });
});
