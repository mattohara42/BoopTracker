# HANDOFF — BoopTracker

Current state and how to pick up in a fresh session. Pair with `CLAUDE.md`
(conventions/constraints) and the `docs/` folder (the actual plan).

## Where we are (2026-08-11)

- **Repo created:** `mattohara42/BoopTracker`, private.
- **Planning docs landed** under `docs/`: `SPEC.md`, `BUILD_PLAN.md`,
  `BACKLOG.md`, `ACHIEVEMENTS.md`. `README.md` orients and links them.
- **M0 + M1 done:** Expo skeleton plus the working three-tap boop flow on fake
  data (see below). M2 (real accounts + Firestore) is next.

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
- [x] **M1 — the boop button (fake data)** (committed to `main`):
  - Three-tap flow as a modal over Home: **BOOP → pick who → pick type**, then
    a finish screen. Lives in `src/features/boop/` (`BoopFlow` + `steps/`).
  - Pick-who: recent people on top, hardcoded `FAKE_FRIENDS`, and "Someone
    else…" (typed name) for people not in the app.
  - Pick-type: all four v1 types tappable + greyed locked teaser slots. NOTE:
    achievement-gated locking (respecting `unlockedByDefault`) is deferred to
    M4 — see the comment in `steps/PickType.tsx`.
  - Finish: haptic buzz (`expo-haptics`) + confetti *placeholder* + optional
    camera-roll photo (`expo-image-picker`). The photo lives on the finish
    screen, not as its own step, to keep the three-tap core loop intact.
  - Boops are stored in `src/state/BoopLog.tsx` (in-memory React context); Home
    stats read from it live. No persistence — resets on reload, by design.
  - Verified with a full Metro bundle (`expo export`, 796 modules) + typecheck.
  - Hardening pass: boop-log logic extracted to pure `src/state/boopLogCore.ts`
    and unit-tested (jest-expo). `src/config/__tests__/constants.test.ts` guards
    the SPEC hard constraints (powerup caps = 3, one default-unlocked type,
    big-deal set stays rare). `npm test` — 17 tests. `docs/PLAYTEST.md` added.

## Decisions made so far

- Docs go in `docs/`; committed straight to `main` at the planning stage.
  Code changes now commit **straight to `main`** too (solo project, no PR flow).
- Stack **confirmed**: Expo/React Native + Firebase. M0/M1 build the Expo
  client on fake data; Firebase isn't wired until M2.
- Optional photo lives on the finish screen, not as its own step, to protect
  the three-tap core loop (CLAUDE.md hard constraint).

## Checkpoint due: hand M1 to Frankie

Before M2, the plan calls for a real playtest of the three-tap flow: is three
taps actually fast? Does picking the boop type feel fun or annoying? Retune
`src/config/constants.ts` / the flow based on what comes back.

## Recommended next step: M2 (real accounts and data)

From `docs/BUILD_PLAN.md`:

1. Firebase project + Firestore schema for users, boops, friendships.
2. Signup: username + email.
3. Friends list: add by username, "someone else" for non-app people (replaces
   `src/data/fakeFriends.ts`).
4. Boop recording writes to Firestore instead of the in-memory `BoopLog`; the
   recent-people list comes from real history.

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
