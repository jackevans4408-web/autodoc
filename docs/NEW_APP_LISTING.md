# New App Store / Google Play listing

The app config now uses the bundle ID / package `com.jackevans.engineeye` (was `com.engineeye.app`) in `frontend/app.json`.
Apple does not allow resubmitting a rejected app under a new listing with the same bundle ID, so the steps below are for the new listing.
Steps marked **(you)** need your Apple, Google or Expo login; they cannot be done from code.

## Before building
1. **(you)** Confirm `com.jackevans.engineeye` is what you want. Bundle IDs are permanent once an app is created. To use a different one, change `bundleIdentifier` and `package` in `frontend/app.json`.
2. **(you)** Apple Developer portal > Identifiers: register the App ID `com.jackevans.engineeye`. Enable Push Notifications if you use remote pushes.
3. **(you)** App Store Connect > Apps > New App, using that bundle ID. Fill in name, primary language, SKU.
4. Re-upload screenshots, description, keywords, support URL, and the privacy policy URL on the new listing.
5. Complete App Privacy answers and age rating again. The app collects email (Supabase auth), diagnosis text and photos (sent to Claude), and vehicle details.

## Build and submit (iOS)
Run from `frontend/`:

```bash
npx eas-cli login
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
```

EAS will ask you to sign in to Apple and will create new certificates and a provisioning profile for the new bundle ID. `appVersionSource` is `remote` with `autoIncrement`, so build numbers continue from the existing counter.
Test the build on TestFlight before submitting for review. Review the 5.6 rejection feedback against the app flow end to end first (login, diagnosis, history, quote analysis, Face ID).

## Android (when ready)
1. **(you)** Create a Google Play Developer account ($25 one-time) and a new app with package `com.jackevans.engineeye`. The package name cannot be changed later.
2. Build: `npx eas-cli build --platform android --profile production`
3. First upload to Play must be done manually in the Play Console; later uploads can use `eas submit`.

## What changed in app.json besides the ID
`npx expo-doctor` reported config fields that SDK 57 no longer accepts, which risks a failed or misconfigured production build:
- Removed `newArchEnabled` (no longer a valid option in SDK 57).
- Removed `android.edgeToEdgeEnabled` (no longer a valid option in SDK 57).
- Moved the splash screen from the top-level `splash` key to the `expo-splash-screen` config plugin, with the same image and background color. The image width is set to 200; adjust `imageWidth` if the logo looks too big or small.
- Installed `expo-splash-screen` and patch-updated three Expo packages to match SDK 57.

After this change `npx expo-doctor` passes 21/21 checks. The splash screen change only takes effect in a new native build, so check it visually on the first TestFlight build.
