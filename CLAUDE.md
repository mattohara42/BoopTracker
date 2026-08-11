# CLAUDE.md — BoopTracker working notes

Conventions, constraints, and an assumptions log for anyone (human or Claude)
picking up this repo. Read this first, then `HANDOFF.md` for current state.

## What this is

BoopTracker: a family app that keeps score of *boops* (pretend there's
something on someone's shirt, they look down, you boop their nose). Frankie
(age 10) and Matt's project. See `docs/SPEC.md` for the v1 scope and
`docs/BUILD_PLAN.md` for the milestone order.

## Hard constraints (do not violate without discussion)

- **Not social media.** No feed, no scroll, no algorithm. This is a permanent
  design constraint, not a v1 cut. Open → record a boop or check score → leave.
- **Three-tap core loop:** BOOP button → pick who → pick boop type. Speed
  matters. Picking the type stays a deliberate, fun step — don't optimize it
  away, but don't add friction either.
- **Boop type is self-reported, then confirmed** by the booped person. The app
  can only verify who/when/where and whether the other person confirmed — never
  *how* the boop was done.
- **Powerup caps are hard:** 3 Free Boops + 3 Shields max, no stockpiling,
  refill to full on the 1st of every month for everyone at once.
- **"Big deal" achievements stay rare** (~8–10 total). Only milestones and
  family/type unlocks grant the Free Boop / Shield choice; everything else is
  badge-only.

## Intended stack (per BUILD_PLAN — confirm before scaffolding)

- Client: React Native / Expo (one codebase, iOS + Android)
- Backend: Firebase — Firestore (data), Cloud Functions (achievement +
  validation logic), push notifications
- Auth: username + email at signup
- Email provider: TBD

> Not yet set up. M0 is the first code milestone. Confirm the stack is still
> Expo + Firebase before running `expo init`.

## Working conventions

- **One place to tune numbers.** Powerup caps, achievement thresholds, and any
  other tunable constant live in a single config object, not scattered through
  code. This is called out in M0 and matters because the SPEC says the week-one
  thresholds were guessed and will be retuned after M1–M3 are played (see the
  "Design gate before M4" note in BUILD_PLAN).
- **Build milestones in order.** M0 → M8. Each milestone should produce
  something Frankie can actually try, even if rough. Don't skip ahead.
- **Planning docs live in `docs/`.** SPEC / BUILD_PLAN / BACKLOG / ACHIEVEMENTS.
  Keep them the source of truth; update them when decisions change rather than
  letting code and docs drift.
- **Backlog is not a to-do list.** `docs/BACKLOG.md` is deliberately-deferred
  scope. Don't pull items into v1 without a decision. It also flags ideas that
  were explicitly rejected (e.g. "Boop a Stranger") — don't reintroduce those.

## Assumptions log

Record decisions and assumptions here as they're made, so the next session
doesn't re-litigate them.

- 2026-08-11 — Repo created (`mattohara42/BoopTracker`). Planning docs landed
  in `docs/`. No app code yet. Stack (Expo + Firebase) not yet confirmed for
  this build; treat as intended-but-unconfirmed.
- 2026-08-11 — Docs committed straight to `main` (fresh repo, planning only,
  no PR flow needed at this stage).

## Open questions still to settle

Tracked in full in `docs/BACKLOG.md` ("Open Questions") and the bottom of
`docs/ACHIEVEMENTS.md` ("Still To Decide"). The ones that block building:

- Boop-type unlock order / prerequisites beyond the v1 four.
- Region detection for leaderboards (backlog, not v1).
- Confirm Expo + Firebase is the chosen stack before M0 scaffolding.
