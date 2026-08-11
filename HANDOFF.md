# HANDOFF — BoopTracker

Current state and how to pick up in a fresh session. Pair with `CLAUDE.md`
(conventions/constraints) and the `docs/` folder (the actual plan).

## Where we are (2026-08-11)

- **Repo created:** `mattohara42/BoopTracker`, private.
- **Planning docs landed** under `docs/`: `SPEC.md`, `BUILD_PLAN.md`,
  `BACKLOG.md`, `ACHIEVEMENTS.md`. `README.md` orients and links them.
- **No app code yet.** This is still the planning stage. M0 (repo skeleton) is
  the first code milestone and has not been started.

## What's done

- [x] Repo exists and is initialized.
- [x] Four planning docs committed to `main`.
- [x] README points at the docs and states the intended stack.
- [x] `CLAUDE.md` written (conventions + assumptions log).
- [x] This handoff doc.

## Decisions made so far

- Docs go in `docs/`; committed straight to `main` at this stage (fresh repo,
  planning only).
- Intended stack is Expo/React Native + Firebase — **not yet confirmed** for
  the build.

## Recommended next step: M0 (repo skeleton)

From `docs/BUILD_PLAN.md`:

1. Confirm the stack (Expo + Firebase) is still what we want.
2. `expo init` — React Native project.
3. Basic navigation: Home screen + placeholder Friends / Leaderboard screens.
4. A single config object for tunable constants (powerup caps, achievement
   thresholds) — one place to tune numbers. (`CLAUDE.md` explains why this
   matters.)
5. CLAUDE.md already exists — extend it as conventions solidify.

**Checkpoint at end of M1**, not M0: hand the boop-button flow to Frankie and
find out if three taps actually feels fast.

## Open questions before/around building

- **Stack confirmation** — Expo + Firebase? (blocks M0 scaffolding)
- **Boop-type unlock order / prerequisites** beyond the v1 four (blocks the
  achievements + unlock logic in M4).
- Full list in `docs/BACKLOG.md` → "Open Questions" and the end of
  `docs/ACHIEVEMENTS.md` → "Still To Decide".

## How to pick up in a new session

1. Start the session pointed at the `mattohara42/BoopTracker` repo so it's the
   primary working directory.
2. Read `CLAUDE.md`, then this file, then `docs/SPEC.md` + `docs/BUILD_PLAN.md`.
3. Confirm the stack, then begin M0.
