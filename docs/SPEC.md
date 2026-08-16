# Boop App - Spec (v1)

Frankie's idea. A Boop is when you pretend someone has something on their shirt, they
look down, you boop their nose. This app tracks boops, with friends, leaderboards,
and achievements. NOT a social media app: no feed, no scroll, no algorithm. You open
it to record a boop or check your score, then you leave.

Designed by Frankie (age 10, he/him) and Matt.

## Core Loop

Three taps to record a boop. Speed matters, you are usually fleeing the scene.

1. Home screen: just the big BOOP button. Shows your name, total boops, people
   booped. No feed.
2. Tap the button: pick who you booped. Recent people at top, plus "someone else"
   for people not in the app.
3. Pick which kind of boop it was (see Boop Types below). Unlocked types are
   tappable. Locked types show greyed out with a lock icon, visible but not usable,
   so you know there's more to unlock.
4. Optional: attach a photo, pulled from the camera roll (not taken in-app, see
   Photos below).
5. Finish: haptic buzz. If you unlocked an achievement, confetti falls and the
   badge appears. If it's a "big deal" achievement, you're offered a choice between
   a Free Boop or a Boop Shield (see Powerups below).

## Verification

- If the person you booped is in the app: they confirm the boop **in the app**
  (the "boops to confirm" list on Home). That's the proof. *(v1 deliberately
  skips the email nudge that would ping them to open the app — see the CLAUDE.md
  assumptions log. A push nudge is a later option, M7.)*
- If they're not in the app (a grandparent, someone without a phone): a photo of
  the two of you together is the proof instead.
- Photos are taken by a THIRD PERSON mid-boop, not a selfie taken after. Whoever
  takes the photo is a witness and can be tagged. Witness photos are stronger proof
  than anything self-reported.
- For claimed boop types (see Boop Types below) the booped person is asked to
  confirm the type when they open the app to confirm. If they say yes, it counts.

## Boop Types

The app can only automatically verify a few things: who, when, where, and whether
the other person confirmed. It cannot verify HOW you booped someone (a Boopstache
vs. a Ninja Boop). So boop type is self-reported by the booper and confirmed by the
person who got booped.

v1 ships with a small unlockable set, not the full ~40 from the brainstorm doc (see
BACKLOG.md for the rest):

- Classic Boop (default, always unlocked)
- Boopstache (sideways finger under the nose)
- Bellyboop (bellybutton boop)
- Underboop (boop under a table)

More types unlock as achievements are earned. Order/prerequisites: TBD, tracked as
an open question in BACKLOG.md.

## Powerups

Two powerups. One offense, one defense.

FREE BOOP: Lets you overrule someone who denied a boop confirmation you believe was
real. Can only be spent on a boop you already recorded that was already denied.
Deliberately NOT a way to record a boop that never happened, that would be
abusable.

BOOP SHIELD: Blocks the next incoming boop from counting against your record.

Rules:
- Hold up to 3 Free Boops and 3 Shields at once (6 total, tracked separately)
- Hard cap, no stockpiling past 3 of each
- Refill to full on the 1st of every month, for everyone at the same time
- Don't expire, but the cap discourages hoarding since unused slots are wasted at
  refill
- "Big deal" achievements (see Achievements below) let you CHOOSE one: a Free Boop
  or a Shield
- Whether shields/free boops can be gifted to another player: open question, not
  in v1

## Achievements (v1 scope: Week One set)

Full list of ~200 achievement ideas lives in BACKLOG.md. v1 ships only the ones a
new player could realistically unlock in their first week, so the app feels
rewarding immediately.

Regular achievements (badge only):
1. First Boop: record your first boop ever
2. Boop Received: get booped for the first time (this one offers the Free
   Boop/Shield choice, see below)
3. Classic Booper: 5 boops total
4. Sibling Boop: boop your brother or sister
5. Double Sibling: boop both your brother and sister
6. Triple Threat: boop 3 different people in one day
7. Boopstache: land your first Boopstache
8. Bellyboop: land your first Bellyboop
9. Underboop: land your first Underboop
10. Boop Collector: 10 boops total
11. Three Day Streak: boop on 3 different days in a row
12. Friend Circle: add your first 5 friends
13. Early Bird: boop someone before 8am
14. Night Owl: boop someone after 10pm

"Big deal" achievements (badge + choice of Free Boop or Shield):
- Boop Received (first time you get booped)
- Boop Collector (10 boops)
- Reaching 50 boops, 100 boops (post-week-one, included for the rule, not the
  week-one unlock set)
- Unlocking a new boop type family
- Winning a leaderboard for a full month

Rule for future achievements: milestones and family/type unlocks are "big deal"
(get the choice). Everything else is badge-only. This keeps the choice special,
somewhere around 8-10 in the whole game, not on every achievement.

## Leaderboards (v1 scope)

v1 ships:
- Family group leaderboard: most unique people booped, most total boops, most/least
  boops received
- Friend group leaderboard: same three stats
- All-time only (This Week / This Month views are BACKLOG, not v1)

Global and country/region leaderboards: BACKLOG, not v1.

## Tech Stack

- Client: React Native / Expo (one codebase for iOS and Android)
- Backend: Firebase (Firestore for data, Cloud Functions for achievement/validation
  logic, push notifications)
- Email: **not used in v1** — verification is in-app. An email/push nudge is
  deferred (a push nudge, M7, is the likelier path)
- Auth: username + email at signup

## Explicitly Out of Scope for v1

- No social feed, no scroll, no algorithm (permanent constraint, not just a v1 cut)
- Full 200-achievement list (BACKLOG)
- Hidden/mystery achievements (BACKLOG, needs its own design pass)
- Unlockable achievement chains beyond the basic boop-type unlocks (BACKLOG)
- Global/country/region leaderboards (BACKLOG)
- Time-windowed leaderboards, week/month views (BACKLOG)
- Gifting shields/free boops to other players (open question)
- Movie/show reference achievements, full Creative & Funny list (BACKLOG)
