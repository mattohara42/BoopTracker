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
  - Expo SDK 54 + React Native 0.81 + React 19 + TypeScript (`strict`),
    `@/*` → `src/*`. (Started on SDK 52; bumped to 54 on 2026-08-13 so the
    project opens in Expo Go, which only ships the latest SDK.)
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

## Checkpoint DONE: M1 playtested (2026-08-13, Matt + Frankie)

Verdict: **they love it.** Three taps feels fast, picking the boop type is fun,
the locked slots and the finish moment (buzz + confetti) all land. Core loop is
validated — no retune of the three-tap flow needed.

One real friction: adding a **brand-new** person mid-boop (the "Someone else…"
typed entry) takes too long — typing a name mid-flee kills the speed. Fix
direction: make sure people are already loaded so the mid-boop step is almost
always a tap, not typing. Two ideas from the session (details in
`docs/BACKLOG.md` → "Adding people"): **import phone contacts** (strong M2
candidate) and **add people up front by voice** (deferred/stretch).

**Fix built (on the fake-data build, ahead of M2):** contacts import via
`expo-contacts`. "📇 Pick from Contacts" in the boop flow and "Add from
Contacts" on the (now real) Friends tab both use the *native* single-contact
picker — no full-address-book access, no heavy permission gate. People live in
`src/state/People.tsx` (seeded from `FAKE_FRIENDS`, grown by imports, with
`removePerson` + an ✕ on the Friends tab); pure mapping/dedupe logic is in
`src/state/contactsCore.ts` and unit-tested. Voice-add still deferred.

**Local persistence added:** boops + people now survive a reload
(`@react-native-async-storage/async-storage`) via a generic `usePersistentState`
hook, so a week-long family playtest builds up instead of resetting to zero.
Per-device only; M2 makes Firebase the source of truth.

**Undo added:** the finish screen has an "Undo — that wasn't a boop" action
(`removeBoop`) so an accidental boop doesn't stick now that data persists.
Editing/deleting *older* boops is deferred (no boop list to delete from without
breaking the no-feed rule) — see `docs/BACKLOG.md`.

## In progress: M2 (real accounts and data)

Decision: **own login each** — username + email + password (Firebase Auth).
Using the **Firebase JS SDK** so it keeps running in Expo Go. Schema + setup
steps live in `docs/DATA_MODEL.md`.

- [x] **Auth foundation** (built, needs live testing once the project exists):
  - `src/firebase/app.ts` — init app/auth/firestore from `EXPO_PUBLIC_FIREBASE_*`
    env (`.env.example` committed, `.env` gitignored). RN auth persistence via
    AsyncStorage; Firestore auto long-polling.
  - `src/auth/` — `AuthContext` (signUp reserves a unique username in a
    transaction, signIn, signOut) + `AuthScreen` (signup/login form).
  - `App.tsx` gates: no config → `SetupNeededScreen`; signed out → `AuthScreen`;
    signed in → the app. Home shows the username + a Sign out.
  - Verified: typecheck, 28 tests, full Metro bundle (Firebase resolves under
    Metro, RN persistence path included).
- [x] **People in Firestore** — `src/state/People.tsx` now reads/writes
  `users/{uid}/people` live (onSnapshot); contacts import + remove still work.
  Fake-friend seeding dropped (real accounts start empty).
- [x] **Boops in Firestore** — `src/state/BoopLog.tsx` now reads/writes the
  `boops` collection (filtered to `booperUid == me`, sorted client-side so no
  index needed). `recordBoop` is async; the boop flow awaits it with a saving
  spinner + error alert. Undo/attach-photo/stats/recents all still work.
- [x] **Add friend by username** — Friends tab has an "Add a friend by
  username" field; `addByUsername` looks up `usernames/{lower}` → uid, stores a
  person doc `app:{uid}` with `friendUid`. Blocks self-add + missing handles.
- [ ] **Lock down Firestore rules** before real use (starts in test mode).
- [ ] **Photo upload to Storage** (M3) — `photoUri` is still a local path, so
  photos don't load cross-device yet.

> Firebase project exists; signup/login verified on device. People + boops now
> sync to the cloud — sign in on another phone and your data follows you.

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
