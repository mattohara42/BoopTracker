import * as Notifications from 'expo-notifications';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import { db } from '@/firebase/app';

/**
 * M7 push registration — a READY-BUT-DORMANT seam.
 *
 * It is deliberately NOT called anywhere yet. Remote push can't work on the
 * current stack: Expo Go dropped remote push in SDK 53+, and there's no sender
 * deployed (the `sendBoopPush` Cloud Function needs the Blaze plan). Auto-running
 * this in the Expo Go playtest would also pop a permission prompt for a feature
 * that does nothing — so we keep it inert until there's a dev build + a deployed
 * sender. Wiring steps live in `docs/M7_PLAN.md`.
 *
 * Everything here is guarded so that if it *is* called in Expo Go it fails soft
 * (returns null) instead of throwing.
 */

/** How a push renders while the app is foregrounded. Call once at startup. */
export function configurePushHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Ask for permission, get this device's Expo push token, and store it on the
 * player's private doc (`users/{uid}/private/pushToken`) so the server sender can
 * look it up. Returns the token, or null if unavailable/declined.
 */
export async function registerForPushAsync(uid: string): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Boops',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;
    if (!granted) {
      const asked = await Notifications.requestPermissionsAsync();
      granted = asked.granted;
    }
    if (!granted) return null;

    // Throws in Expo Go (no remote push) — caught below, leaving this dormant.
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    await setDoc(
      doc(db, 'users', uid, 'private', 'pushToken'),
      { expoPushToken: token, platform: Platform.OS, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return token;
  } catch {
    // Expo Go, a declined prompt, or no network — stay silent; it's dormant.
    return null;
  }
}
