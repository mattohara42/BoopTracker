# M7 — Push Notifications (plan + current state)

What M7 is, what's built, and the two things that have to change before push can
actually fire. Pairs with `docs/BUILD_PLAN.md` (M7) and `functions/README.md`.

## Scope (SPEC / BUILD_PLAN)

Two pushes:
1. **A friend booped you** — ping the booped person to open the app and confirm
   (same job as the deferred M3b email; push is the preferred path, per the
   assumptions log).
2. **You unlocked an achievement** — fired when a badge is earned.

## The hard constraint: push can't run on the current stack

BoopTracker runs in **Expo Go** on the **free Spark plan**. Remote push needs
*both* of those to change:

- **Expo Go dropped remote push in SDK 53+.** A device running the app inside
  Expo Go can't obtain an Expo push token, so there's nothing to send to. Getting
  a token needs a **dev build / standalone build** (EAS — see
  `docs/APP_STORE_SETUP.md`).
- **The sender needs Blaze.** A Cloud Function making an outbound request to the
  Expo Push API requires the Blaze plan (the same upgrade the M3b email needed).

So M7 is handled exactly like M3b: **build the seams, leave them dormant,
document activation** — rather than ship a push path that can't be tried in the
current playtest loop and would just nag for a permission it can't use.

## What's built (dormant)

- **Pure content** — `src/notifications/pushCore.ts`: `boopNudgeMessage` and
  `achievementUnlockedMessage` build the notification title/body from the same
  `constants.ts` labels the rest of the app uses. Unit-tested.
- **Client registration seam** — `src/notifications/registerPush.ts`:
  - `configurePushHandler()` — foreground display behavior.
  - `registerForPushAsync(uid)` — asks permission, gets the Expo push token,
    stores it at `users/{uid}/private/pushToken`. Fully guarded (returns `null`
    in Expo Go / on denial instead of throwing).
  - **Deliberately not called anywhere yet** — wiring it in Expo Go would prompt
    for a permission the app can't use.
- **Server sender** — `sendBoopPush` in `functions/src/index.ts`: on a new
  `pending` boop, looks up the subject's token and POSTs to the Expo Push API.
  Idempotent (`pushLog/{boopId}`). Compiles; **not deployed**.
- **Data** — `users/{uid}/private/pushToken` (owner-only; the sender reads it via
  the Admin SDK). No new security rules — it lives under the existing
  `users/{uid}/private/{doc}` match.

## Activation checklist (when Matt wants real push)

1. **Blaze** — upgrade the Firebase project (as for M3b).
2. **Dev build** — `eas build` an iOS/Android build (`docs/APP_STORE_SETUP.md`);
   Expo Go can't do this step.
3. **Wire the client** — call `configurePushHandler()` at startup and
   `registerForPushAsync(uid)` once signed in (e.g. a small `PushRegistration`
   mounted component, mirroring `StatsPublisher`). Tokens start landing in
   Firestore.
4. **Deploy** — `firebase deploy --only functions` ships `sendBoopPush`.
5. **Achievement push** — decide client-local vs. server: the unlock already
   happens in-foreground (the celebration overlay), so this push mainly matters
   when the app is closed. `achievementUnlockedMessage` is ready either way.

## Notes

- **Nudge spam** carries over from M3b: any signed-in user can create a boop
  against any uid, which would push them. Fine at family scale; gate boop-create
  on a friendship in `firestore.rules` if it ever matters.
- **No deep link** — the push says "open the app and confirm"; there's no
  confirm-by-link (in-app confirm was the M3 decision).
