import {
  attachPhotoTo,
  createBoop,
  deriveRecentPeople,
  deriveStats,
  prependBoop,
  removeBoopById,
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
});
