# M4 Design Gate — retune before we build achievements

> **✅ RESOLVED 2026-08-16 (Matt + Frankie).** Decisions are recorded inline
> below and applied: `NIGHT_OWL_AFTER_HOUR` → 21 (9pm) and the boop-type unlock
> ladder (`unlockAtBoops` 5/10/15) are now in `src/config/constants.ts`. Every
> other threshold was approved as-is. This doc is kept as the record of *why*.

A decision worksheet for Matt + Frankie to fill in **before M4 is built**.
`docs/BUILD_PLAN.md` says the week-one achievement numbers were *guessed* during
brainstorming and should be confirmed once M1–M3 have actually been played — we
just played them, so now's the time.

**How to use this:** for each item, read the recommendation, then write the
answer on the `➡️ Decision:` line (Frankie gets a vote on all of it). When it's
filled in, hand it back and I'll turn every answer into a **one-file diff to
`src/config/constants.ts`** (plus wiring the boop-type unlock order into the M4
engine). Nothing here is built yet — this is the "measure twice" step.

Two things are being decided here:
1. **The numbers** on the 7 threshold-based achievements (Part 1).
2. **The boop-type unlock order** — the one open question that actually *blocks*
   M4 (Part 2), plus a couple of smaller M4 rules (Part 3).

---

## Part 1 — The week-one achievement numbers

There are **14 week-one achievements** (SPEC.md). 7 of them are just "did it
happen once" (First Boop, Boop Received, Sibling Boop, Double Sibling, and the
first Boopstache / Bellyboop / Underboop) — those have **no number to tune**.
The other 7 have a guessed threshold living in `constants.ts`:

| Achievement | What it counts | Guessed now | Constant | Might move because… | My rec |
|---|---|---|---|---|---|
| **Classic Booper** | total boops | **5** | `ACHIEVEMENT_THRESHOLDS.CLASSIC_BOOPER_BOOPS` | Should feel reachable on day 1. 5 might be too quick if Frankie boops a lot. | keep **5** (early win matters) |
| **Boop Collector** | total boops (also a "big deal" → Free Boop/Shield choice) | **10** | `BOOP_COLLECTOR_BOOPS` | First powerup reward — wants to feel earned but not distant. | keep **10** |
| **Triple Threat** | different people booped in one day | **3** | `TRIPLE_THREAT_PEOPLE_PER_DAY` | Depends how many people are usually around. | keep **3** |
| **Three Day Streak** | days in a row with ≥1 boop | **3** | `STREAK_DAYS` | 3 is gentle; could go to 5/7 if streaks feel too easy. | keep **3** for week-one |
| **Friend Circle** | friends added | **5** | `FRIEND_CIRCLE_FRIENDS` | Whole family may be <5 people — could be unreachable. **Check the real count.** | maybe **3** if the family is small |
| **Early Bird** | boop *before* this hour | **8** (before 8am) | `EARLY_BIRD_BEFORE_HOUR` | Is anyone up + booping that early on a school day? | keep **8**, revisit if never hit |
| **Night Owl** | boop *at/after* this hour | **22** (10pm) | `NIGHT_OWL_AFTER_HOUR` | Past a 10-year-old's bedtime? Maybe 20/21 (8–9pm). | consider **21** (9pm) |

For each, either "keep" or write a new number:

- Classic Booper (total boops) ➡️ **Decision:** ✅ keep **5**
- Boop Collector (total boops) ➡️ **Decision:** ✅ keep **10**
- Triple Threat (people/day) ➡️ **Decision:** ✅ keep **3**
- Three Day Streak (days) ➡️ **Decision:** ✅ keep **3**
- Friend Circle (friends) ➡️ **Decision:** ✅ keep **5**
- Early Bird (before hour) ➡️ **Decision:** ✅ keep **8** (before 8am)
- Night Owl (after hour) ➡️ **Decision:** ✏️ **21** (after 9pm) — moved earlier from 10pm

> Not tunable, but worth a look while we're here: the post-week-one milestones
> **50** and **100** boops (`MILESTONE_BOOPS`). Fine to leave for now.

---

## Part 2 — Boop-type unlock order  ⛔ *blocks M4*

v1 has 4 boop types. **Classic** is always unlocked; **Boopstache**, **Bellyboop**,
and **Underboop** start locked (greyed out with a lock, so you can see there's
more to earn). The open question: **what unlocks each one?** M4 can't grant them
without this answer.

The brainstorm sketch (ACHIEVEMENTS.md) was "unlock hand variations at 5 boops,
body variations at 10, trickier ones after specific achievements." Scaled down to
our 3 lockable types, here are three ways to go:

**Option A — Simple boop-count ladder (recommended)**
- Boopstache → unlocks at **5** total boops (rides on Classic Booper)
- Bellyboop → unlocks at **10** total boops (rides on Boop Collector)
- Underboop → unlocks at **15** total boops (or after a Three Day Streak)
- *Why:* dead simple, always makes progress, easy to explain to a kid.

**Option B — Earn-by-doing (achievement-gated)**
- Boopstache → after **Triple Threat** (boop 3 people in a day)
- Bellyboop → after **Three Day Streak**
- Underboop → after **Friend Circle** (5 friends)
- *Why:* more varied; nudges different behaviors. Riskier if one gate is hard.

**Option C — Frankie picks the order.** She decides which is coolest → unlocks
first, second, third, and we attach them to 5 / 10 / 15 boops.

➡️ **Decision (A / B / C + the specifics):** ✅ **Option A — the Ladder.**
Boopstache @5 total boops, Bellyboop @10, Underboop @15. Encoded as
`unlockAtBoops` on each locked type in `constants.ts`.

*Note:* whatever the order, unlocking a boop-type family is a **"big deal"**
achievement (gives the Free Boop / Shield choice) per SPEC — so the first unlock
here also hands out a powerup choice.

---

## Part 3 — Small M4 rules to lock down

These come from the "Still To Decide" list and affect how M4 is built:

**3a. Points, badges, or both?** SPEC currently says **badge-only**, with the
rare "big deal" ones also granting a Free Boop/Shield choice. Adding a points
score is a bigger design (and edges toward a leaderboard-y feel).
- ➡️ **Decision:** ✅ **badge-only** for v1 (SPEC default stands; not revisited).

**3b. Can an achievement be *lost*?** Boops can be denied after the fact (M3a).
So if you hit "Classic Booper" at 5 boops and one gets denied down to 4, does the
badge disappear?
- *Rec:* **once earned, kept** — taking a badge away feels bad and denials are
  rare. Simplest and kindest.
- ➡️ **Decision:** ✅ **keep once earned** — badges never disappear (Frankie's call).

**3c. Sibling / Double Sibling need to know who's a sibling.** Two of the 14
(Sibling Boop, Double Sibling) depend on a person's **relation**. The people
record already has an optional `relation` field — but nothing sets it yet. For
M4 to grant these, we'll need a quick way to mark a friend as "brother/sister"
(and family) when adding them.
- ➡️ **Decision:** ✅ **add a relation picker in M4** (build it as part of M4 so
  these two achievements can be granted).

---

## What happens after this is filled in

1. I apply Part 1 as a **single diff to `src/config/constants.ts`** (that's the
   whole point of the "one place to tune numbers" rule — the retune is one file).
2. Part 2's unlock order gets encoded next to the boop types so the M4 engine can
   grant them.
3. Parts 3a–3c become small notes in the M4 build (`BUILD_PLAN.md` M4) so we build
   to the decisions, not around them.
4. Then M4 proper: the Cloud Function(s) that evaluate these 14 against boop
   history, the badge/confetti unlock on the finish screen, and the "big deal"
   Free Boop / Shield choice screen.

*Source of truth for the numbers stays `constants.ts`; this doc records the
reasoning behind the values so the next session doesn't re-litigate them.*
