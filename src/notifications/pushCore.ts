import { BOOP_TYPES, type BoopTypeId } from '@/config/constants';

/**
 * pushCore — the pure content of the M7 push notifications, no `expo-notifications`
 * or Firebase in it (the `*Core.ts` pattern), so the copy is unit-testable. Both
 * the client (for a local notification) and the dormant Cloud Function sender
 * (`functions/`) build their user-facing text from the same shapes.
 *
 * NOTE: unlike the plain-Node Cloud Function — which keeps its own copy of the
 * boop-type labels because it can't import the `@/*` bundle — this is app code,
 * so it reads the labels straight from `constants.ts` (the one source).
 */

export interface PushMessage {
  title: string;
  body: string;
}

function boopTypeLabel(id: BoopTypeId | string): string {
  return BOOP_TYPES.find((t) => t.id === id)?.label ?? 'boop';
}

/** "A friend booped you" — the ping to open the app and confirm (SPEC M7). */
export function boopNudgeMessage(booperName: string, boopType: BoopTypeId | string): PushMessage {
  const who = booperName.trim() || 'Someone';
  return {
    title: `👉 ${who} booped you!`,
    body: `They say it was a ${boopTypeLabel(boopType)}. Open BoopTracker to confirm — or say it wasn't.`,
  };
}

/** "You unlocked an achievement" (SPEC M7). */
export function achievementUnlockedMessage(label: string): PushMessage {
  return {
    title: '🏅 Achievement unlocked!',
    body: `You earned “${label}”. Open BoopTracker to see it in your trophy case.`,
  };
}
