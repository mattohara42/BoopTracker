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
4. **Firebase config** (the app needs it now): copy `.env.example` to `.env` and
   paste your project's web config values. Full steps in `docs/DATA_MODEL.md`.
   Without this, the app shows a "add your Firebase config" screen instead of
   crashing — but it can't sign in until `.env` is set.

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

The M1 core loop is validated (three taps feels fast, type-picking is fun). What
needs eyes now is the **account + verification** flow. This needs **two
accounts** — sign out from Home (top-left) to switch, and use Gmail `+aliases`
(e.g. `you+frankie@gmail.com`) for a second one.

- **Signup / signin** — does creating an account and getting into the app feel
  smooth? Any confusing errors?
- **Add a friend by username** (Friends tab) — add your other account; does it
  confirm clearly?
- **Boop a friend, then confirm it** — boop account B from account A; on B, the
  Home **"🔔 boops to confirm"** card should appear → confirm / "not that type" /
  deny → account A's score should react (a denied boop stops counting).
- **Cross-device / persistence** — force-quit and reopen; your score and people
  are still there (that's the cloud, not local storage).
- Anything confusing or slow.

> If you ever see **"Missing or insufficient permissions"**, that's a security
> rule needing a tweak — note it and bring it back.

## Handy commands

```bash
npm start          # start the dev server + QR code
npm run typecheck  # TypeScript check
npm test           # run the unit tests
```

## Heads-up: saved in the cloud, per account

Boops and your people list live in Firebase under your **account** now, so they
follow you across devices and reinstalls — sign in on any phone and your stuff
is there. (Photos are the one exception: they're still stored as a local path,
so a photo you attach won't load on a *different* device until M3c adds real
photo upload.)
