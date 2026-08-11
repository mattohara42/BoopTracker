# BoopTracker

Frankie's idea. A *boop* is when you pretend someone has something on their
shirt, they look down, and you boop their nose. BoopTracker keeps score — with
friends, leaderboards, and a whole lot of achievements.

**Not a social media app:** no feed, no scroll, no algorithm. You open it to
record a boop or check your score, then you leave.

Designed by Frankie (age 10) and Matt.

## Running the app (M0 skeleton)

The Expo/React Native skeleton is in place (milestone **M0**). To run it:

```bash
npm install
npm start        # then press i / a / w, or scan the QR with Expo Go
```

`npm run typecheck` runs the TypeScript check. So far there are three tabs —
Home (the BOOP button), Friends, and Leaderboard — with the Friends/Leaderboard
screens as placeholders until later milestones. Every tunable number lives in
[`src/config/constants.ts`](src/config/constants.ts).

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

## Stack

- Client: React Native / Expo (one codebase for iOS + Android) — **scaffolded (M0)**
- Backend: Firebase (Firestore, Cloud Functions, push notifications) — wired in M2
- Auth: username + email
