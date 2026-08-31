# BoopTracker

[![CI](https://github.com/mattohara42/BoopTracker/actions/workflows/ci.yml/badge.svg)](https://github.com/mattohara42/BoopTracker/actions/workflows/ci.yml)

Frankie's idea. A *boop* is when you pretend someone has something on their
shirt, they look down, and you boop their nose. BoopTracker keeps score — with
friends, leaderboards, and a whole lot of achievements.

**Not a social media app:** no feed, no scroll, no algorithm. You open it to
record a boop or check your score, then you leave.

Designed by Frankie (age 10) and Matt.

## Status

Working app running in **Expo Go**. **M0–M6 plus the M7.5 juice pass are
built**; **M8 (playtest and fix)** is the current milestone — see
[`HANDOFF.md`](HANDOFF.md) for the live state and the next steps.

What works today: accounts (username + email + password), your people and boops
synced to Firebase, adding friends by username or from your phone contacts, the
three-tap record flow, **in-app boop confirmation** (the person you booped
confirms it; a denied boop stops counting), the boop-type **ladder**,
**achievements** with an Awards tab, **powerups** (Free Boops + Shields), and
**family/friend leaderboards**.

Two pieces are built but deliberately **dormant**: the M3b email nudge (verification
is in-app only) and M7 push (needs a dev build + a paid Firebase plan). Photo-as-proof
(M3c) isn't wired.

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
- [`docs/M3_PLAN.md`](docs/M3_PLAN.md) — the verification milestone (M3a shipped;
  M3b email deferred).
- [`docs/M4_DESIGN_GATE.md`](docs/M4_DESIGN_GATE.md) — the achievement/unlock
  decisions made with Frankie before M4.
- [`docs/M7_PLAN.md`](docs/M7_PLAN.md) — push notifications: what's built, and the
  checklist to activate it.
- [`docs/SECURITY_AND_HARDENING.md`](docs/SECURITY_AND_HARDENING.md) — Firestore
  rules review and what to fix before any public listing.
- [`docs/APP_STORE_SETUP.md`](docs/APP_STORE_SETUP.md) — TestFlight / Play
  distribution steps (planning only; dev stays on Expo Go).

## Stack

- Client: React Native / Expo (SDK 54) — one codebase for iOS + Android
- Backend: Firebase — Firestore (data). Cloud Functions drafted but dormant
  (M3b email nudge, deferred); Storage (M3c photos) optional/not wired
- Auth: Firebase Auth — username + email + password (own login each)
