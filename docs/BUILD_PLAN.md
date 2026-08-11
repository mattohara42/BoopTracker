# Boop App - Build Plan

Milestones are meant to be built and tested in order. Each one should produce
something Frankie can actually try, even if it's rough.

## M0: Repo Skeleton
- Expo project init, React Native
- Basic navigation: Home screen, placeholder screens for Friends/Leaderboard
- Config object for tunable constants (powerup caps, achievement thresholds, etc.),
  following the usual pattern: one place to tune numbers, not scattered through code
- CLAUDE.md written for this repo (working conventions, assumptions log)

## M1: The Boop Button (fake data)
- Home screen with the BOOP button
- Three-tap flow: button -> pick person (hardcoded fake friend list) -> pick boop
  type (Classic, Boopstache, Bellyboop, Underboop, plus greyed-out locked slots)
- Optional photo attach step (pulls from camera roll, no in-app camera)
- Finish screen: haptic buzz, confetti placeholder
- No backend yet, everything stored in local state. Goal is to get the FEEL of the
  flow right before wiring up real data.
- Checkpoint: hand to Frankie to try. Is three taps actually fast? Does picking the
  type feel fun or annoying?

## M2: Real Accounts and Data
- Firebase project setup, Firestore schema for users, boops, friendships
- Signup: username + email
- Friends list: add by username, "someone else" for non-app people
- Boop recording now writes to Firestore instead of local state
- Recent people list populated from real boop history

## M3: Verification
- Email notification sent when an app user gets booped
- Notification includes a confirm step, and for boops with a claimed type, asks
  "was it a Boopstache?" (yes/no)
- Photo-as-proof path for non-app people: attach photo, mark as witnessed
- Cloud Function to handle the confirm/deny logic

## M4: Achievements (Week One Set)
- Cloud Function(s) to evaluate the 14 week-one achievements from SPEC.md against
  boop history
- Badge unlock UI: confetti + badge on the finish screen
- "Big deal" achievements trigger the Free Boop / Shield choice screen
- Achievement list screen (even if bare-bones) so you can see what you've unlocked

## M5: Powerups
- Free Boop and Shield state per user, Firestore-backed
- Cap enforcement (3 each, no stockpiling)
- Monthly refill logic (1st of the month, Cloud Function on a schedule)
- Free Boop flow: overrule a denied confirmation
- Shield flow: next incoming boop against you doesn't count, consume the shield

## M6: Leaderboards
- Family group and friend group leaderboards
- Three stats each: most unique people booped, most total boops, most/least boops
  received
- All-time only for v1

## M7: Push Notifications
- Push notification when a friend boops you (in addition to email)
- Push notification when you unlock an achievement

## M7.5: Juice Pass
- Confetti animation actually good, not a placeholder
- Sound effects for boop/achievement (optional, ask Frankie)
- Polish the finish screen, the locked-boop-type teaser, the badge unlock moment

## M8: Playtest and Fix
- Real usage with the family for a week
- Fix whatever's annoying (this is where "is 3 taps too many" gets answered for
  real, not guessed)

---

Design gate before M4: confirm the week-one achievement thresholds still feel right
once M1-M3 are actually built and used. Numbers were guessed during brainstorming,
not tested.
