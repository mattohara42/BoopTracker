# HANDOFF — BoopTracker

Current state and how to pick up in a fresh session. Pair with `CLAUDE.md`
(conventions/constraints) and the `docs/` folder (the actual plan).

## Where we are (2026-08-11)

- **Repo created:** `mattohara42/BoopTracker`, private.
- **Planning docs landed** under `docs/`: `SPEC.md`, `BUILD_PLAN.md`,
  `BACKLOG.md`, `ACHIEVEMENTS.md`. `README.md` orients and links them.
- **M0 done:** Expo/React Native skeleton is scaffolded (see below). M1 (the
  boop button + three-tap flow, fake data) is next.

## What's done

- [x] Repo exists and is initialized.
- [x] Four planning docs committed to `main`.
- [x] README points at the docs and states the stack.
- [x] `CLAUDE.md` written (conventions + assumptions log).
- [x] This handoff doc.
- [x] **M0 — repo skeleton** (this branch):
  - Expo SDK 52 + React Native 0.76 + TypeScript (`strict`), `@/*` → `src/*`.
  - Bottom-tab navigation (React Navigation v7): Home / Friends / Leaderboard.
  - `HomeScreen` shows the BOOP button + placeholder stats (button is inert
    until M1). Friends / Leaderboard are labelled placeholders.
  - `src/config/constants.ts` — the single tuning file (powerup caps, boop
    types, week-one achievement thresholds, big-deal set, leaderboard stats),
    values sourced from `docs/SPEC.md`.
  - `npm run typecheck` passes; `npx expo config` loads. (expo-doctor's
    network-only checks fail in the sandbox — no outbound to api.expo.dev.)

## Decisions made so far

- Docs go in `docs/`; committed straight to `main` at the planning stage.
  Code changes (M0 onward) go through a branch + PR.
- Stack **confirmed**: Expo/React Native + Firebase. M0 scaffolds the Expo
  client; Firebase isn't wired until M2.

## Recommended next step: M1 (the boop button, fake data)

From `docs/BUILD_PLAN.md`:

1. Build the real three-tap flow on top of Home: BOOP → pick person (hardcoded
   fake friend list) → pick boop type (Classic + the locked Boopstache /
   Bellyboop / Underboop from `BOOP_TYPES`, greyed out).
2. Optional photo-attach step (camera roll, no in-app camera).
3. Finish screen: haptic buzz + confetti placeholder.
4. Everything in local state — no backend yet. The goal is the *feel*.

**Checkpoint at end of M1:** hand the boop-button flow to Frankie and find out
if three taps actually feels fast, and whether picking the type feels fun.

## Open questions before/around building

- **Boop-type unlock order / prerequisites** beyond the v1 four (blocks the
  achievements + unlock logic in M4).
- Full list in `docs/BACKLOG.md` → "Open Questions" and the end of
  `docs/ACHIEVEMENTS.md` → "Still To Decide".

## How to pick up in a new session

1. Start the session pointed at the `mattohara42/BoopTracker` repo so it's the
   primary working directory.
2. Read `CLAUDE.md`, then this file, then `docs/SPEC.md` + `docs/BUILD_PLAN.md`.
3. `npm install`, `npm start` to run the M0 skeleton, then begin M1.
