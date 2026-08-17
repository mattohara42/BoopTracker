import { BOOP_TYPES } from '@/config/constants';

import {
  achievementUnlockedMessage,
  boopNudgeMessage,
} from '../pushCore';

describe('boopNudgeMessage', () => {
  it('names the booper and the boop type', () => {
    const msg = boopNudgeMessage('Frankie', 'boopstache');
    expect(msg.title).toContain('Frankie');
    const label = BOOP_TYPES.find((t) => t.id === 'boopstache')!.label;
    expect(msg.body).toContain(label);
  });

  it('falls back to "Someone" for a blank booper name', () => {
    expect(boopNudgeMessage('   ', 'classic').title).toContain('Someone');
  });

  it('falls back to a generic "boop" for an unknown type', () => {
    const msg = boopNudgeMessage('Matt', 'not-a-real-type');
    expect(msg.body).toContain('boop');
  });

  it('produces a title and body for every real boop type', () => {
    for (const t of BOOP_TYPES) {
      const msg = boopNudgeMessage('Matt', t.id);
      expect(msg.title.length).toBeGreaterThan(0);
      expect(msg.body).toContain(t.label);
    }
  });
});

describe('achievementUnlockedMessage', () => {
  it('includes the badge label', () => {
    const msg = achievementUnlockedMessage('Boop Collector');
    expect(msg.title).toContain('Achievement');
    expect(msg.body).toContain('Boop Collector');
  });
});
