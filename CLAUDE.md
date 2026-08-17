# CLAUDE.md — BoopTracker working notes

Conventions, constraints, and an assumptions log for anyone (human or Claude)
picking up this repo. Read this first, then `HANDOFF.md` for current state.

## What this is

BoopTracker: a family app that keeps score of *boops* (pretend there's
something on someone's shirt, they look down, you boop their nose). Frankie
(age 10, he/him) and Matt's project. See `docs/SPEC.md` for the v1 scope and
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

## Stack (confirmed + built)

- Client: React Native / **Expo SDK 54** (one codebase, iOS + Android), running
  in Expo Go. TypeScript strict, `@/*` → `src/*`.
- Backend: **Firebase** — Auth (email+password), Firestore (data). Cloud
  Functions (email, M3b) and Storage (photos, M3c) not wired yet.
- Auth: username + email + password ("own login each"; kids use Gmail `+aliases`).
- Email: **not used in v1** — verification is in-app (M3a). The email nudge (M3b)
  is deferred; the drafted `functions/` code stays dormant. A push nudge (M7) is
  the likelier future path.

> Live status is in `HANDOFF.md`. When Expo cuts a new SDK, bump the project to
> match before the next on-device playtest (Expo Go only ships the latest SDK).

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

- 2026-08-13 — M2 started. Accounts decision: **own login each** (username +
  email + password) via Firebase Auth; kids can use Gmail `+aliases`. Using the
  **Firebase JS SDK** (not `@react-native-firebase`) so the app keeps running in
  Expo Go — no dev build. Web config lives in `EXPO_PUBLIC_FIREBASE_*` env vars
  (`.env` gitignored, `.env.example` committed); these values aren't secret,
  Firestore rules are the real guard. `getReactNativePersistence` is reached
  defensively (RN-build-only, missing from web types). Auth foundation built
  first; People + Boops migrate to Firestore next. Schema in `docs/DATA_MODEL.md`.

- 2026-08-16 — Design pass + safe-area fix. Home wasn't wrapped in a
  SafeAreaView, so the username/Sign out sat under the status bar — fixed with
  `SafeAreaView edges={['top']}`. Refreshed the theme into tokens
  (`colors`/`gradients`/`radius`/`space`/`shadow` in `src/theme/colors.ts`);
  Home got a greeting + avatar, stat pills, and a gradient BOOP button
  (`expo-linear-gradient`); tabs got emoji icons. Same sunset gradient on the
  finish "Done" button. Not the M7.5 juice pass (confetti is still a
  placeholder) — just a visual uplift.

- 2026-08-16 — M3a built (in-app confirm loop). Boops against app friends get
  `subjectUid` (derived from the person id `app:{uid}`, so it works from the
  friends list *and* from "recent") + `status: 'pending'` + `booperName`; others
  are `self_reported`. `src/state/PendingBoops.tsx` subscribes to boops where
  `subjectUid == me`; a Home card opens `ConfirmBoopsModal` (confirm / "not that
  type" / deny). Denied boops stop counting (`deriveStats`/`deriveRecentPeople`
  filter them). Rules widened so the subject can read + resolve only
  `status`/`typeConfirmed`/`resolvedAt`. Decision: a pending boop **counts
  immediately**, subtracted on denial (fast loop; denial is rare). Email nudge
  (M3b) + photo→Storage (M3c) still pending Matt's Blaze/provider call.

- 2026-08-16 — M3b **drafted** (not deployed). Cloud Function `emailBoopNudge`
  in `functions/` (Firebase Functions v2 + Admin SDK, plain Node — can't import
  the Expo `@/*` bundle, so boop-type labels are a small local mirror of
  `constants.ts`). Architecture decision: the function does **not** send mail
  itself — it writes a `mail/{boopId}` doc for the **Trigger Email** extension
  (the recommended provider), so no SMTP creds live in the repo and the provider
  is swappable. Server-authoritative on purpose: the booper's client never
  learns the subject's email, and can't email an arbitrary address — the address
  is looked up server-side from the trusted `subjectUid`. Idempotent via
  `create()` keyed by boop id. `firebase.json` wires functions + points at
  `firestore.rules`. Not deployed: needs Blaze + the extension installed
  (`functions/README.md`). Also sanity-checked `firestore.rules` for the confirm
  flow — safe to publish as-is; noted hardening options (booper update can
  currently rewrite `booperUid`/`subjectUid`; boop create accepts any
  `subjectUid`, a mild nudge-spam vector) as v1-acceptable, not blockers.

- 2026-08-16 — Fixed safe-area + back-nav in the full-screen modals. A React
  Native `<Modal>` renders in a separate native hierarchy *outside* the app's
  `SafeAreaProvider`, so `SafeAreaView` inside it measured 0 insets — the header
  rode under the notch/status bar, which also hid the "Boops to confirm" dismiss
  control (looked like "no way back"). Fix: nest a `SafeAreaProvider` (seeded
  with `initialWindowMetrics` to avoid a first-frame jump) inside each Modal —
  `ConfirmBoopsModal` and `BoopFlow`. Also gave `ConfirmBoopsModal` a clear
  top-left "‹ Back" affordance mirroring `BoopFlow`'s header (was a right-side
  "Done" that the notch was covering). Playtest find from Matt; UI-only, tests
  still 31 green.

- 2026-08-16 — M4 **design gate** run with Frankie (`docs/M4_DESIGN_GATE.md`).
  Decisions: all week-one thresholds kept as guessed **except Night Owl**, moved
  10pm→9pm (`NIGHT_OWL_AFTER_HOUR` 22→21). Boop-type unlock is **the Ladder** —
  Boopstache @5 total boops, Bellyboop @10, Underboop @15 — encoded as a new
  `unlockAtBoops` field on the locked `BOOP_TYPES` (a constants test locks the
  5/10/15 order). Achievements stay **badge-only** and are **kept once earned**
  (a denial that drops you below a threshold does not revoke the badge). Sibling
  / Double Sibling need a **relation picker**, to be built as part of M4. This
  resolves the "unlock order blocks M4" open question for the v1 four.

- 2026-08-16 — Frankie uses **he/him** (recorded in "What this is" + SPEC).
- 2026-08-16 — M4 **kicked off** with the pure evaluation core
  (`src/features/achievements/achievementsCore.ts`): `evaluateAchievements`
  returns which of the 14 week-one badges are earned from a player's boops +
  context, `newlyEarned` diffs against what's already unlocked (badges are kept
  once earned), `isBigDeal` flags the two choice-granting ones. Follows the
  `*Core.ts` pattern — no React/Firebase, thresholds from `constants.ts`,
  day/hour encoders injectable for timezone-independent tests (25 tests). Still
  to build: live-data wiring (join boops→people for `relation`), the
  finish-screen badge/confetti, the "big deal" choice screen, the relation
  picker, and the achievements-list screen.

- 2026-08-16 — **Email nudge (M3b) deferred; v1 verification is in-app only.**
  Matt's call: skip the email. M3a's in-app "boops to confirm" loop already fully
  verifies boops with no Cloud Functions and no paid plan, and it fits the
  no-notifications, open→act→leave design. Consequences: **stay on the free Spark
  plan** (no Blaze needed for verification), no Trigger Email extension, no deploy.
  The drafted `functions/emailBoopNudge` + `firebase.json` are **kept dormant**
  (documented, re-deployable) rather than deleted. If a "you got booped" nudge is
  ever wanted, **push (M7)** is the preferred path over email. (Blaze is still
  only needed if M3c photo-as-proof is later pursued.)

- 2026-08-17 — **M4 wired up on-device** (the UI half after the evaluation core).
  Four slices, all client-side (no new Firestore rules, still Spark plan):
  - **Boop-type Ladder is live.** `src/features/boop/boopTypesCore.ts` (pure,
    tested) reads `BOOP_TYPES[].unlockAtBoops`; `PickType` now greys Boopstache /
    Bellyboop / Underboop until 5 / 10 / 15 total boops and shows "Unlock at N"
    (the old M1 TODO — all four were selectable before).
  - **Relation picker.** A friend can be tagged Brother/Sister/… on the Friends
    tab (bottom-sheet of `PERSON_RELATIONS` chips → `People.setRelation`, merge
    write). This is what makes Sibling / Double Sibling earnable; the boop→person
    `relation` join happens at eval time, so tagging someone counts past boops.
  - **Live achievements + Awards tab.** `src/state/Achievements.tsx` joins given
    boops → people (`buildAchievementInput`) and runs the evaluator over live
    data; `timesBooped` (non-denied received) comes from `PendingBoops`,
    `friendsCount` from People. New **Awards** tab (`🏅`) is the trophy case.
  - **Unlock celebration.** `AchievementCelebration` is a global overlay (mounted
    at the App root, inside the providers) so the confetti fires wherever a badge
    is earned — finish screen, confirming a received boop, or adding a 5th friend.
  Decisions made here:
  - **Badges kept once earned** is implemented by persisting a grow-only *union*
    of earned ids (local AsyncStorage, per-uid, `booptracker:achievements:{uid}`)
    — a later denial can't revoke a badge. Moving this to Firestore (badges follow
    across devices) is a future improvement, not a v1 blocker.
  - **Seed silently, celebrate only new.** On first load per account we adopt
    whatever's already earned with no confetti (gated on all three providers'
    `loaded` flags + persistence `hydrated`), so shipping M4 to an account that
    already has boops doesn't fire ten celebrations at once.
  - **"Friends" = your whole people list** (not just app-accounts) for Friend
    Circle, so a small family can actually reach 5. One-liner in `Achievements`;
    easy to flip to app-friends-only if Matt prefers.
  - **"Big deal" powerup grant deferred to M5.** Boop Received / Boop Collector
    (and the boop-type-family unlock) are *recognised and teased* in the
    celebration, but the actual Free Boop / Shield **choice needs the powerup
    store, which is M5** — building a choice screen that grants nothing would be
    dishonest, and BUILD_PLAN says build in order. `boopTypesUnlockedBetween`
    (tested) is left as the seam M5 wires to fire the type-family big-deal moment.
  Each type/badge got an `emoji` (one place: the type + achievement lists) for
  the kid-facing cards. Tests 72 green (added `boopTypesCore` + the join); typecheck clean.

- 2026-08-17 — **M5 (Powerups) built.** Free Boops + Shields, all on the free
  Spark plan. Slices:
  - **The store.** Pure `src/state/powerupsCore.ts` (caps 3/3 from `POWERUPS`,
    `grant`/`spend` clamped, month-keyed refill) + `src/state/Powerups.tsx`, a
    provider backed by a **private** doc `users/{uid}/private/powerups` (kept out
    of the signed-in-readable profile doc; new `firestore.rules` match). Home
    shows ⚡/🛡️ count pills.
  - **Monthly refill is client-side + lazy, NOT a scheduled Cloud Function.**
    BUILD_PLAN sketched a scheduled function, but that needs Blaze and we chose to
    stay on Spark (M3b/M4). Instead we store the `refillMonth` ("YYYY-MM") and top
    both powerups to full the first time the app loads in a new month
    (`applyMonthlyRefill`). Matches "refill to full on the 1st" closely enough for
    a family app; each player refills on their next open. If we ever go Blaze, a
    scheduled function refilling everyone at 00:00 on the 1st is the upgrade.
  - **Big-deal badge → real choice.** `AchievementCelebration` now offers a Free
    Boop / Shield **pick** for the two big-deal badges (Boop Received, Boop
    Collector), granting via `Powerups.grant`. The pick is **required** (hardware
    back is a no-op on a big-deal) so the reward can't be lost by tapping away.
  - **Shield flow (defense).** New boop status **`shielded`** — it happened but
    doesn't count, and (unlike `denied`) can't be overruled. Added a "🛡️ Shield
    it" action in `ConfirmBoopsModal` (shown only when you hold a shield); it
    `spend('shield')`s then writes `status:'shielded'`. No rule change — the
    subject-update rule already allows the `status`/`resolvedAt` keys. `shielded`
    is excluded from counting in `boopLogCore`, `achievementsCore`, and
    `timesBooped`.
  - **Free Boop flow (offense).** `BoopLog` exposes `deniedBoops` +
    `overruleBoop` (denied→`confirmed` + `overruled:true`); a Home "⚡ N denied —
    overrule?" card opens `OverruleBoopsModal`, which `spend('freeBoop')`s then
    overrules. The card is gated on **having both a denial and a Free Boop**, so a
    rare denial never nags forever. Booper already owns the boop (no rule change);
    the subject can't re-deny (their confirm list is `pending`-only), so no
    ping-pong. Per SPEC a Free Boop can only ever land on an already-recorded,
    already-denied boop — never fabricate one.
  - Decisions: **spend is a Firestore transaction** (read-modify-write, can't go
    negative / past cap); flows **write the boop only if the spend succeeds**, so
    you never shield/overrule "for free". Powerups persist in Firestore (unlike
    M4 achievements, which are local) since they gate real actions.
  - **Deferred (one design call for Matt):** a **boop-type family unlock** is also
    a big-deal per SPEC, but it fires at 5/10/15 total boops — and 10 collides
    with the Boop Collector big-deal, so unlocking Bellyboop *and* hitting Boop
    Collector at 10 would hand out **two** powerup choices at once. Left unwired
    pending Matt's call on whether that should stack; `boopTypesUnlockedBetween`
    (tested) is the ready seam. Tests 87 green; typecheck clean.

- 2026-08-17 — **Boop-type-family unlock now grants a stacked powerup choice**
  (Matt: **stack them**). The M5 celebration queue was generalised from "badge
  ids" to a discriminated `CelebrationItem` (`{kind:'badge'}` | `{kind:'boopType'}`).
  When total boops cross 5/10/15, the newly-unlocked family enqueues a big-deal
  Free Boop / Shield **choice**, in addition to any badge earned at the same
  moment — so at **10 boops you make two picks** (Boop Collector, then Bellyboop
  unlocked). Implementation mirrors the badge union: a grow-only persisted set
  `booptracker:boopTypeFamilies:{uid}` (per-uid, local) diffed against
  `unlockedBoopTypeFamilies(totalBoops)` (new pure helper, tested), **seeded
  silently** on first load so an account that already has ≥5 boops gets **no
  retroactive powerups**. In-order display: badge choice first, then the type
  unlock. (I didn't end up needing `boopTypesUnlockedBetween` — the set-diff is
  the same machinery as badges and handles denials dropping the total below a
  threshold without double-granting; the helper stays as a tested alt-seam.)
  Tests 89 green; typecheck clean. Landed as a fresh change after #6 merged.

## Open questions still to settle

Tracked in full in `docs/BACKLOG.md` ("Open Questions") and the bottom of
`docs/ACHIEVEMENTS.md` ("Still To Decide"). The ones that block building:

- Boop-type unlock order for the v1 four — **decided** (the Ladder, 2026-08-16
  design gate). Order/prerequisites for types *beyond* the v1 four stay backlog.
- Email provider for the boop-notification — **moot for v1** (email nudge
  deferred; verification is in-app). Revisit only if a push nudge lands (M7).
- Region detection for leaderboards (backlog, not v1).
