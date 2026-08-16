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

### `boops/{boopId}`  *(done)*
One recorded boop, replaces the local `BoopLog`. Queried by `booperUid == me`
and sorted client-side (no composite index needed). Verification fields
(confirmed/denied, witness) arrive in M3.
```
{ booperUid: string, personId: string, personName: string,
  boopType: 'classic' | 'boopstache' | 'bellyboop' | 'underboop',
  photoUri?: string /* local path for now; Storage upload is M3 */,
  at: Timestamp }
```

## Build order within M2

1. **Auth** — signup (username + email + password) / signin / signout, with the
   username reservation above. *(done — needs live testing once the project
   exists)*
2. **People in Firestore** — migrate `src/state/People.tsx` to
   `users/{uid}/people`; keep contacts import + add-by-username.
3. **Boops in Firestore** — migrate `src/state/BoopLog.tsx` to `boops`; Home
   stats + recent people read from real history.

## Security rules (before real use)

Firestore starts in **test mode** (open) so we can build fast. Before the family
actually uses it, lock it down: a user can read/write only their own `users/{uid}`
doc and their own `boops`; `usernames` is create-if-absent. Tracked as a to-do —
don't ship test-mode rules to real use.

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
