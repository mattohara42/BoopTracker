# Playtesting BoopTracker

How to get the app running on a real phone, and what to look for. The code runs
on **your own computer**, not in a cloud session — a phone can't reach a
sandbox dev server. It's already on GitHub, so it's a quick pull.

## Fastest path: Expo Go on a real phone

Use this one for milestone checkpoints. The whole point of M1 is *feel*: the
haptic buzz only fires on a real device (not a simulator or web), and you want
the phone in Frankie's hand.

### One-time setup (on your laptop)

1. Install Node 20+ — https://nodejs.org
2. Install the **Expo Go** app on the phone (App Store / Play Store).
3. Clone and install:
   ```bash
   git clone https://github.com/mattohara42/BoopTracker.git
   cd BoopTracker
   npm install
   ```

### Each time you want to play

```bash
npm start
```

A QR code appears in the terminal. On the phone:

- **iPhone:** open the Camera app, point it at the QR code, tap the banner.
- **Android:** open Expo Go → "Scan QR code".

The phone and laptop must be on the **same Wi-Fi**. The app loads straight into
Expo Go — no App Store, no build step. Save a code change and it hot-reloads on
the phone instantly.

> On a home network that blocks device-to-device traffic, use
> `npx expo start --tunnel` instead. Slower to start, but works anywhere.

## Other ways to run (not ideal for feel checkpoints)

- **iOS Simulator** (Mac + Xcode) / **Android Emulator** (Android Studio):
  press `i` or `a` after `npm start`. Fine for clicking through the flow, but
  **no real haptics** and no camera roll, so it won't tell you whether the
  finish moment feels good.
- **Web:** not set up (would need web deps), and haptics/photo degrade there.
  Skip it.

## What to watch for

The checkpoint questions from `BUILD_PLAN.md` — worth jotting notes on while
Frankie plays:

- **Is three taps fast?** From "I just booped someone" to "recorded" — does it
  feel like fleeing the scene, or like filling out a form?
- **Is picking the type fun or annoying?** That step is deliberately *not*
  optimized away. Does it land as a fun beat, or as friction?
- **Do the locked 🔒 slots make her want more,** or just clutter the screen?
- **The finish moment** — does the buzz + 🎉 feel like a payoff? (It's a
  placeholder for now; the real juice is M7.5.)
- Anything confusing: wrong person picked, "Someone else" awkward, etc.

Bring whatever's clunky back to the next session. That feedback is what retunes
the flow and the numbers in `src/config/constants.ts` before M2.

## Handy commands

```bash
npm start          # start the dev server + QR code
npm run typecheck  # TypeScript check
npm test           # run the unit tests
```

## Heads-up: saved on the phone, not synced

Boops and your people list now persist locally on the device (via
AsyncStorage), so a score builds up across reloads and days — good for a
week-long family playtest. It's **per-device** and not shared between phones
yet; real accounts and cross-device sync arrive in M2 (Firebase). To wipe the
slate for a fresh test, delete the app from the phone and re-open it from
Expo Go.
