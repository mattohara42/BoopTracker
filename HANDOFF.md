# HANDOFF — BoopTracker

Current state and how to pick up. Pair with `CLAUDE.md` (conventions +
constraints + dated assumptions log) and `docs/` (the actual plan). This file is
a **snapshot**, not a history — the blow-by-blow lives in the CLAUDE.md
assumptions log and git.

_Last updated: 2026-08-17._

## 📋 Tomorrow's checklist (Matt)

1. **Publish the Firestore security rules.** The project is still in wide-open
   test mode. Copy [`firestore.rules`](firestore.rules) into the Firebase
   console → **Firestore Database → Rules** → **Publish**. (Steps in
   `docs/DATA_MODEL.md`.) Do this first — M3a added rules the confirm flow needs.
2. **Test the two-account flow on a phone** (re-download / `git pull`, then
   `npm install` → `npm start`):
   - Make a 2nd account (e.g. `you+frankie@gmail.com`; Sign out is top-left).
   - Account A: **Friends → Add a friend by username** → B's username → boop them.
   - Account B: Home shows **"🔔 1 boop to confirm"** → open it → confirm / deny.
   - Watch A's score react (a denied boop stops counting).
   - If you see **"Missing or insufficient permissions"**, tell Claude — a rule
     needs a tweak.
3. ~~Decide two things for M3b (the email nudge).~~ **Decided: skip the email for
   v1.** Verification is **in-app only** (M3a already covers it), so no Blaze plan
   and no email provider are needed. The drafted `functions/` code stays
   **dormant** (documented, re-deployable) in case a nudge is wanted later —
   likely as push (M7) rather than email.
4. **Try M4 (achievements) with Frankie.** No new Firestore rules, so nothing to
   publish for this — just `git pull` + `npm start`. Things to poke at:
   - Boop a few times and watch **Boopstache unlock at 5 boops** in the type
     picker (locked cards show "Unlock at N"). Bellyboop @10, Underboop @15.
   - Tag someone **Brother/Sister** on the Friends tab, boop them → **Sibling
     Boop** badge pops (the celebration overlay).
   - Check the new **Awards** tab (🏅) — the trophy case of all 14 badges.
   - Note: the "⭐ big deal" badges say a Free Boop / Shield pick is *coming soon*
     — that grant is **M5** on purpose. Tell me if the Ladder pace feels off.

## Where we are

The app is real: **Expo + Firebase**, running in Expo Go. Accounts, cloud data,
friends-by-username, in-app boop **confirmation**, and now **achievements** all
work. Milestones M0–M2 are done; **M3a shipped** (in-app confirm — the v1
verification), **M3b (email) deferred**, **M3c (photos) optional/pending**;
**M4 shipped** (the badge engine is wired to live data, boop types unlock on the
Ladder, there's an Awards tab + an unlock celebration). The one M4 piece pushed
to M5: the "big deal" **Free Boop / Shield choice** (it needs the powerup store).

### Milestone status (see `docs/BUILD_PLAN.md`)
- **M0 Repo skeleton** — ✅ done
- **M1 The boop button (fake data)** — ✅ done, playtested & loved
- **M2 Real accounts + data** — ✅ core done (auth, cloud people + boops,
  add-by-username, security rules written). Pending: Matt publishes the rules.
- **M3 Verification** — 🔨 in progress
  - **M3a** in-app confirm loop — ✅ built (needs the two-account test)
  - **M3b** email nudge — ⏸️ **deferred (not in v1).** Function is drafted and
    left dormant in `functions/`; verification is in-app only. A push nudge (M7)
    is the likelier future path.
  - **M3c** photo-as-proof → Firebase Storage — ⏳ optional (needs Blaze/Storage)
- **M4 Achievements** — ✅ done (bar the deferred powerup grant). Evaluation core
  + live wiring (`src/state/Achievements.tsx`), boop-type Ladder in the picker,
  relation picker on Friends, **Awards** tab, and an unlock **celebration**
  overlay. Badges persist as a grow-only union (kept once earned). The "big deal"
  Free Boop / Shield **choice** is recognised + teased but the grant is **M5**
  (needs the powerup store).
- **M5–M8** — not started (powerups, leaderboards, push, juice, playtest). M5
  picks up the deferred big-deal powerup choice.

## How to run

```bash
npm install
cp .env.example .env     # then paste your Firebase web config (see .env.example)
npm start                # scan the QR with Expo Go
npm test                 # 31 unit tests
npm run typecheck
```

Full run/playtest guide: `docs/PLAYTEST.md`. Firebase setup + schema:
`docs/DATA_MODEL.md`.

## Architecture at a glance

- **Client:** Expo SDK 54 / RN 0.81 / React 19 / TS strict. `@/*` → `src/*`.
  Bottom tabs (Home / Friends / Leaderboard); the record flow is a modal.
- **State providers** (mount when signed in): `People` (`users/{uid}/people`),
  `BoopLog` (`boops` where `booperUid == me`), `PendingBoops` (`boops` where
  `subjectUid == me`). Pure logic sits in `*Core.ts` files and is unit-tested.
- **Backend:** Firebase Auth (email+password) + Firestore. Config via
  `EXPO_PUBLIC_FIREBASE_*` env. Rules in `firestore.rules`.
- **One place to tune numbers:** `src/config/constants.ts`.

## Known limitations / tracked to-dos

- Firestore rules exist but **aren't published yet** (test mode live).
- `photoUri` is a local device path — photos don't load cross-device until M3c
  (Storage upload).
- Home stats recompute from all your boops; fine at family scale, would move to
  counters at large scale (see the scaling notes — same applies to M6
  leaderboards, which need aggregation, not reading everyone's boops).
- Editing/deleting an *older* boop has no home yet (no-feed constraint) — see
  `docs/BACKLOG.md`.

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
2. Read `CLAUDE.md`, then this file, then `docs/BUILD_PLAN.md` +
   (for the current milestone) `docs/M3_PLAN.md` + `docs/DATA_MODEL.md`.
3. `npm install`; ensure `.env` exists; `npm start`. Then continue M3
   (M3b/M3c) once Matt's decisions are in, or whatever he points you at.
