# HANDOFF — BoopTracker

Current state and how to pick up. Pair with `CLAUDE.md` (conventions +
constraints + dated assumptions log) and `docs/` (the actual plan). This file is
a **snapshot**, not a history — the blow-by-blow lives in the CLAUDE.md
assumptions log and git.

_Last updated: 2026-08-16._

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
3. **Decide two things for M3b** (the email nudge), whenever:
   - Upgrade Firebase to the **Blaze plan**? (Needed for Cloud Functions; free
     tier is generous.)
   - **Email provider** — recommendation is Firebase's *Trigger Email* extension.

## Where we are

The app is real: **Expo + Firebase**, running in Expo Go. Accounts, cloud data,
friends-by-username, and in-app boop **confirmation** all work. Milestones M0–M2
are done; **M3 is in progress** (M3a done; M3b/M3c pending Matt's decisions).

### Milestone status (see `docs/BUILD_PLAN.md`)
- **M0 Repo skeleton** — ✅ done
- **M1 The boop button (fake data)** — ✅ done, playtested & loved
- **M2 Real accounts + data** — ✅ core done (auth, cloud people + boops,
  add-by-username, security rules written). Pending: Matt publishes the rules.
- **M3 Verification** — 🔨 in progress
  - **M3a** in-app confirm loop — ✅ built (needs the two-account test)
  - **M3b** email nudge — ⏳ needs Blaze + email provider
  - **M3c** photo-as-proof → Firebase Storage — ⏳
- **M4–M8** — not started (achievements, powerups, leaderboards, push, juice,
  playtest).

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

- **Boop-type unlock order / prerequisites** beyond the v1 four (blocks M4
  achievements + unlock logic).
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
