# BoopTracker Cloud Functions

M3b — the **email nudge**. When someone boops an app user, `emailBoopNudge`
emails the booped person so they open the app and confirm it. Confirmation is
in-app (M3a); this is only the ping. See `docs/M3_PLAN.md`.

## How it works

```
boop created (status: 'pending', subjectUid set)
        │
        ▼
emailBoopNudge  (this function)   ── looks up subject's email (Admin SDK)
        │                             composes one doc in `mail/{boopId}`
        ▼
Trigger Email extension            ── watches `mail`, does the SMTP send
        │
        ▼
booped person's inbox
```

The function never sends mail itself — it writes a `mail` doc and the **Firebase
"Trigger Email" extension** delivers it. So no SMTP credentials live in this
repo, and swapping email providers is an extension-config change, not a code
change.

## One-time setup (needs the Blaze plan)

1. **Upgrade the Firebase project to Blaze** (pay-as-you-go). Cloud Functions
   require it; a family app will almost certainly stay within the free tier.
2. **Install the Trigger Email extension:** Firebase console → **Extensions** →
   *Trigger Email from Firestore* → Install. During setup:
   - **Collection path:** `mail`  ← must match the code.
   - **SMTP connection URI:** from your provider (e.g. SendGrid, Mailgun,
     Resend, or a Gmail app password for testing).
   - **Default FROM address:** e.g. `BoopTracker <no-reply@yourdomain>`.
3. **Install the Firebase CLI** (once, on Matt's machine):
   `npm install -g firebase-tools` → `firebase login`.

## Deploy

```bash
cd functions
npm install
npm run typecheck        # or: npm run build
cd ..
firebase use <your-project-id>     # first time only
firebase deploy --only functions
```

## Test it

- Boop a second account (the two-account flow in `HANDOFF.md`).
- That account should get an email within a few seconds.
- `firebase functions:log` (or `npm run logs` in `functions/`) shows
  `Queued boop nudge …`.
- The `mail/{boopId}` doc gets a `delivery` field written by the extension —
  `state: SUCCESS` means it sent.

## Notes / limits (v1)

- **Idempotent:** the mail doc id is the boop id and we `create()` it, so a
  retry never double-sends.
- **No deep link:** the email tells the reader to open the app and tap the
  "🔔 boop to confirm" card — there's no confirm-by-link (that would need public
  web pages; in-app confirm was the M3 decision).
- **Nudge spam:** any signed-in user can resolve a username → uid and create a
  boop, which emails that person. Fine for a family app; if it ever matters,
  gate boop creation on an existing friend relationship in `firestore.rules`.

---

## M7 — the push nudge (`sendBoopPush`, also dormant)

`sendBoopPush` fires on the same event as the email and does the same job — ping
the booped person to open the app and confirm — but delivers a **push** instead
of an email. It reads the subject's Expo push token from
`users/{uid}/private/pushToken` (written by the app's `registerForPushAsync`) and
POSTs to the **Expo Push API** (`https://exp.host/--/api/v2/push/send`). No
extension needed; idempotent via a `pushLog/{boopId}` marker.

**It is not deployed, and it can't be exercised on the current stack.** Two
things are required first (details in `docs/M7_PLAN.md`):

1. **Blaze plan** — outbound network from a function needs it (same upgrade the
   email nudge needs).
2. **A dev build on the devices** — Expo Go dropped remote push in SDK 53+, so a
   device running in Expo Go can never obtain the push token this function needs.
   Build with EAS (`docs/APP_STORE_SETUP.md`) and call `registerForPushAsync`
   from the app so a token lands in Firestore; only then does this function have
   anything to send to.

Deploy is the same `firebase deploy --only functions` — it ships both functions.
If you want only one, deploy by name (`--only functions:sendBoopPush`).
