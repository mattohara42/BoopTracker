# Data model (M2) — Firebase

The Firestore schema and Firebase setup for M2 (real accounts + data). This is
the working design; refine it here as M2 gets built rather than letting code and
docs drift.

## Accounts

Firebase **Auth** (email + password) is the identity. Each player has their own
login (the family playtest decision). Kids without their own email can use Gmail
`+aliases` (e.g. `you+frankie@gmail.com`), which all land in one inbox.

## Firestore collections

### `users/{uid}`
The player's profile. `uid` is the Firebase Auth id.
```
{ username: string, usernameLower: string, email: string, createdAt: Timestamp }
```

### `usernames/{usernameLower}`
A reservation/lookup map so usernames are unique and "add a friend by username"
can resolve a handle → uid. Written in the same transaction as the profile at
signup.
```
{ uid: string }
```

### `users/{uid}/people/{personId}`  *(done)*
The player's people list — replaces the local `People` store, kept live with
onSnapshot. `personId` is a sanitized source id (e.g. `contact:123`) so
re-importing the same contact dedupes.
```
{ name: string, relation?: string, friendUid?: string }
```
> `friendUid` is set when the person is another BoopTracker account added by
> username (doc id `app:{friendUid}`); absent for contacts/guests. It's the hook
> for account-to-account features (M3 boop notifications).

### `boops/{boopId}`  *(done, incl. M3a verification + M5 powerups)*
One recorded boop, replaces the local `BoopLog`. Queried both by `booperUid ==
me` (my score) and `subjectUid == me` (boops to confirm), status filtered
client-side (no composite index needed).
```
{ booperUid: string, booperName: string,
  personId: string, personName: string,
  boopType: 'classic' | 'boopstache' | 'bellyboop' | 'underboop',
  subjectUid?: string,   // the booped person's uid, if they're an app user
  status: 'pending' | 'confirmed' | 'denied' | 'shielded' | 'self_reported',
  typeConfirmed?: boolean, resolvedAt?: Timestamp,
  overruled?: boolean,   // M5: booper spent a Free Boop to overrule a denial
  photoUri?: string /* local path for now; Storage upload is M3c */,
  at: Timestamp }
```
> A boop against an app friend starts `pending` (`subjectUid` set from the
> person id `app:{uid}`); the subject resolves it to `confirmed`/`denied`.
> Denied and `shielded` boops stop counting. Non-app boops are `self_reported`.
> **M5:** a Shield sets `status: 'shielded'` (final, can't be overruled); a Free
> Boop sets a denied boop back to `confirmed` with `overruled: true`.

### `users/{uid}/private/powerups`  *(done — M5)*
The player's powerup wallet, kept private (owner read/write only — deliberately
*not* on the signed-in-readable profile doc).
```
{ freeBoops: number /* 0..3 */, shields: number /* 0..3 */,
  refillMonth: string /* "YYYY-MM" — last month refilled */ }
```
> Caps are hard (3 each). Refill is client-side + lazy: on load, if `refillMonth`
> is older than the current month, both top back up to full and `refillMonth`
> advances (no Cloud Function → stays on the Spark plan).

### `users/{uid}/public/stats`  *(done — M6)*
The player's public leaderboard aggregates. Kept as a tiny separate doc so a
leaderboard can read one small doc per group member instead of everyone's raw
boops — cheaper, and it exposes only three numbers, not boop details/photos.
```
{ username: string,
  totalBoops: number, uniquePeopleBooped: number, boopsReceived: number,
  updatedAt: Timestamp }
```
> Written client-side by `StatsPublisher` (mirrors the signed-in player's live
> `BoopLog` + `PendingBoops` numbers), gated on both feeds loading so a fresh
> mount never overwrites real data with zeros. Read by any signed-in user (the
> M6 read widening). No Cloud Function — the counts are re-derived and re-written
> whenever the player's own boops change, so they stay on the Spark plan.

## Build order within M2

1. **Auth** — signup (username + email + password) / signin / signout, with the
   username reservation above. *(done — needs live testing once the project
   exists)*
2. **People in Firestore** — migrate `src/state/People.tsx` to
   `users/{uid}/people`; keep contacts import + add-by-username.
3. **Boops in Firestore** — migrate `src/state/BoopLog.tsx` to `boops`; Home
   stats + recent people read from real history.

## Security rules

Firestore starts in **test mode** (open to anyone for ~30 days). The real rules
live in [`firestore.rules`](../firestore.rules) at the repo root and enforce:

- **`users/{uid}`** — any signed-in user can *read* a profile (needed to resolve
  a username → display name when adding a friend); only the owner can write.
- **`users/{uid}/people`** — owner only.
- **`users/{uid}/private/{doc}`** — owner only (M5 powerup wallet lives here).
- **`users/{uid}/public/{doc}`** — any signed-in user can *read* (leaderboards
  rank group members); only the owner writes. M6 aggregate stats live here.
- **`usernames/{name}`** — any signed-in user can read (lookup + uniqueness
  check); you can only create one pointing to your own uid, and existing ones
  can't be overwritten or deleted (that's what keeps usernames unique).
- **`boops`** — you can only read/write boops where `booperUid` is you.

> Reads are deliberately tight for M2. M3 (notify the booped person) widened the
> boops read to the subject; M6 (leaderboards) widened reads to the per-user
> `public/{doc}` aggregate, **not** the raw boops. Widen per feature, not by
> re-opening everything.

### Deploy the rules

No CLI needed — paste them in the console:
Firebase console → **Firestore Database → Rules** → replace the contents with
[`firestore.rules`](../firestore.rules) → **Publish**. Re-do this whenever the
file changes.

## First-time Firebase setup (Matt)

1. https://console.firebase.google.com → **Add project** (e.g. "BoopTracker").
   Google Analytics optional — skip is fine.
2. In the project, **Build → Authentication → Get started → Email/Password →
   Enable**.
3. **Build → Firestore Database → Create database → Start in test mode** →
   pick a location.
4. Project settings (gear icon) → **Your apps → Web (`</>`)** → register an app
   (nickname "BoopTracker", no Hosting) → copy the `firebaseConfig` values.
5. In the repo, copy `.env.example` to `.env`, paste the values (mapping is in
   that file), and restart `npm start`.
