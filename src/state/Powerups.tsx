import { doc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/auth/AuthContext';
import { db } from '@/firebase/app';

import {
  applyMonthlyRefill,
  grant as grantCore,
  initialPowerups,
  needsRefill,
  spend as spendCore,
  type PowerupKind,
  type PowerupState,
} from './powerupsCore';

// Re-export so screens import powerup types from '@/state/Powerups'.
export type { PowerupKind, PowerupState } from './powerupsCore';

/**
 * Powerups (M5) — the player's Free Boops + Shields, stored privately in
 * Firestore at `users/{uid}/private/powerups` and kept live with onSnapshot.
 * Pure rules (caps, grant, spend, monthly refill) live in `powerupsCore.ts`.
 *
 * The monthly refill is done client-side and lazily: whenever we load (or the
 * month rolls over while open) we top both powerups back to full if we've
 * crossed into a new month. That avoids a scheduled Cloud Function — which would
 * need the Blaze plan — and keeps v1 on the free Spark plan, consistent with the
 * M3b/M4 "stay on Spark" decisions. Reads/writes are the owner's only (rules).
 */
interface PowerupsValue {
  powerups: PowerupState;
  /** False until the first snapshot lands (and the doc is ensured to exist). */
  loaded: boolean;
  /** Grant one powerup of the chosen kind — the "big deal" achievement reward. */
  grant: (kind: PowerupKind) => void;
  /** Spend one; resolves true if it was spent, false if none were held. */
  spend: (kind: PowerupKind) => Promise<boolean>;
}

const EMPTY: PowerupState = { freeBoops: 0, shields: 0, refillMonth: '' };

const PowerupsContext = createContext<PowerupsValue | null>(null);

export function PowerupsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [powerups, setPowerups] = useState<PowerupState>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  const ref = useCallback(() => {
    if (!uid) throw new Error('Not signed in');
    return doc(db, 'users', uid, 'private', 'powerups');
  }, [uid]);

  useEffect(() => {
    setLoaded(false);
    if (!uid) {
      setPowerups(EMPTY);
      return;
    }
    const docRef = doc(db, 'users', uid, 'private', 'powerups');
    return onSnapshot(docRef, (snap) => {
      if (!snap.exists()) {
        // First run for this account: seed a full set, keyed to this month.
        void setDoc(docRef, initialPowerups(Date.now())).catch(() => {});
        return; // the next snapshot delivers the seeded doc
      }
      const data = snap.data() as PowerupState;
      setPowerups(data);
      setLoaded(true);
      // Lazy monthly refill: if the month rolled over, top back up to full.
      if (needsRefill(data, Date.now())) {
        void runTransaction(db, async (tx) => {
          const cur = await tx.get(docRef);
          if (!cur.exists()) return;
          const state = cur.data() as PowerupState;
          const refilled = applyMonthlyRefill(state, Date.now());
          if (refilled !== state) tx.set(docRef, refilled);
        }).catch(() => {});
      }
    });
  }, [uid]);

  const grant = useCallback(
    (kind: PowerupKind) => {
      if (!uid) return;
      const docRef = ref();
      void runTransaction(db, async (tx) => {
        const cur = await tx.get(docRef);
        const state = cur.exists()
          ? (cur.data() as PowerupState)
          : initialPowerups(Date.now());
        tx.set(docRef, grantCore(state, kind));
      }).catch(() => {});
    },
    [uid, ref],
  );

  const spend = useCallback(
    async (kind: PowerupKind): Promise<boolean> => {
      if (!uid) return false;
      const docRef = ref();
      try {
        return await runTransaction(db, async (tx) => {
          const cur = await tx.get(docRef);
          if (!cur.exists()) return false;
          const next = spendCore(cur.data() as PowerupState, kind);
          if (!next) return false; // none to spend
          tx.set(docRef, next);
          return true;
        });
      } catch {
        return false;
      }
    },
    [uid, ref],
  );

  const value = useMemo<PowerupsValue>(
    () => ({ powerups, loaded, grant, spend }),
    [powerups, loaded, grant, spend],
  );

  return <PowerupsContext.Provider value={value}>{children}</PowerupsContext.Provider>;
}

export function usePowerups(): PowerupsValue {
  const ctx = useContext(PowerupsContext);
  if (!ctx) {
    throw new Error('usePowerups must be used within a PowerupsProvider');
  }
  return ctx;
}
