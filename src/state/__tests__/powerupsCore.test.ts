import { POWERUPS } from '@/config/constants';
import {
  applyMonthlyRefill,
  canSpend,
  count,
  grant,
  initialPowerups,
  monthKey,
  needsRefill,
  spend,
  type PowerupState,
} from '../powerupsCore';

const AUG = new Date(2026, 7, 16, 12).getTime(); // 2026-08
const SEP = new Date(2026, 8, 1, 9).getTime(); // 2026-09 (the 1st)

function state(over: Partial<PowerupState> = {}): PowerupState {
  return { freeBoops: 1, shields: 1, refillMonth: '2026-08', ...over };
}

describe('monthKey', () => {
  it('formats YYYY-MM with a zero-padded month', () => {
    expect(monthKey(new Date(2026, 0, 5).getTime())).toBe('2026-01');
    expect(monthKey(new Date(2026, 11, 31).getTime())).toBe('2026-12');
  });
});

describe('initialPowerups', () => {
  it('starts a new player topped up, keyed to this month', () => {
    const s = initialPowerups(AUG);
    expect(s.freeBoops).toBe(POWERUPS.MAX_FREE_BOOPS);
    expect(s.shields).toBe(POWERUPS.MAX_SHIELDS);
    expect(s.refillMonth).toBe('2026-08');
  });
});

describe('monthly refill (lazy, month-keyed)', () => {
  it('does nothing within the same month', () => {
    const s = state({ freeBoops: 0, shields: 2 });
    expect(needsRefill(s, AUG)).toBe(false);
    expect(applyMonthlyRefill(s, AUG)).toBe(s); // same reference, no change
  });

  it('tops both to full when a new month arrives', () => {
    const s = state({ freeBoops: 0, shields: 1 });
    expect(needsRefill(s, SEP)).toBe(true);
    const refilled = applyMonthlyRefill(s, SEP);
    expect(refilled.freeBoops).toBe(POWERUPS.MAX_FREE_BOOPS);
    expect(refilled.shields).toBe(POWERUPS.MAX_SHIELDS);
    expect(refilled.refillMonth).toBe('2026-09');
  });

  it('wastes unused slots at refill (no carry-over past the cap)', () => {
    // Even sitting at full, refill just re-tops to the cap — never above.
    const full = state({ freeBoops: POWERUPS.MAX_FREE_BOOPS, shields: POWERUPS.MAX_SHIELDS });
    const refilled = applyMonthlyRefill(full, SEP);
    expect(refilled.freeBoops).toBe(POWERUPS.MAX_FREE_BOOPS);
    expect(refilled.shields).toBe(POWERUPS.MAX_SHIELDS);
  });
});

describe('grant (big-deal reward)', () => {
  it('adds one of the chosen kind', () => {
    expect(grant(state({ freeBoops: 1 }), 'freeBoop').freeBoops).toBe(2);
    expect(grant(state({ shields: 0 }), 'shield').shields).toBe(1);
  });

  it('never exceeds the hard cap (no stockpiling)', () => {
    const full = state({ freeBoops: POWERUPS.MAX_FREE_BOOPS });
    expect(grant(full, 'freeBoop').freeBoops).toBe(POWERUPS.MAX_FREE_BOOPS);
  });

  it('leaves the other kind untouched', () => {
    expect(grant(state({ freeBoops: 1, shields: 2 }), 'freeBoop').shields).toBe(2);
  });
});

describe('spend', () => {
  it('removes one of a kind', () => {
    expect(spend(state({ shields: 2 }), 'shield')!.shields).toBe(1);
  });

  it('returns null when there are none to spend (never goes negative)', () => {
    expect(spend(state({ freeBoops: 0 }), 'freeBoop')).toBeNull();
    expect(canSpend(state({ freeBoops: 0 }), 'freeBoop')).toBe(false);
  });
});

describe('count / canSpend helpers', () => {
  it('read the right field per kind', () => {
    const s = state({ freeBoops: 3, shields: 0 });
    expect(count(s, 'freeBoop')).toBe(3);
    expect(count(s, 'shield')).toBe(0);
    expect(canSpend(s, 'freeBoop')).toBe(true);
    expect(canSpend(s, 'shield')).toBe(false);
  });
});
