# App Store & device setup — getting BoopTracker off Expo Go

Practical steps for putting BoopTracker on real phones **without Expo Go** — a
wider family test, or eventually a real release. This is **reference for later**,
not a current milestone: day-to-day dev and the M1–M5 playtests stay on **Expo
Go** (fastest loop, nothing to install but the Expo Go app). Reach for this doc
when Expo Go stops being enough — e.g. you want the app on a relative's phone who
won't scan a QR, or you want a real TestFlight build.

> **Heads-up before any *public* release:** BoopTracker is used by a 10-year-old
> and stores email + username. Apple's and Google's **kids / privacy** rules
> (age rating, "Made for Kids", COPPA-style data rules, a required privacy
> policy) are strict and are a real design conversation — see
> [§6](#6-before-a-public-store-release-read-this-first). **TestFlight / internal
> testing within the family sidesteps all of it**, so that's the recommended path
> until v1 is actually played and those questions are settled.

---

## TL;DR — the lightest path for a family test

| You want… | Do this | Cost |
|---|---|---|
| Daily dev + playtests | Keep using **Expo Go** (`npm start`, scan QR) | free |
| App on a **family iPhone** (no QR) | **EAS Build → TestFlight** | Apple Developer **$99/yr** |
| App on a **family Android** (no QR) | **EAS Build → “preview” APK**, sideload it | free |
| A real **App Store / Play** listing | Full store setup + review (see §5–§6) | +$25 one-time for Play |

The **bundle id / package** is already set in `app.json` →
`com.booptracker.app` (both platforms), `version: 0.0.1`. You bump the version +
build number per build (EAS can auto-increment).

---

## 1. Prerequisites

- A **Mac** — Xcode is macOS-only. (EAS Build runs in the cloud, so you can get
  *most* of the way on any machine, but signing/archiving locally needs a Mac.)
- An **Apple ID** (for iOS) and/or a **Google account** (for Android).
- Node + this repo running locally already (`npm install`, `.env` set — see
  `HANDOFF.md`).

---

## 2. iOS — Apple Developer account

1. Enroll in the **Apple Developer Program**: <https://developer.apple.com/programs/>
   — **$99/year** (individual is fine). A *free* Apple ID can only sideload a
   7-day build to your own device; TestFlight and the store need the paid program.
   Enrollment approval can take a few hours to a day, so start it early.
2. That's the only account step for TestFlight. Certificates and provisioning
   profiles are handled for you further down (EAS or Xcode can auto-manage them).

## 3. Install Xcode

1. Install **Xcode** from the Mac App Store (it's large — several GB). Open it
   once, accept the license, let it install additional components.
2. Command-line tools: `xcode-select --install`.
3. Xcode → **Settings → Accounts → +** → sign in with your Apple ID (the one
   enrolled above). This is the "Team" you'll sign builds with.

## 4. Build the app — pick one path

BoopTracker is a **managed** Expo project (no `ios/` / `android/` folders in
git). Two ways to get a native build:

### Path A — EAS Build (recommended for Expo)

Cloud builds; minimal local setup; EAS can create and manage the Apple
certificates/profiles for you.

```bash
npm install -g eas-cli
eas login                         # your Expo account
eas build:configure               # creates eas.json (build profiles)

# iOS build — internal/testing profile:
eas build --platform ios --profile preview
# EAS will offer to log in to Apple and auto-manage signing.

# Upload it to App Store Connect / TestFlight:
eas submit --platform ios
```

- `eas.json` isn't in the repo yet; `build:configure` creates it. Commit it.
- The EAS free tier covers occasional builds (they may queue); check current
  limits/pricing at <https://expo.dev/pricing> if you build often.
- Android is the same commands with `--platform android` (see §7).

### Path B — Local build with Xcode (prebuild)

More control; useful if you want to open the real Xcode project.

```bash
npx expo prebuild -p ios          # generates the native ios/ project
npx expo run:ios                  # build + run on a simulator or plugged-in device
# …or open ios/booptracker.xcworkspace in Xcode and build from there.
```

In Xcode: select the project → **Signing & Capabilities** → tick **Automatically
manage signing** → choose your **Team** → confirm the bundle id
(`com.booptracker.app`). Then **Product → Archive → Distribute App** to push to
App Store Connect / TestFlight, or just Run on a connected iPhone.

> `prebuild` turns `ios/`/`android/` into real folders. Either keep them
> git-ignored and regenerate on demand (Expo's "continuous native generation"),
> or commit them and maintain them by hand. For a project this small, **Path A +
> managed workflow is simpler** — prefer it unless you need custom native code.

> Note: once you have a custom/dev build you can still get the fast reload loop
> with `npx expo start --dev-client`. Expo Go remains fine for now, though.

## 5. TestFlight — the family beta

1. **App Store Connect** (<https://appstoreconnect.apple.com>) → **My Apps → +
   → New App**. Pick the bundle id `com.booptracker.app` (register it first under
   **Certificates, IDs & Profiles → Identifiers** if EAS/Xcode didn't already),
   name it *BoopTracker*, set primary language + SKU.
2. Upload a build (`eas submit`, or Xcode → Distribute). It shows up under the
   **TestFlight** tab after ~10–30 min of processing.
3. **Internal testing** (up to 100 testers who are users on your App Store
   Connect team) needs **no Apple review** — add family by email, they install
   the **TestFlight** app and get the build. This is the sweet spot for BoopTracker.
4. **External testing** (up to 10,000, by email or a public link) needs a light
   **Beta App Review** first.

TestFlight also means you **don't** have to register each device's UDID (which
you *would* need for plain ad-hoc dev builds).

## 6. Before a public store release, read this first

For internal TestFlight/family use you can stop at §5. A **public listing** adds:

- **Privacy:** a hosted **privacy policy URL** (required), and Apple's **App
  Privacy** questionnaire — declare that you collect **email + username** (auth).
- **Kids & COPPA:** the app is used by a child. Apple's **age rating** / **"Made
  for Kids"** category and Google's **Families** policy impose real requirements
  (data minimization, no behavioral ads, parental gates). This is a genuine
  design decision, not a checkbox — **settle it before submitting**, and note the
  no-social-media constraint already helps here.
- **Store assets:** screenshots per device size, description, support URL, icon.
- **Review:** full App Review (days), plus each update.

Recommendation: **don't** approach the public store until v1 is played and the
kids-privacy stance is decided. Family-scoped TestFlight/internal-track covers
the testing need with none of this.

## 7. Android (Google Play) — the short version

- **Easiest family path (free, no account):** build an installable **APK** and
  send it to the phone:
  ```bash
  eas build --platform android --profile preview   # produces an APK
  ```
  Sideload it (enable "install unknown apps"). No Play account needed.
- **Google Play internal testing:** requires a **Play Console** account (**$25
  one-time**). `eas build --platform android --profile production` (an **AAB**)
  then `eas submit --platform android`, and add testers on the **Internal
  testing** track (fast, minimal review).

## 8. What's already done vs. what you'd add

- ✅ **Bundle id / package** set (`com.booptracker.app`), app name, slug, scheme,
  splash, and the iOS permission strings (camera-roll, contacts) are in
  `app.json`.
- ➕ **`eas.json`** (build profiles) — created by `eas build:configure`.
- ➕ **App icon + splash art** — currently defaults; a real 1024² icon is needed
  before any store upload.
- ➕ **Apple Developer ($99/yr)** and, for Play, a **Play Console ($25)** account.
- ➕ **Version bumps** — bump `expo.version` + `ios.buildNumber` /
  `android.versionCode` per build (EAS `autoIncrement` can do this).

Authoritative, always-current references (exact commands/pricing move over time):
Expo Build <https://docs.expo.dev/build/introduction/> ·
Submit <https://docs.expo.dev/submit/introduction/> ·
TestFlight <https://docs.expo.dev/build/internal-distribution/>.
