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
- 2026-08-11 — Stack **confirmed**: Expo + Firebase. M0 scaffolded on a branch
  via PR (code changes now use the PR flow, unlike the planning docs).
- 2026-08-11 — M0 stack pinned to Expo SDK 52 (React Native 0.76, React 18.3.1)
  with React Navigation v7 (bottom tabs). TypeScript, `strict` on, `@/*` path
  alias → `src/*`. The single tuning file is `src/config/constants.ts`; its
  values are pulled from `docs/SPEC.md` (week-one thresholds are still the
  guessed numbers, to be retuned after M1–M3).
- 2026-08-11 — Switched to committing **straight to `main`** (no branches, no
  PRs); solo project, Matt's call. Earlier planning-doc note about a PR flow no
  longer applies.
- 2026-08-11 — M1 built on fake data. Three-tap flow is a modal over Home
  (`src/features/boop/`), boops stored in an in-memory context
  (`src/state/BoopLog.tsx`). Added `expo-haptics` + `expo-image-picker`.
  Decision: the optional photo is offered on the **finish screen**, not as a
  step between pick-type and finish, so the three-tap core loop stays exactly
  three taps. In M1 all four v1 boop types are selectable (no achievement
  engine yet); M4 will lock Boopstache/Bellyboop/Underboop per
  `unlockedByDefault`.
- 2026-08-13 — M1 playtested (Matt + Frankie): three-tap loop validated (fast,
  type-picking fun, locked slots + finish moment land). Only friction: adding a
  brand-new person mid-boop (typing a name) is too slow. Direction: people
  should be pre-loaded so mid-boop is a tap, not typing — import phone contacts
  (M2 candidate) and voice-add (deferred). Logged in `docs/BACKLOG.md` →
  "Adding people" and folded into the M2 plan in `HANDOFF.md`.
- 2026-08-13 — Gave each boop type an `emoji` (config field, one place to tune),
  shown on the type cards and the finish screen — a small kid-facing delight on
  the type-picking beat Frankie liked most. Not the M7.5 juice pass; just
  content. A constants test asserts every type has a label + emoji.
- 2026-08-13 — Added an **Undo** on the finish screen (deletes the just-recorded
  boop, `removeBoop`), prompted by persistence: an accidental boop now sticks, so
  an immediate undo matters. Deliberately kept to the finish moment; a way to
  edit/delete *older* boops is an open question because there's no boop list to
  delete from (the no-feed constraint) — logged in `docs/BACKLOG.md`.
- 2026-08-13 — Added local persistence (`@react-native-async-storage/async-storage`)
  so boops + people survive a reload, making a week-long family playtest usable
  before M2. Generic `usePersistentState(key, initial)` hook (hydrate-then-write,
  with a guard so the initial value never clobbers stored data) backs both
  `BoopLog` and `People`; keys namespaced `booptracker:*`. Also added
  `removePerson` + an ✕ on the Friends tab (it was add-only). This is a local
  cache; M2 makes Firestore the source of truth and this becomes offline cache
  (or gets replaced).
- 2026-08-13 — Contacts import built on the fake-data build (the M1 friction
  fix, pulled ahead of M2). Uses `expo-contacts` **native single-contact
  picker** (`presentContactPickerAsync`) — deliberately not reading the whole
  address book, for privacy and to skip the "allow all contacts" gate. People
  now live in `src/state/People.tsx` (in-memory, seeded from `FAKE_FRIENDS`);
  the Friends tab became a real add-people screen. Pure logic in
  `src/state/contactsCore.ts`, unit-tested. Bulk/read-all import stays a later
  option if single-pick proves too slow for loading many people.
- 2026-08-13 — Upgraded Expo SDK 52 → **54** (RN 0.76→0.81, React 18.3→19.1,
  TypeScript 5.9). Reason: Expo Go on the App Store only ships the *latest* SDK,
  so an SDK 52 project can't open in Expo Go on a real device (it errored with
  "Project is incompatible"). This is a standing constraint — when Expo cuts a
  new SDK, bump the project to match before the next on-device playtest.
  `babel-preset-expo` is now a direct devDependency (it's a peer dep in SDK 54,
  no longer auto-installed); dropped `react-test-renderer` (deprecated in React
  19, and the tests are pure logic). Exact versions come from
  `node_modules/expo/bundledNativeModules.json` since the Expo version API isn't
  reachable from the build sandbox.

## Open questions still to settle

Tracked in full in `docs/BACKLOG.md` ("Open Questions") and the bottom of
`docs/ACHIEVEMENTS.md` ("Still To Decide"). The ones that block building:

- Boop-type unlock order / prerequisites beyond the v1 four.
- Region detection for leaderboards (backlog, not v1).
- Confirm Expo + Firebase is the chosen stack before M0 scaffolding.
