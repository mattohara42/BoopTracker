# Security & Hardening — BoopTracker

The security posture, the gaps, and the concrete plan to close them. Written as
the working reference for Matt + Claude to execute together before any wider
release. Pairs with `docs/DATA_MODEL.md` (schema + the rules deploy steps) and
`docs/APP_STORE_SETUP.md` (the kids-privacy gate on a public listing).

_Last updated: 2026-08-17 (after the M6/M7/M7.5 foundational review)._

---

## 0. The one decision that gates everything: **family-only vs. public**

Almost every item below is fine for a **family app** and becomes a real problem
only if the app is **listed publicly** (open sign-ups by strangers). Decide this
first, because it determines whether §2 (H1–H3) are must-fix or backlog:

- **Family-only** (TestFlight / internal testing / a sideloaded APK shared with
  relatives): the current rules are acceptable as-is. Do §1 (publish the rules)
  and you're done for now; H1–H3 stay documented backlog.
- **Public listing** (App Store / Play, anyone can sign up): H1–H3 become
  blockers, **and** the COPPA / kids-privacy questions in `APP_STORE_SETUP.md`
  apply because a 10-year-old's email is stored. Do not list publicly until this
  section is worked through.

**Recommendation:** stay family-only through v1 (M8 playtest). Treat H1–H3 as
"before we ever open sign-ups," not "before the family playtest."

---

## 1. Do this now (independent of the decision): publish the rules

The project is still in Firestore **test mode** (open to all until it expires).
`firestore.rules` in the repo root is the real ruleset and already encodes
everything through M6. **Publish it:** Firebase console → Firestore Database →
Rules → paste `firestore.rules` → Publish. (Steps also in `DATA_MODEL.md`.)

Until this is done, none of the protections below are actually in force — test
mode allows everything. After it's done, the app keeps working (the M6
leaderboards need the `users/{uid}/public/{doc}` read rule that's already in the
file).

> Claude can't reach the Firebase console. This step is Matt's; ping Claude if
> you see "Missing or insufficient permissions" after publishing and we'll
> reconcile the rule with the code.

---

## 2. High — required before a public listing

### H1 — Boop creation trusts an arbitrary `subjectUid`

**What:** the create rule only checks the booper is themselves; it does not
constrain who the boop is *against*. Any signed-in user can create a `pending`
boop targeting any uid.

```
// current (firestore.rules)
allow create: if signedIn()
  && request.resource.data.booperUid == request.auth.uid;
```

**Risk (public only):** a stranger can spam boops at anyone — inflating their
"boops received" (and, once M7 push is live, firing nudges at them). At family
scale this is a non-issue.

**Fix — gate creation on an existing friend relationship.** A boop against an
app user requires that user to already be in the booper's people list as
`app:{subjectUid}` (which is exactly how the client derives `subjectUid` today,
so this matches the real flow — no UX change):

```
// proposed
allow create: if signedIn()
  && request.resource.data.booperUid == request.auth.uid
  && (
    // self-reported boop (non-app person): no subject to protect
    !('subjectUid' in request.resource.data)
    // app boop: the subject must be a friend the booper has added
    || exists(/databases/$(database)/documents/users/$(request.auth.uid)/people/$('app:' + request.resource.data.subjectUid))
  );
```

**Code impact:** none — the app already only boops app-users it has as
`app:{uid}` people. Add a rules test (offline emulator) that a boop against a
non-friend uid is denied.

**Also fold in (cheap, same edit):** restrict the booper's *update* so it can't
rewrite identity fields. Today `allow update: if isBooper()` lets the booper
change `booperUid`/`subjectUid` on their own boop. Constrain the mutable keys
(mirrors how the subject update is already constrained):

```
allow update: if
  (isBooper()
     && request.resource.data.booperUid == resource.data.booperUid
     && request.resource.data.subjectUid == resource.data.subjectUid)
  || (isSubject()
     && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'typeConfirmed', 'resolvedAt']));
```

### H2 — Leaderboard stats are client-written and unvalidated

**What:** `users/{uid}/public/stats` is owner-writable with no correctness
check. A user can write `totalBoops: 9999` and top the board.

```
match /public/{doc} {
  allow read: if signedIn();
  allow write: if isUser(uid);   // no validation of the numbers
}
```

**Risk (public only):** cheatable leaderboards. Irrelevant for a family that
isn't trying to cheat itself.

**Fix options:**
- **Family:** accept it. Document that the numbers are self-reported.
- **Public:** make the stats **server-computed** — a Cloud Function recomputes
  `users/{uid}/public/stats` from the user's real boops on write, and the rule
  forbids client writes to `public/stats` entirely (only the Admin SDK writes
  it). Needs **Blaze** (a function). This also removes the client-side
  `StatsPublisher` write path. Sketch:
  - Rule: `match /public/{doc} { allow read: if signedIn(); allow write: if false; }`
  - Function: `onDocumentWritten('boops/{id}')` → recompute the booper's (and
    subject's) aggregates → `admin` write to their `public/stats`.

### H3 — Profile reads expose `email`; COPPA

**What:** `users/{uid}` is readable by any signed-in user (needed to resolve a
username → display name when adding a friend), and it carries `email`.

**Risk:** any signed-in user can read every other user's email. For a public app
storing a **child's** email, that's a COPPA / privacy problem, not just a
preference. (Family-internal, it's acceptable and already noted in the rules.)

**Fix — split the profile into public + private:**
- **Public** `users/{uid}` → `{ username, usernameLower, createdAt }` only.
  Stays `read: if signedIn()`.
- **Private** `users/{uid}/private/profile` → `{ email }` (owner-only; the
  `private/{doc}` rule already covers it).

**Code impact (small, isolated):**
- `src/auth/AuthContext.tsx` `signUp`: write `email` into
  `users/{uid}/private/profile` instead of the public profile doc (same
  transaction).
- No reader needs `email` — `addByUsername` already reads only `username` from
  the public doc, so nothing else changes.
- One-time migration for existing accounts (there are ~2): move the `email`
  field, or just re-create. Claude can write a tiny migration script or we do it
  by hand in the console.

---

## 3. Medium — worth doing regardless of the decision

### M1 — Non-atomic spend ↔ boop write (shield / overrule)

Shield and overrule do `spend()` (a powerups-doc transaction) and *then* a
separate boop write. If the spend commits but the boop write fails, the powerup
is lost without the effect applying. The *safe* direction is protected (the boop
is only written if the spend succeeds — you never shield/overrule for free); this
is the tolerable direction. **Fix (if we want full atomicity):** move the boop
`status` write inside the same `runTransaction` as the spend, so both commit or
neither does. Low priority — the failure needs a mid-operation network drop.

### M2 — Silent write failures on the resolve paths — ✅ FIXED (this change)

`confirm` / `deny` / `shield` / `overrule` used to swallow errors
(`.catch(() => {})`), so a tap that hit "Missing or insufficient permissions"
did nothing with no signal — painful to debug in a playtest. These now reject and
the modals show an Alert. (The record path already surfaced errors.) Remaining
background writes that still swallow — `StatsPublisher`, the powerups seed/refill,
`attachPhoto` — are non-interactive and fine to keep silent.

---

## 4. Low / latent — captured, not urgent

### L1 — `usePersistentState` key-change bleed (latent, unreachable today)

If the hook's `key` changes while mounted, `hydrated` isn't reset, so the
previous key's value can be written under the new key before its load resolves.
**Currently unreachable:** the only keys are per-uid (`…:{uid}`) and signing out
unmounts the whole provider tree, so a new account always remounts the hook
fresh. Documented in the hook's header comment. **Fix when needed:** reset
`hydrated`/state on key change and gate writes on a "hydrated-for-this-key" ref.
(Deliberately not changed now — it's a load-bearing persistence hook and the bug
isn't reachable; not worth destabilizing right before the M8 playtest.)

### L2 — Achievements + granted powerup-families persist locally per device

Earned badges live in AsyncStorage per-uid, so they don't follow across devices,
and a reinstall re-seeds from current data (no false celebrations, but "kept once
earned" badges below current thresholds are lost). Powerups themselves *are* in
Firestore. Moving the badge/family sets to Firestore is the fix; a v1-acceptable
gap.

---

## 5. Current rules at a glance (what's enforced today)

| Path | Read | Write |
|---|---|---|
| `users/{uid}` (profile incl. `email`) | any signed-in user | owner only; no delete |
| `users/{uid}/people/{id}` | owner | owner |
| `users/{uid}/private/{doc}` (powerups, push token) | owner | owner |
| `users/{uid}/public/{doc}` (leaderboard stats) | any signed-in user | owner (unvalidated → H2) |
| `usernames/{name}` | any signed-in user | create-own-only; no update/delete |
| `boops/{id}` | booper or subject | create: booper (any `subjectUid` → H1); update: booper (unrestricted keys → H1) or subject (status/typeConfirmed/resolvedAt only); delete: booper |

---

## 6. How we'll work through this together

Claude can do all the **code + rules-file + tests** edits and open a PR. What
needs Matt (console / paid-plan access) is called out.

1. **Now:** Matt publishes `firestore.rules` (§1). *(Matt — console.)*
2. **Decide** family-only vs. public (§0). *(Matt.)*
3. **If public** (or whenever hardening is wanted), in this rough order:
   - **H1** — Claude edits `firestore.rules` (friendship-gated create +
     key-restricted update) and adds emulator rule tests; Matt publishes. *(No
     app-code change.)*
   - **H3** — Claude splits the profile doc (`AuthContext` write + rules) and
     writes the small migration; Matt runs the migration / publishes. Verify
     add-by-username still resolves names.
   - **H2** — needs **Blaze**. Claude writes the `onWrite` aggregation function
     + tightens the `public/stats` rule to server-only and drops the client
     `StatsPublisher` write; Matt enables Blaze + deploys.
4. **Anytime:** M1 (atomic spend), L1/L2 (Firestore-backed badges) as cleanup.

> Suggested sequencing note: H1 and H3 are Spark-plan-friendly (rules + a little
> code) and can ship together in one PR. H2 is the only item that needs Blaze, so
> it naturally rides along with M7 push activation (which also needs Blaze).
