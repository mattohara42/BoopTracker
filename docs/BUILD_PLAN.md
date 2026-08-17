# Boop App - Build Plan

Milestones are meant to be built and tested in order. Each one should produce
something Frankie can actually try, even if it's rough.

> **Status (2026-08-17):** M0 ✅ · M1 ✅ · M2 ✅ (rules pending publish) ·
> M3 (M3a shipped — in-app confirm; M3b email **deferred**; M3c photos optional) ·
> M4 ✅ · M5 ✅ (incl. stacked boop-type-family powerup choice) · M6 ✅
> (leaderboards — needs the `public/{doc}` rule published) · M7 ⏸️ (push
> foundation built but dormant — needs a dev build + Blaze) · M7.5 ✅ (real
> confetti + payoff pops) · M8 not started.
> Live detail in [`HANDOFF.md`](../HANDOFF.md); M3 breakdown in
> [`M3_PLAN.md`](M3_PLAN.md).

## M0: Repo Skeleton  ✅
- Expo project init, React Native
- Basic navigation: Home screen, placeholder screens for Friends/Leaderboard
- Config object for tunable constants (powerup caps, achievement thresholds, etc.),
  following the usual pattern: one place to tune numbers, not scattered through code
- CLAUDE.md written for this repo (working conventions, assumptions log)

## M1: The Boop Button (fake data)  ✅
- Home screen with the BOOP button
- Three-tap flow: button -> pick person (hardcoded fake friend list) -> pick boop
  type (Classic, Boopstache, Bellyboop, Underboop, plus greyed-out locked slots)
- Optional photo attach step (pulls from camera roll, no in-app camera)
- Finish screen: haptic buzz, confetti placeholder
- No backend yet, everything stored in local state. Goal is to get the FEEL of the
  flow right before wiring up real data.
- Checkpoint: hand to Frankie to try. Is three taps actually fast? Does picking the
  type feel fun or annoying?

## M2: Real Accounts and Data  ✅ (security rules pending publish)
- Firebase project setup, Firestore schema for users, boops, friendships
- Signup: username + email
- Friends list: add by username, "someone else" for non-app people
- Boop recording now writes to Firestore instead of local state
- Recent people list populated from real boop history

## M3: Verification  (M3a shipped — see M3_PLAN.md)
- ✅ In-app confirm: the booped app-user confirms/denies in a "boops to confirm"
  list, and for a claimed type is asked "was it a Boopstache?" (yes/no). This is
  the shipped v1 verification.
- ⏸️ Email nudge to ping the booped person — **deferred (not in v1).** Function
  drafted + dormant in `functions/`; a push nudge (M7) is the likelier future path.
- ⏳ Photo-as-proof path for non-app people: attach photo, mark as witnessed (M3c,
  optional — needs Storage/Blaze)

## M4: Achievements (Week One Set)  ✅ (big-deal powerup grant deferred to M5)
- ✅ **Evaluation core** — `src/features/achievements/achievementsCore.ts`, a
  pure, unit-tested evaluator of all 14 week-one achievements (thresholds from
  `constants.ts`, unlock ladder + retune from the design gate). No React/Firebase;
  the app layer feeds it boops + context and diffs against what's already earned.
- ✅ Wired to live data — `src/state/Achievements.tsx` joins boops → people for
  `relation` (`buildAchievementInput`); `timesBooped` from PendingBoops (non-denied
  received), `friendsCount` from People. Earned set persisted as a grow-only union
  (badges kept once earned); seeds silently on first load, celebrates only new ones.
- ✅ Badge unlock UI — `AchievementCelebration`, a global overlay (confetti +
  haptic) that fires wherever a badge is earned, not just the finish screen.
- ✅ Boop-type Ladder enforced in the picker — `boopTypesCore.ts` + `PickType`
  grey Boopstache/Bellyboop/Underboop until 5/10/15 total boops.
- ✅ Relation picker (tag a friend Brother/Sister/…) — unblocks Sibling badges.
- ✅ Achievement list screen — the **Awards** tab (trophy case of all 14).
- ⏳ "Big deal" Free Boop / Shield **choice** — recognised + teased, but the grant
  needs the powerup store, so it moves to **M5** (build in order). The type-family
  big-deal moment has its seam ready (`boopTypesUnlockedBetween`, tested).

## M5: Powerups  ✅ (one design call deferred — see last bullet)
- ✅ Free Boop and Shield state per user, Firestore-backed — pure
  `powerupsCore.ts` + `Powerups.tsx` (private doc `users/{uid}/private/powerups`).
- ✅ Cap enforcement (3 each, no stockpiling) — clamped in the core; spend/grant
  go through Firestore transactions so they can't go negative or past the cap.
- ✅ Monthly refill — **client-side + lazy** (month-keyed), NOT a scheduled Cloud
  Function: staying on Spark, we top up to full on the first app-open of a new
  month. (Blaze + a scheduled function refilling everyone at 00:00 on the 1st is
  the upgrade if we ever go paid.)
- ✅ Free Boop flow: overrule a denied confirmation — Home "⚡ denied — overrule?"
  card → `OverruleBoopsModal`; spends a Free Boop, flips the boop back to counting.
- ✅ Shield flow: block an incoming boop — new `shielded` status; "🛡️ Shield it"
  in the confirm list spends a Shield and the boop stops counting (final, not
  overrulable).
- ✅ Big-deal **badge** → Free Boop / Shield choice, wired into the M4 unlock
  celebration (Boop Received, Boop Collector).
- ✅ Big-deal **boop-type-family unlock** → choice, wired to **stack** (Matt's
  call): crossing 5/10/15 boops enqueues a Free Boop / Shield pick on top of any
  badge at the same moment, so 10 boops = two picks (Boop Collector + Bellyboop).
  The celebration queue carries a `CelebrationItem` union; seeded silently so
  existing accounts don't get retroactive powerups.

## M6: Leaderboards  ✅
- ✅ Family group and friend group leaderboards. Groups are derived from the
  existing people list (no new "groups" collection): **Friends** = every
  app-account friend; **Family** = app friends tagged with a family relation
  (`leaderboardCore.groupMemberUids`). You're always in both. Only app accounts
  appear — a non-app contact has no stats to rank.
- ✅ The four stats (`LEADERBOARD_STATS`): most unique people booped, most total
  boops, most boops received, least boops received. Ranking (ties = competition
  ranking; only "least received" ascending) is pure + tested in `leaderboardCore`.
- ✅ All-time only for v1 (week/month windows stay BACKLOG).
- **How the cross-user data works (no Cloud Function, still Spark):** each player
  publishes a small `users/{uid}/public/stats` doc (`StatsPublisher`); the screen
  reads one doc per group member + folds in my own live numbers. This is the
  deliberate M6 read widening — a per-user **aggregate** doc, not everyone's raw
  boops. New `firestore.rules` match: `users/{uid}/public/{doc}` read = any
  signed-in user, write = owner. **Needs publishing** (Matt) with the rest.
- ⏳ Not in v1: the "win a leaderboard for a full month" big-deal achievement is
  time-windowed, which v1 leaderboards deliberately aren't — left for when
  month-windowed views land (BACKLOG).

## M7: Push Notifications  ⏸️ (foundation built, dormant — needs a dev build + Blaze)
- Push when a friend boops you, and when you unlock an achievement.
- **Can't run on the current stack** (Expo Go dropped remote push in SDK 53+; the
  sender needs Blaze), so handled like M3b: seams built, dormant, documented.
  - ✅ Pure content (`src/notifications/pushCore.ts`, tested).
  - ✅ Client registration seam (`registerForPush.ts` — permission + token →
    `users/{uid}/private/pushToken`), guarded, **not auto-called** (no permission
    nag in Expo Go).
  - ✅ Server sender (`sendBoopPush` in `functions/`, Expo Push API, idempotent) —
    compiles, **not deployed**.
- Activation checklist (Blaze + a dev build + wire the client + deploy) in
  [`M7_PLAN.md`](M7_PLAN.md).

## M7.5: Juice Pass  ✅ (confetti + payoff pops; sound still optional)
- ✅ Real confetti — `src/features/juice/Confetti.tsx` (React Native `Animated`,
  no extra dep, safe in Expo Go), layout math in the pure/tested `confettiCore`.
  Replaces the static 🎉 in the finish screen **and** the achievement celebration.
- ✅ Payoff "pop" — a spring scale on the finish headline and the celebration
  badge to land the unlock moment.
- ⏳ Sound effects for boop/achievement — still **optional, ask Frankie** (SPEC);
  not added (no verified kid-facing audio assets, and it's gated on him).
- Locked-boop-type teaser polish is light-touch for now; deeper juice there can
  ride a later pass.

## M8: Playtest and Fix
- Real usage with the family for a week
- Fix whatever's annoying (this is where "is 3 taps too many" gets answered for
  real, not guessed)

## Distribution (orthogonal to the milestones)
Not a numbered milestone — the app runs in **Expo Go** for all of M1–M8, which is
the fastest playtest loop. When a wider family test needs the app on a phone
*without* Expo Go (a relative who won't scan a QR), or a real release is on the
table, the practical path — Apple Developer + Xcode, EAS Build, TestFlight, and
the Android/Play equivalents — lives in [`APP_STORE_SETUP.md`](APP_STORE_SETUP.md).
The kids-privacy questions there gate any *public* release; TestFlight/internal
testing within the family does not.

---

Design gate before M4: confirm the week-one achievement thresholds still feel right
once M1-M3 are actually built and used. Numbers were guessed during brainstorming,
not tested. Worksheet to fill in: [`M4_DESIGN_GATE.md`](M4_DESIGN_GATE.md) — the
threshold retune plus the boop-type unlock order (which blocks M4).
