import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/auth/AuthContext';
import { db } from '@/firebase/app';

import { useBoopLog } from './BoopLog';
import { usePendingBoops } from './PendingBoops';

/**
 * StatsPublisher — mirrors the signed-in player's aggregate leaderboard numbers
 * into a small public doc (`users/{uid}/public/stats`) so the M6 leaderboards
 * can rank group members without reading everyone's raw boops (which wouldn't
 * scale and would over-expose data). Only three aggregates leave the account.
 *
 * Renders nothing; it's a mounted effect, like `AchievementCelebration`. It must
 * sit inside `BoopLog` + `PendingBoops` (whose live snapshots it reads) and is
 * gated on both being `loaded`, so a fresh mount never writes 0s over real data.
 */
export function StatsPublisher() {
  const { user, profile } = useAuth();
  const { totalBoops, uniquePeopleBooped, loaded: boopsLoaded } = useBoopLog();
  const { timesBooped, loaded: pendingLoaded } = usePendingBoops();

  // Last payload we wrote, so identical snapshots don't cause redundant writes.
  const lastWritten = useRef<string | null>(null);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid || !boopsLoaded || !pendingLoaded) return;

    const payload = {
      username: profile?.username ?? '',
      totalBoops,
      uniquePeopleBooped,
      boopsReceived: timesBooped,
    };
    const signature = `${uid}|${JSON.stringify(payload)}`;
    if (signature === lastWritten.current) return;
    lastWritten.current = signature;

    void setDoc(
      doc(db, 'users', uid, 'public', 'stats'),
      { ...payload, updatedAt: serverTimestamp() },
      { merge: true },
    ).catch(() => {});
  }, [
    user,
    profile,
    totalBoops,
    uniquePeopleBooped,
    timesBooped,
    boopsLoaded,
    pendingLoaded,
  ]);

  return null;
}
