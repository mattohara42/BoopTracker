/**
 * fakeFriends.ts — hardcoded people for M1.
 *
 * No backend yet (that's M2). This is a stand-in friend/family list so the
 * three-tap flow has real names to pick from while we test the *feel*. Real
 * friends (add by username, "someone else" for non-app people) replace this
 * in M2.
 */
export interface Person {
  id: string;
  name: string;
  /** How they relate to the player — shown as a subtitle in the picker. */
  relation?: string;
  /**
   * When set, this person is another BoopTracker *account* (added by username),
   * and this is their uid. Absent for contacts/guests. Used later for
   * account-to-account features like boop notifications (M3).
   */
  friendUid?: string;
}

export const FAKE_FRIENDS: readonly Person[] = [
  { id: 'matt', name: 'Matt', relation: 'Dad' },
  { id: 'mom', name: 'Mom' },
  { id: 'alex', name: 'Alex', relation: 'Brother' },
  { id: 'sam', name: 'Sam', relation: 'Sister' },
  { id: 'grandma', name: 'Grandma' },
  { id: 'jordan', name: 'Jordan', relation: 'Friend' },
] as const;
