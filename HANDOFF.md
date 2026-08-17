# HANDOFF — BoopTracker

Current state and how to pick up. Pair with `CLAUDE.md` (conventions +
constraints + dated assumptions log) and `docs/` (the actual plan). This file is
a **snapshot**, not a history — the blow-by-blow lives in the CLAUDE.md
assumptions log and git.

_Last updated: 2026-08-17._

## 📋 Tomorrow's checklist (Matt)

**M4 + M5 are merged to `main`.** Nothing is half-finished in code — tomorrow is
about *playing* it, publishing the rules, and picking the next build.

1. **Publish the Firestore security rules.** The project is still in wide-open
   test mode. Copy [`firestore.rules`](firestore.rules) into the Firebase
   console → **Firestore Database → Rules** → **Publish**. (Steps in
   `docs/DATA_MODEL.md`.) M3a and M5 both added rules — M5's is the private
   `users/{uid}/private/{doc}` powerup wallet. Everything works under test mode
   until it expires; republish so those stay owner-only when it does.
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
3. **Pick the next build** (tell me which):
   - **M6 Leaderboards** — the next milestone. Heads-up: it needs a **rules
     read-scope widening** (today you can only read your *own* boops), so it wants
     a quick design pass before coding. See `docs/BUILD_PLAN.md` M6.
   - **Get it onto more phones (beyond Expo Go)** — a wider family test via
     TestFlight (iOS) or a sideloaded APK (Android). Practical steps in the new
     [`docs/APP_STORE_SETUP.md`](docs/APP_STORE_SETUP.md). Not required for the
     playtests above; do it when a relative won't scan a QR.

## Where we are

The app is real: **Expo + Firebase**, running in Expo Go. Accounts, cloud data,
friends-by-username, in-app boop **confirmation**, **achievements**, and now
**powerups** all work. Milestones M0–M2 are done; **M3a shipped** (in-app confirm
— the v1 verification), **M3b (email) deferred**, **M3c (photos) optional**;
**M4 shipped** (badge engine + Awards tab + Ladder + celebration); **M5 shipped**
(Free Boops + Shields: caps, lazy monthly refill, big-deal badge → choice, the
overrule flow, and the shield flow). Still on the **free Spark plan** throughout.

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
- **M6–M8** — not started (leaderboards, push, juice, playtest).

## How to run

```bash
npm install
cp .env.example .env     # then paste your Firebase web config (see .env.example)
npm start                # scan the QR with Expo Go
npm test                 # 89 unit tests
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
  for earned badges + granted type-families). Pure logic sits in `*Core.ts` files
  and is unit-tested (`boopLogCore`, `boopTypesCore`, `achievementsCore`,
  `powerupsCore`, `contactsCore`).
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
- Home stats recompute from all your boops; fine at family scale, would move to
  counters at large scale (see the scaling notes — same applies to M6
  leaderboards, which need aggregation, not reading everyone's boops).
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
   next build add `docs/DATA_MODEL.md` (M6 leaderboards will widen read rules) or
   `docs/APP_STORE_SETUP.md` (getting off Expo Go).
3. `npm install`; ensure `.env` exists; `npm start` (+ `npm test` / `npm run
   typecheck` — 89 tests, typecheck clean at last commit).
4. **M1–M5 are done and merged.** Next up is whatever Matt points at in the
   checklist above — most likely **M6 (Leaderboards)** (needs a rules read-scope
   pass first) or a **TestFlight/APK build** for a wider family test.
