# M3 — Verification (scope)

Make boops *count*. When you boop someone who's in the app, they get notified
and **confirm** it — and for a claimed type, it asks "was it really a
Boopstache?" People who aren't in the app are verified by a **witness photo**
instead. From `docs/BUILD_PLAN.md` M3.

## The key insight: confirmation is in-app, email is just the ping

The booped person already has an account. So the confirm/deny happens **inside
the app** (a small "Boops to confirm" list), using our existing auth and rules —
no public web pages, no magic links to build. The email is only a nudge that
says "open the app, you've got a boop to confirm."

That lets us split M3 so most of it needs **no new Firebase setup**:

- **M3a — the confirm loop (no new setup):** record who the booped app-user is,
  show them a pending list, let them confirm/deny (+ the type question), reflect
  the result. Fully testable in Expo Go against what we already have.
- **M3b — the email nudge (needs setup):** a Cloud Function emails the booped
  person when a boop lands. Requires the Firebase **Blaze plan** + an **email
  provider**.
- **M3c — photo-as-proof (needs Storage):** for non-app people, upload the
  witness photo to Firebase Storage and mark the boop witnessed.

We can build and playtest **M3a now**, and only pause for decisions on M3b/M3c.

## Data model additions (`boops`)

```
subjectUid?:    string      // the booped person's uid, when they're an app user
                            // (= the picked person's friendUid at record time)
status:         'pending' | 'confirmed' | 'denied'   // app-user boops
              | 'witnessed' | 'self_reported'        // non-app boops
typeConfirmed?: boolean     // did they agree it was the claimed type
resolvedAt?:    Timestamp    // when confirmed/denied
photoPath?:     string       // Firebase Storage path (M3c) — replaces local uri
```

Recording logic: if the picked person has a `friendUid`, set `subjectUid` and
`status: 'pending'`; otherwise `status: 'self_reported'` (or `witnessed` once a
photo is attached in M3c).

## Pieces & sequence

### M3a — confirm loop  ✅ DONE
1. ✅ Record `subjectUid` + `status` on the boop (derived from the person id
   `app:{uid}`, so it works from the friends list *and* from "recent").
2. ✅ **"Boops to confirm"** — a card on Home (only when you have pending boops)
   opens `ConfirmBoopsModal` listing boops where `subjectUid == me` & pending,
   each with "Yes — that happened", "It happened, but not a {type}", and "Nope".
3. ✅ Confirm/deny writes `status` (+ `typeConfirmed`, `resolvedAt`). Denied
   boops stop counting in `deriveStats`/`deriveRecentPeople`.
4. ✅ Rules: subject can read + update only `status`/`typeConfirmed`/`resolvedAt`
   on boops where `subjectUid == me`.
5. Skipped for now: a per-boop confirmed/denied hint on the booper's side (no
   boop list to show it on without a feed — same open question as editing old
   boops).

### M3b — email nudge  ⏸️ DEFERRED (not in v1)
> **Decision 2026-08-16 (Matt):** skip the email for v1. The in-app confirm loop
> (M3a) already verifies boops with no Cloud Functions and no paid plan, and it
> fits the no-notifications design. The function below stays **dormant** in
> `functions/` (re-deployable), not deleted. If a "you got booped" nudge is
> wanted later, **push (M7)** is preferred over email. The rest of this section
> is kept as the record of the drafted approach.

6. ✅ **Drafted (not deployed):** `functions/` holds `emailBoopNudge`, an
   `onDocumentCreated('boops/{boopId}')` v2 function. On a `pending` boop with a
   `subjectUid` it looks up that user's email (Admin SDK) and writes a
   `mail/{boopId}` doc for Firebase's **Trigger Email** extension to send —
   "{booper} booped you, open BoopTracker to confirm." Idempotent (`create()`
   keyed by boop id). Typechecks; **not deployed** — deploy needs the Blaze plan
   + the Trigger Email extension installed (`functions/README.md`).
7. Later, a denied boop is where the **Free Boop** powerup comes in (M5) to
   overrule a bad denial.

### M3c — photo-as-proof (needs Storage)
8. Enable Firebase Storage; upload the witness photo (we already pick it) and
   store its path on the boop; mark `witnessed`. Also fixes today's limitation
   that `photoUri` is a local path that won't load cross-device.

## Decisions needed from Matt (for M3b/M3c, not M3a)

> **Update 2026-08-16:** M3b (email) is **deferred for v1** — verification is
> in-app only. The decisions below are therefore moot unless/until M3c
> (photo-as-proof) is pursued; Blaze is only needed for that.

1. **Upgrade Firebase to the Blaze plan.** Cloud Functions (and Storage beyond
   the small free bucket) require it. Blaze is pay-as-you-go with a generous
   free tier — a family app will almost certainly stay $0 — but it needs a
   billing account on the project. Nothing to pay to *set up*.
2. **Email provider** (SPEC left this TBD). Options:
   - **Firebase "Trigger Email" extension** — simplest to wire; you connect an
     SMTP/SendGrid account and write a doc to a `mail` collection.
   - **Resend / Postmark / SendGrid via a Function** — a bit more code, more
     control over the email. Resend has a clean free tier.
   - Recommendation: start with the **Trigger Email extension** for speed.
3. **Confirm UX** — in-app confirm (recommended, above) vs. clickable
   confirm/deny links in the email (needs public HTTP endpoints + web response
   pages). Recommend in-app.

## Open questions to settle during M3

- What happens to a boop's score contribution while it's `pending` — does it
  count immediately and get removed on denial, or only count once confirmed?
  (Affects the Home stats + leaderboards.) Lean: count immediately, subtract on
  denial — keeps the loop fast; denial is rare.
- Reminder cadence if a confirmation is ignored? (Probably out of scope for v1.)
