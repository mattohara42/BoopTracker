import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as fbAuth from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase bootstrap (M2).
 *
 * Config comes from EXPO_PUBLIC_FIREBASE_* env vars (see `.env.example`). The
 * web config values are NOT secret — anyone can read them from a shipped app;
 * security is enforced by Firestore rules, not by hiding these. We keep them in
 * `.env` (gitignored) just to keep per-environment values out of source.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * False until `.env` is filled in. Lets the app show a friendly "add your
 * Firebase config" screen instead of a cryptic crash during setup.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// getReactNativePersistence ships in Firebase's React Native build but isn't in
// the default web typings. Reach it defensively so this compiles everywhere and
// falls back to default persistence off-device (e.g. web/tests).
const rnPersistence = (
  fbAuth as unknown as {
    getReactNativePersistence?: (storage: unknown) => fbAuth.Persistence;
  }
).getReactNativePersistence;

export const auth: fbAuth.Auth = rnPersistence
  ? fbAuth.initializeAuth(app, { persistence: rnPersistence(AsyncStorage) })
  : fbAuth.getAuth(app);

// Auto-detect long polling — avoids the WebChannel connectivity issues Firestore
// can hit on React Native.
export const db: Firestore = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

export { app };
