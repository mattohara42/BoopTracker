/**
 * BoopTracker Cloud Functions — the two dormant server nudges.
 *
 * - `emailBoopNudge` (M3b) — email the booped person (via the Trigger Email
 *   extension).
 * - `sendBoopPush` (M7) — push-notify the booped person (via the Expo Push API).
 *
 * Both fire on the same event (a new `pending` boop against an app user) and
 * serve the same purpose: nudge them to open the app and confirm. Neither is
 * deployed — see docs/M3_PLAN.md, docs/M7_PLAN.md and functions/README.md.
 *
 * M3b (email): when a boop lands against an app user (`status == 'pending'`,
 * `subjectUid` set), email that person so they open the app and confirm it.
 * Confirmation itself is *in-app* (M3a) — this email is only the ping. See
 * docs/M3_PLAN.md ("confirmation is in-app, email is just the ping").
 *
 * Delivery is done by Firebase's **Trigger Email** extension, not by this
 * function directly. This function's whole job is to compose one document in
 * the `mail` collection; the extension watches that collection and does the
 * SMTP send. Keeping the send in the extension means no SMTP creds live in our
 * code, and the email provider can change without touching this function.
 *
 * Why a function at all (vs. the client writing `mail` directly): the send must
 * be server-authoritative. The booper's app must never learn the subject's
 * email, and must not be able to email an arbitrary address — so we look the
 * address up here with the Admin SDK (which bypasses security rules) from the
 * trusted `subjectUid` on the boop.
 *
 * NOT DEPLOYED YET. Deploying needs the Blaze plan + the Trigger Email
 * extension installed (see functions/README.md). Until then this is a draft
 * that compiles and is ready to `firebase deploy --only functions`.
 */

import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

/**
 * Human labels for each boop type. Mirrors `BOOP_TYPES` in
 * `src/config/constants.ts` — kept as a small local copy because the app code
 * is an Expo/React Native bundle with `@/*` path aliases that this plain-Node
 * function can't import. If a type label changes there, change it here too.
 */
const BOOP_TYPE_LABELS: Record<string, string> = {
  classic: "Classic Boop",
  boopstache: "Boopstache",
  bellyboop: "Bellyboop",
  underboop: "Underboop",
};

/**
 * On every new boop, nudge the booped app user by email.
 *
 * Idempotent: the mail doc id is the boop id, and we `create()` (not `set()`),
 * so a function retry — or a re-run against an existing boop — can never queue
 * a second email for the same boop.
 */
export const emailBoopNudge = onDocumentCreated(
  "boops/{boopId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const boop = snap.data();
    const boopId = event.params.boopId;

    // Only app-user boops awaiting confirmation get a nudge. Self-reported
    // boops (no subject) and anything already resolved are skipped.
    if (boop.status !== "pending" || !boop.subjectUid) {
      return;
    }
    const subjectUid = boop.subjectUid as string;

    // Look up the booped person's email from their profile (Admin SDK bypasses
    // rules; the client never sees this).
    const userSnap = await db.doc(`users/${subjectUid}`).get();
    const email = userSnap.get("email") as string | undefined;
    if (!email) {
      logger.warn(
        `No email for subject ${subjectUid} (boop ${boopId}); skipping nudge.`,
      );
      return;
    }

    const booper = (boop.booperName as string) || "Someone";
    const typeLabel = BOOP_TYPE_LABELS[boop.boopType as string] ?? "boop";

    const subject = `👉 ${booper} booped you on BoopTracker!`;
    const text = [
      `${booper} says they got you with a ${typeLabel}.`,
      "",
      "Did it really happen? Open the BoopTracker app and tap the " +
        "“🔔 boop to confirm” card on your Home screen " +
        "to confirm it — or say it wasn’t that kind.",
      "",
      "Boop back soon! 👉👃",
    ].join("\n");
    const html = [
      `<p><strong>${escapeHtml(booper)}</strong> says they got you with a ` +
        `<strong>${escapeHtml(typeLabel)}</strong>.</p>`,
      "<p>Did it really happen? Open the <strong>BoopTracker</strong> app " +
        "and tap the &ldquo;🔔 boop to confirm&rdquo; card on your " +
        "Home screen to confirm it &mdash; or say it wasn&rsquo;t that kind." +
        "</p>",
      "<p>Boop back soon! 👉👃</p>",
    ].join("\n");

    // Compose the mail doc for the Trigger Email extension. Doc id == boopId
    // keeps it one-email-per-boop.
    try {
      await db.doc(`mail/${boopId}`).create({
        to: email,
        message: {subject, text, html},
      });
      logger.info(`Queued boop nudge for ${subjectUid} (boop ${boopId}).`);
    } catch (err) {
      // ALREADY_EXISTS (gRPC code 6): the nudge was already queued — a retry.
      if ((err as {code?: number}).code === 6) {
        logger.info(`Nudge for boop ${boopId} already queued; skipping.`);
        return;
      }
      throw err;
    }
  },
);

/**
 * On every new boop, push-notify the booped app user (M7).
 *
 * Same trigger and gate as the email nudge, but delivery is a POST to the Expo
 * Push API using the token the subject's device stored at
 * `users/{uid}/private/pushToken` (written by `registerForPushAsync`). Like the
 * email, the send is server-authoritative: the booper's client never learns the
 * subject's token, and the token is looked up here from the trusted `subjectUid`.
 *
 * Idempotent: a `pushLog/{boopId}` marker is `create()`d before sending, so a
 * retry or a re-run can't push twice for the same boop.
 *
 * NOT DEPLOYED. Needs the Blaze plan (outbound network from a function) and a
 * dev build on the devices (Expo Go can't obtain a push token) — see
 * docs/M7_PLAN.md and functions/README.md.
 */
export const sendBoopPush = onDocumentCreated(
  "boops/{boopId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const boop = snap.data();
    const boopId = event.params.boopId;

    if (boop.status !== "pending" || !boop.subjectUid) {
      return;
    }
    const subjectUid = boop.subjectUid as string;

    // The subject's Expo push token, stored on their private doc.
    const tokenSnap = await db.doc(`users/${subjectUid}/private/pushToken`).get();
    const token = tokenSnap.get("expoPushToken") as string | undefined;
    if (!token) {
      logger.info(
        `No push token for subject ${subjectUid} (boop ${boopId}); skipping.`,
      );
      return;
    }

    // Idempotency marker — create() fails if we've already pushed this boop.
    try {
      await db.doc(`pushLog/${boopId}`).create({sentAt: new Date()});
    } catch (err) {
      if ((err as {code?: number}).code === 6) {
        logger.info(`Push for boop ${boopId} already sent; skipping.`);
        return;
      }
      throw err;
    }

    const booper = (boop.booperName as string) || "Someone";
    const typeLabel = BOOP_TYPE_LABELS[boop.boopType as string] ?? "boop";

    const message = {
      to: token,
      title: `👉 ${booper} booped you!`,
      body:
        `They say it was a ${typeLabel}. Open BoopTracker to confirm ` +
        "— or say it wasn't.",
      sound: "default",
    };

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    if (!res.ok) {
      logger.warn(
        `Expo push failed for boop ${boopId}: ${res.status} ${res.statusText}`,
      );
      return;
    }
    logger.info(`Pushed boop nudge to ${subjectUid} (boop ${boopId}).`);
  },
);

/** Minimal HTML-escape for the couple of user-controlled strings in the email. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
