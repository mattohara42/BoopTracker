# HANDOFF — BoopTracker

Current state and how to pick up. Pair with `CLAUDE.md` (conventions +
constraints + dated assumptions log) and `docs/` (the actual plan). This file is
a **snapshot**, not a history — the blow-by-blow lives in the CLAUDE.md
assumptions log and git.

_Last updated: 2026-08-17._

## 📋 Tomorrow's checklist (Matt)

**M4 + M5 are merged to `main`; M6 (leaderboards) is built on a branch / draft
PR.** Nothing is half-finished in code — tomorrow is about *playing* it,
publishing the rules, and picking the next build.

1. **Publish the Firestore security rules.** The project is still in wide-open
   test mode. Copy [`firestore.rules`](firestore.rules) into the Firebase
   console → **Firestore Database → Rules** → **Publish**. (Steps in
   `docs/DATA_MODEL.md`.) M3a, M5, and now **M6** all added rules — M6's is the
   new `users/{uid}/public/{doc}` **aggregate stats** doc that the leaderboards
   read (read = any signed-in user, write = owner). Everything works under test
   mode until it expires; republish so these stay scoped when it does. **The
   leaderboards need this rule** once test mode is gone.
2. **Playtest M1–M5 on a phone** (`git pull` → `npm install` → `npm start`,
   scan with Expo Go). Suggested run-through:
   - **Two-account core:** make a 2nd account (`you+frankie@gmail.com`; Sign out
     top-left) → Account A **Friends → Add by username** → boop B → B's Home shows
     **"🔔 1 boop to confirm"** → confirm/deny → watch A's score react. *(If you
     see "Missing or insufficient permissions", a rule needs a tweak — tell me.)*
   - **Ladder (M4):** boop a few times, watch **Boopstache unlock at 5** in the
     type picker (locked cards show "Unlock at N"); Bellyboop @10, Underboop @15.
   - **Siblings (M4):** tag someone **Brother/Sister** on Friends → boop them →
     **Sibling Boop** badge pops. Check the **Awards** tab (🏅).
   - **Powerups (M5):** Home shows ⚡/🛡️ counts. Earn **Boop Collector** (10
     boops) → pick Free Boop or Shield. **Shield:** in "boops to confirm" → **🛡️
     Shield it** → that boop won't count. **Overrule:** get one of your boops
     **denied**, then (holding a Free Boop) Home shows **"⚡ N denied — overrule?"**.
     At **10 boops you'll get two picks** (Boop Collector + the Bellyboop unlock).
3. **Playtest M6 leaderboards** (once the branch is merged / pulled). Open the
   **🏆 Leaderboard** tab: toggle **Family / Friends**, tap through the four stats
   (most boops, most people booped, most/least booped). With two accounts booping
   each other you'll see both ranked; your own row is highlighted. *(Family = app
   friends you've tagged with a family relation; Friends = all app friends. A
   contact with no account won't appear — nothing to rank.)*
4. **Pick the next build** (tell me which):
   - **M7 Push notifications** — "a friend booped you" / "you unlocked a badge."
     Heads-up: real push may want a dev build or Blaze (EAS + FCM/APNs); worth a
     quick scoping pass. See `docs/BUILD_PLAN.md` M7.
   - **M7.5 Juice pass** — real confetti, sound, polish the finish/unlock moments
     (out of strict order, but low-risk and kid-facing).
   - **Get it onto more phones (beyond Expo Go)** — a wider family test via
     TestFlight (iOS) or a sideloaded APK (Android). Practical steps in
     [`docs/APP_STORE_SETUP.md`](docs/APP_STORE_SETUP.md). Not required for the
     playtests above; do it when a relative won't scan a QR.

## Where we are

The app is real: **Expo + Firebase**, running in Expo Go. Accounts, cloud data,
friends-by-username, in-app boop **confirmation**, **achievements**, and now
**powerups** all work. Milestones M0–M2 are done; **M3a shipped** (in-app confirm
— the v1 verification), **M3b (email) deferred**, **M3c (photos) optional**;
**M4 shipped** (badge engine + Awards tab + Ladder + celebration); **M5 shipped**
(Free Boops + Shields: caps, lazy monthly refill, big-deal badge → choice, the
overrule flow, and the shield flow); **M6 built** (Family/Friends leaderboards,
four all-time stats, ranked from per-user public aggregate docs — on a branch /
draft PR, not merged yet). Still on the **free Spark plan** throughout.

### Milestone status (see `docs/BUILD_PLAN.md`)
- **M0 Repo skeleton** — ✅ done
- **M1 The boop button (fake data)** — ✅ done, playtested & loved
- **M2 Real accounts + data** — ✅ core done (auth, cloud people + boops,
  add-by-username, security rules written). Pending: Matt publishes the rules.
- **M3 Verification** — ✅ v1 done (in-app confirm is the shipped verification)
  - **M3a** in-app confirm loop — ✅ built (needs the two-account test)
  - **M3b** email nudge — ⏸️ **deferred (not in v1).** Function is drafted and
    left dormant in `functions/`; verification is in-app only. A push nudge (M7)
    is the likelier future path.
  - **M3c** photo-as-proof → Firebase Storage — ⏳ optional (needs Blaze/Storage)
- **M4 Achievements** — ✅ done. Evaluation core + live wiring
  (`src/state/Achievements.tsx`), boop-type Ladder in the picker, relation picker
  on Friends, **Awards** tab, and an unlock **celebration** overlay. Badges
  persist as a grow-only union (kept once earned). The "big deal" Free Boop /
  Shield **choice** is granted in M5.
- **M5 Powerups** — ✅ done. Free Boops + Shields with hard 3/3 caps and a
  **client-side lazy monthly refill** (no Cloud Function → still Spark). Big-deal
  **badges** grant a real Free Boop / Shield pick in the unlock celebration.
  **Overrule** flow (spend a Free Boop to un-deny a boop) and **shield** flow
  (block an incoming boop → new `shielded` status) both built. A **boop-type-family
  unlock** grants a **stacked** pick too (Matt's call): crossing 5/10/15 boops
  hands out a choice on top of any badge earned at that moment.
- **M6 Leaderboards** — ✅ built (branch / draft PR). Family + Friends groups
  (derived from the people list — no new "groups" collection), the four all-time
  stats, ranked in pure `leaderboardCore` (`src/features/leaderboard/`). Cross-user
  data comes from a per-user public aggregate doc (`users/{uid}/public/stats`,
  written by `StatsPublisher`), so no Cloud Function and only three numbers leave
  each account. Needs the new `public/{doc}` rule published. The "win a
  leaderboard for a month" big-deal achievement stays deferred (time-windowed;
  v1 leaderboards are all-time only).
- **M7–M8** — not started (push, juice, playtest).

## How to run

```bash
npm install
cp .env.example .env     # then paste your Firebase web config (see .env.example)
npm start                # scan the QR with Expo Go
npm test                 # 102 unit tests
npm run typecheck
```

Full run/playtest guide: `docs/PLAYTEST.md`. Firebase setup + schema:
`docs/DATA_MODEL.md`. Getting off Expo Go (TestFlight / APK / App Store):
`docs/APP_STORE_SETUP.md`.

## Architecture at a glance

- **Client:** Expo SDK 54 / RN 0.81 / React 19 / TS strict. `@/*` → `src/*`.
  Bottom tabs (Home / Friends / **Awards** 🏅 / Leaderboard); the record flow,
  confirm, and overrule screens are modals over Home.
- **State providers** (mount when signed in, nested in this order): `Powerups`
  (`users/{uid}/private/powerups`), `People` (`users/{uid}/people`), `BoopLog`
  (`boops` where `booperUid == me`), `PendingBoops` (`boops` where
  `subjectUid == me`), `Achievements` (joins the above; local per-uid persistence
  for earned badges + granted type-families). A mounted `StatsPublisher` (beside
  `AchievementCelebration`) mirrors my aggregate numbers to
  `users/{uid}/public/stats` for M6. Pure logic sits in `*Core.ts` files and is
  unit-tested (`boopLogCore`, `boopTypesCore`, `achievementsCore`, `powerupsCore`,
  `contactsCore`, `leaderboardCore`).
- **Backend:** Firebase Auth (email+password) + Firestore. Config via
  `EXPO_PUBLIC_FIREBASE_*` env. Rules in `firestore.rules`. Still on the **Spark**
  (free) plan — no Cloud Functions; powerup refill is client-side + lazy.
- **One place to tune numbers:** `src/config/constants.ts`.

## Known limitations / tracked to-dos

- Firestore rules exist but **aren't published yet** (test mode live).
- `photoUri` is a local device path — photos don't load cross-device until M3c
  (Storage upload).
- **Achievements + granted powerup-families persist locally** (AsyncStorage,
  per-uid), so earned badges don't follow across devices; powerups themselves
  *are* in Firestore. Moving the achievement sets to Firestore is a future
  improvement, not a v1 blocker.
- Home stats — and the M6 leaderboard aggregates — recompute from all your boops
  client-side; fine at family scale, would move to server-side counters at large
  scale. M6 already avoids the worst version of this (it reads a small per-user
  aggregate doc, not everyone's raw boops), but each player's *own* aggregate is
  still derived from their full boop list on the client.
- Editing/deleting an *older* boop has no home yet (no-feed constraint) — see
  `docs/BACKLOG.md`.
- Runs in **Expo Go only** — no standalone/TestFlight build is set up yet.
  When that's needed, `docs/APP_STORE_SETUP.md` has the path (bundle ids are
  already set; `eas.json` + an Apple Developer account are the missing pieces).

## Open questions that block future milestones

- **Boop-type unlock order** for the v1 four — **decided** (the Ladder: 5/10/15
  total boops; see `docs/M4_DESIGN_GATE.md`), no longer blocks M4. Order for
  types beyond the v1 four is still backlog.
- Does a `pending` boop count immediately or only once confirmed? Current
  behavior: counts immediately, subtracted on denial (see `docs/M3_PLAN.md`).
- Full lists in `docs/BACKLOG.md` → "Open Questions" and
  `docs/ACHIEVEMENTS.md` → "Still To Decide".

## How to pick up in a new session

1. Point the session at the `mattohara42/BoopTracker` repo (primary dir).
2. Read `CLAUDE.md`, then this file, then `docs/BUILD_PLAN.md`. For the likely
   next build add `docs/APP_STORE_SETUP.md` (getting off Expo Go); `docs/DATA_MODEL.md`
   has the current schema incl. the M6 `public/{doc}` stats.
3. `npm install`; ensure `.env` exists; `npm start` (+ `npm test` / `npm run
   typecheck` — 102 tests, typecheck clean at last commit).
4. **M1–M5 are done and merged; M6 (Leaderboards) is built on a branch / draft
   PR.** Next up is whatever Matt points at in the checklist above — most likely
   **M7 (Push)**, the **M7.5 juice pass**, or a **TestFlight/APK build** for a
   wider family test.
