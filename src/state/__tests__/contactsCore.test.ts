import {
  contactDisplayName,
  contactToPerson,
  mergePeople,
} from '../contactsCore';
import type { Person } from '@/data/fakeFriends';

describe('contactDisplayName', () => {
  it('prefers the full name', () => {
    expect(contactDisplayName({ name: 'Grandma Jo', firstName: 'Jo' })).toBe('Grandma Jo');
  });

  it('falls back to first + last', () => {
    expect(contactDisplayName({ firstName: 'Sam', lastName: 'Rivera' })).toBe('Sam Rivera');
  });

  it('trims and tolerates missing pieces', () => {
    expect(contactDisplayName({ firstName: 'Alex' })).toBe('Alex');
    expect(contactDisplayName({ name: '   ' })).toBe('');
  });
});

describe('contactToPerson', () => {
  it('uses the contact id for a stable, dedupe-able person id', () => {
    expect(contactToPerson({ id: 'abc', name: 'Matt' })).toEqual({
      id: 'contact:abc',
      name: 'Matt',
    });
  });

  it('falls back to a name-based id when there is no contact id', () => {
    expect(contactToPerson({ name: 'Mom' })).toEqual({ id: 'contact:mom', name: 'Mom' });
  });

  it('returns null for a nameless contact', () => {
    expect(contactToPerson({ id: 'x' })).toBeNull();
    expect(contactToPerson({})).toBeNull();
  });
});

describe('mergePeople', () => {
  const a: Person = { id: 'a', name: 'A' };
  const b: Person = { id: 'b', name: 'B' };

  it('appends new people and skips ids already present', () => {
    const merged = mergePeople([a], [b, { id: 'a', name: 'A again' }]);
    expect(merged.map((p) => p.id)).toEqual(['a', 'b']);
    expect(merged.find((p) => p.id === 'a')?.name).toBe('A'); // original kept
  });

  it('does not mutate the existing array', () => {
    const existing = [a];
    mergePeople(existing, [b]);
    expect(existing).toHaveLength(1);
  });
});
