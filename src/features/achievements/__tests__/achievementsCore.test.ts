import {
  WEEK_ONE_ACHIEVEMENTS,
  buildAchievementInput,
  evaluateAchievements,
  isBigDeal,
  newlyEarned,
  localDayIndex,
  localHourOf,
  type AchievementBoop,
  type AchievementInput,
} from '../achievementsCore';

/**
 * Test encoding: a boop's `at` is `day * 100 + hour` (e.g. 305 = day 3, 9am;
 * 121 = day 1, 9pm). We inject matching dayIndex/hourOf so the rules are tested
 * deterministically, independent of the runner's timezone.
 */
const dayIndex = (at: number) => Math.floor(at / 100);
const hourOf = (at: number) => at % 100;

function boop(overrides: Partial<AchievementBoop> = {}): AchievementBoop {
  return { personId: 'p1', boopType: 'classic', at: 100 /* day1 09:.. -> hour0 */, ...overrides };
}

function evaluate(
  boops: AchievementBoop[],
  extra: Partial<Omit<AchievementInput, 'boops' | 'dayIndex' | 'hourOf'>> = {},
) {
  return evaluateAchievements({
    boops,
    timesBooped: 0,
    friendsCount: 0,
    dayIndex,
    hourOf,
    ...extra,
  });
}

describe('the week-one set itself', () => {
  it('is exactly the 14 SPEC achievements with unique ids', () => {
    expect(WEEK_ONE_ACHIEVEMENTS).toHaveLength(14);
    const ids = WEEK_ONE_ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(14);
  });

  it('keeps "big deal" rare — only Boop Received and Boop Collector', () => {
    const bigDeal = WEEK_ONE_ACHIEVEMENTS.filter((a) => a.bigDeal).map((a) => a.id);
    expect(bigDeal).toEqual(['boop_received', 'boop_collector']);
    expect(isBigDeal('boop_received')).toBe(true);
    expect(isBigDeal('first_boop')).toBe(false);
  });
});

describe('nothing earned from nothing', () => {
  it('returns an empty list for a brand-new player', () => {
    expect(evaluate([])).toEqual([]);
  });
});

describe('total-boop milestones', () => {
  it('First Boop needs one boop', () => {
    expect(evaluate([boop()])).toContain('first_boop');
  });

  it('Classic Booper unlocks at exactly 5', () => {
    const four = Array.from({ length: 4 }, () => boop());
    const five = Array.from({ length: 5 }, () => boop());
    expect(evaluate(four)).not.toContain('classic_booper');
    expect(evaluate(five)).toContain('classic_booper');
  });

  it('Boop Collector unlocks at 10', () => {
    expect(evaluate(Array.from({ length: 10 }, () => boop()))).toContain('boop_collector');
  });

  it('does not count denied boops toward totals', () => {
    const boops = [
      ...Array.from({ length: 4 }, () => boop()),
      boop({ status: 'denied' }), // the "5th" is denied
    ];
    expect(evaluate(boops)).not.toContain('classic_booper');
  });

  it('does count a pending boop (counts immediately per M3a)', () => {
    const boops = [
      ...Array.from({ length: 4 }, () => boop()),
      boop({ status: 'pending' }),
    ];
    expect(evaluate(boops)).toContain('classic_booper');
  });
});

describe('Triple Threat (3 people in one day)', () => {
  it('earns it with 3 different people the same day', () => {
    const boops = [
      boop({ personId: 'a', at: 100 }),
      boop({ personId: 'b', at: 101 }),
      boop({ personId: 'c', at: 102 }),
    ];
    expect(evaluate(boops)).toContain('triple_threat');
  });

  it('does not earn it across different days', () => {
    const boops = [
      boop({ personId: 'a', at: 100 }),
      boop({ personId: 'b', at: 200 }),
      boop({ personId: 'c', at: 300 }),
    ];
    expect(evaluate(boops)).not.toContain('triple_threat');
  });

  it('does not count the same person three times', () => {
    const boops = [
      boop({ personId: 'a', at: 100 }),
      boop({ personId: 'a', at: 101 }),
      boop({ personId: 'a', at: 102 }),
    ];
    expect(evaluate(boops)).not.toContain('triple_threat');
  });
});

describe('Three Day Streak', () => {
  it('earns it on 3 consecutive days', () => {
    const boops = [boop({ at: 100 }), boop({ at: 200 }), boop({ at: 300 })];
    expect(evaluate(boops)).toContain('three_day_streak');
  });

  it('does not earn it with a gap (days 1, 2, 4)', () => {
    const boops = [boop({ at: 100 }), boop({ at: 200 }), boop({ at: 400 })];
    expect(evaluate(boops)).not.toContain('three_day_streak');
  });
});

describe('boop-type badges', () => {
  it('earns Boopstache when one is landed', () => {
    expect(evaluate([boop({ boopType: 'boopstache' })])).toContain('boopstache');
  });

  it('does not earn the type if the subject rejected it (typeConfirmed false)', () => {
    const boops = [boop({ boopType: 'bellyboop', typeConfirmed: false })];
    const earned = evaluate(boops);
    expect(earned).not.toContain('bellyboop');
    expect(earned).toContain('first_boop'); // it still counts as a boop
  });
});

describe('time-of-day badges (design-gate retune)', () => {
  it('Early Bird fires before 8am, not at 8', () => {
    expect(evaluate([boop({ at: 107 })])).toContain('early_bird'); // 7am
    expect(evaluate([boop({ at: 108 })])).not.toContain('early_bird'); // 8am
  });

  it('Night Owl fires at 9pm (21), not at 8pm — the moved threshold', () => {
    expect(evaluate([boop({ at: 121 })])).toContain('night_owl'); // 9pm
    expect(evaluate([boop({ at: 120 })])).not.toContain('night_owl'); // 8pm
  });
});

describe('context-based badges', () => {
  it('Friend Circle needs 5 friends', () => {
    expect(evaluate([boop()], { friendsCount: 4 })).not.toContain('friend_circle');
    expect(evaluate([boop()], { friendsCount: 5 })).toContain('friend_circle');
  });

  it('Boop Received needs to have been booped', () => {
    expect(evaluate([], { timesBooped: 1 })).toContain('boop_received');
  });
});

describe('sibling badges (relation-based)', () => {
  it('Sibling Boop for one sibling; Double Sibling for two', () => {
    const one = evaluate([boop({ personId: 'bro', relation: 'brother' })]);
    expect(one).toContain('sibling_boop');
    expect(one).not.toContain('double_sibling');

    const two = evaluate([
      boop({ personId: 'bro', relation: 'Brother' }), // case-insensitive
      boop({ personId: 'sis', relation: 'sister' }),
    ]);
    expect(two).toContain('sibling_boop');
    expect(two).toContain('double_sibling');
  });

  it('booping the same sibling twice is not Double Sibling', () => {
    const boops = [
      boop({ personId: 'bro', relation: 'brother', at: 100 }),
      boop({ personId: 'bro', relation: 'brother', at: 200 }),
    ];
    expect(evaluate(boops)).not.toContain('double_sibling');
  });

  it('a plain friend is not a sibling', () => {
    expect(evaluate([boop({ relation: 'Friend' })])).not.toContain('sibling_boop');
  });
});

describe('ordering and diffing', () => {
  it('returns earned ids in canonical order', () => {
    const boops = Array.from({ length: 10 }, () => boop());
    const earned = evaluate(boops, { friendsCount: 5 });
    const order = WEEK_ONE_ACHIEVEMENTS.map((a) => a.id).filter((id) => earned.includes(id));
    expect(earned).toEqual(order);
  });

  it('newlyEarned returns only the freshly-unlocked ones', () => {
    const input: AchievementInput = {
      boops: Array.from({ length: 5 }, () => boop()),
      timesBooped: 0,
      friendsCount: 0,
      dayIndex,
      hourOf,
    };
    // Already had First Boop; now also crossing 5 → Classic Booper is new.
    const fresh = newlyEarned(['first_boop'], input);
    expect(fresh).toContain('classic_booper');
    expect(fresh).not.toContain('first_boop');
  });
});

describe('buildAchievementInput (live-data join)', () => {
  it('joins each boop to its person relation', () => {
    const input = buildAchievementInput({
      givenBoops: [
        { personId: 'bro', boopType: 'classic', at: 100 },
        { personId: 'pal', boopType: 'classic', at: 101 },
      ],
      people: [
        { id: 'bro', relation: 'Brother' },
        { id: 'pal', relation: 'Friend' },
      ],
      timesBooped: 2,
      friendsCount: 3,
    });
    expect(input.boops.map((b) => b.relation)).toEqual(['Brother', 'Friend']);
    expect(input.timesBooped).toBe(2);
    expect(input.friendsCount).toBe(3);
  });

  it('leaves relation undefined for a person not in the list', () => {
    const input = buildAchievementInput({
      givenBoops: [{ personId: 'ghost', boopType: 'classic', at: 100 }],
      people: [],
      timesBooped: 0,
      friendsCount: 0,
    });
    expect(input.boops[0].relation).toBeUndefined();
  });

  it('feeds the evaluator so a joined sibling earns Sibling Boop', () => {
    const input = buildAchievementInput({
      givenBoops: [{ personId: 'sis', boopType: 'classic', at: 100 }],
      people: [{ id: 'sis', relation: 'Sister' }],
      timesBooped: 0,
      friendsCount: 0,
    });
    expect(evaluateAchievements({ ...input, dayIndex, hourOf })).toContain('sibling_boop');
  });

  it('carries status through so denied boops still drop out', () => {
    const input = buildAchievementInput({
      givenBoops: [{ personId: 'p', boopType: 'classic', at: 100, status: 'denied' }],
      people: [],
      timesBooped: 0,
      friendsCount: 0,
    });
    expect(evaluateAchievements({ ...input, dayIndex, hourOf })).not.toContain('first_boop');
  });
});

describe('default local encoders', () => {
  it('localDayIndex and localHourOf agree with a constructed date', () => {
    const d = new Date(2026, 7, 16, 21, 30); // Aug 16 2026, 9:30pm local
    expect(localHourOf(d.getTime())).toBe(21);
    // Same calendar day → same index; next day → +1.
    const next = new Date(2026, 7, 17, 1, 0);
    expect(localDayIndex(next.getTime()) - localDayIndex(d.getTime())).toBe(1);
  });
});
