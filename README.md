# BoopTracker

[![CI](https://github.com/mattohara42/BoopTracker/actions/workflows/ci.yml/badge.svg)](https://github.com/mattohara42/BoopTracker/actions/workflows/ci.yml)

Frankie's idea. A *boop* is when you pretend someone has something on their
shirt, they look down, and you boop their nose. BoopTracker keeps score — with
friends, leaderboards, and a whole lot of achievements.

**Not a social media app:** no feed, no scroll, no algorithm. You open it to
record a boop or check your score, then you leave.

Designed by Frankie (age 10) and Matt.

## Status

Working app running in **Expo Go**. Milestones **M0–M2 are done** and **M3
(verification) is in progress** — see [`HANDOFF.md`](HANDOFF.md) for the live
state and the next steps. What works today: accounts (username + email +
password), your people and boops synced to Firebase, adding friends by username,
the three-tap record flow, and **in-app boop confirmation** (the person you
booped confirms it; a denied boop stops counting).

## Running the app

```bash
npm install
cp .env.example .env     # then paste your Firebase web config — see .env.example
npm start                # scan the QR with Expo Go
```

`npm run typecheck` runs the TypeScript check and `npm test` runs the unit
tests. Every tunable number lives in
[`src/config/constants.ts`](src/config/constants.ts). Phone setup + what to look
for: [`docs/PLAYTEST.md`](docs/PLAYTEST.md). Firebase setup + data model:
[`docs/DATA_MODEL.md`](docs/DATA_MODEL.md).

## Planning docs

Start here:

- [`docs/SPEC.md`](docs/SPEC.md) — v1 scope: the core loop, verification,
  boop types, powerups, week-one achievements, and leaderboards.
- [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) — milestones M0–M8, meant to be
  built and tested in order.
- [`docs/BACKLOG.md`](docs/BACKLOG.md) — everything from the brainstorm that
  isn't in v1, plus open questions and cleanup notes.
- [`docs/ACHIEVEMENTS.md`](docs/ACHIEVEMENTS.md) — the full brainstormed
  achievements master list (~200 ideas).
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — Firestore schema + Firebase setup.
- [`docs/M3_PLAN.md`](docs/M3_PLAN.md) — the current milestone (verification).

## Stack

- Client: React Native / Expo (SDK 54) — one codebase for iOS + Android
- Backend: Firebase — Firestore (data). Cloud Functions drafted but dormant
  (M3b email nudge, deferred); Storage (M3c photos) optional/not wired
- Auth: Firebase Auth — username + email + password (own login each)
