import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { auth, db } from '@/firebase/app';

/**
 * AuthContext — who's signed in, and the sign up / in / out actions.
 *
 * Accounts are Firebase Auth email+password (the family playtest decision).
 * The username lives in a `users/{uid}` profile doc and is reserved in a
 * `usernames/{lower}` doc so two people can't take the same handle — that
 * reservation map is also what M2's "add a friend by username" looks up.
 */
export interface Profile {
  username: string;
}

interface AuthValue {
  user: User | null;
  profile: Profile | null;
  /** True until the first auth state (and profile) has resolved. */
  initializing: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const snap = await getDoc(doc(db, 'users', nextUser.uid));
        setProfile(snap.exists() ? (snap.data() as Profile) : null);
      } else {
        setProfile(null);
      }
      setInitializing(false);
    });
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      profile,
      initializing,
      async signUp(email, password, username) {
        const handle = username.trim();
        const handleLower = handle.toLowerCase();
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        try {
          await runTransaction(db, async (tx) => {
            const nameRef = doc(db, 'usernames', handleLower);
            const nameSnap = await tx.get(nameRef);
            if (nameSnap.exists()) throw new Error('That username is already taken.');
            tx.set(nameRef, { uid: cred.user.uid });
            tx.set(doc(db, 'users', cred.user.uid), {
              username: handle,
              usernameLower: handleLower,
              email: email.trim(),
              createdAt: serverTimestamp(),
            });
          });
          await updateProfile(cred.user, { displayName: handle });
          setProfile({ username: handle });
        } catch (err) {
          // Roll back the half-created account so the email is free to retry.
          await cred.user.delete().catch(() => {});
          throw err;
        }
      },
      async signIn(email, password) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      async signOut() {
        await fbSignOut(auth);
      },
    }),
    [user, profile, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
