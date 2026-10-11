# Pre-submission checklist for the new Engine Eye app

Context: the first app (`com.engineeye.app`, v1.0 build 5) was rejected on 2026-07-17 under Guideline 5.6 (Developer Code of Conduct). Apple's message says the app is not eligible for resubmission, that resubmissions to that listing will be auto-rejected, and that continued submissions with the same or similar issues may lead to removal from the Apple Developer Program. A new app (`com.jackevans.engineeye`) is the only route, and **it must be right the first time**. Do not submit until every item below is done.

Steps marked **(you)** need your accounts or a real device.

## Fixed in code (branch `feature/app-review-readiness`)
- [x] **In-app account deletion** (guideline 5.1.1(v)): Settings, Delete Account (two confirmations). Calls `DELETE /auth/account`, which deletes the user's saved diagnoses and their login, then wipes all data stored on the phone.
- [x] **Permission before sending data to the AI** (guideline 5.1.2(i)): a consent screen after sign-in explains what goes to Anthropic, NHTSA and YouTube, with a link to the privacy policy. "Not Now" signs the user out. Settings, Withdraw AI permission reverses it. Consent is stored per user and per version.
- [x] **Privacy policy corrected**: it said conversations are "not permanently stored", but they are saved in the user's history. It now says so, and describes in-app deletion.
- [x] **Subscriptions hidden for version 1**: the Plan row, usage counter and paywall are off unless `EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED=true`. A paywall that says "Subscriptions aren't available right now" looks unfinished. Add subscriptions in an update after the app is approved.
- [x] **"Rate Engine Eye" row hidden**: it linked to the old, rejected app's id. It shows only when `EXPO_PUBLIC_APP_STORE_ID` is set (after the new app has an App Store id).
- [x] Safety notice (not a substitute for a mechanic) on the consent screen.

## Before you submit
1. **(you)** Test account deletion with a throwaway account on the build you will submit: sign up, run a diagnosis, then Settings, Delete Account. Confirm you are returned to sign-in, the old login no longer works, and the row is gone from Supabase. This path was unit-tested with mocks but never run against the real Supabase.
2. **(you)** Create a **demo account** (email + password) for App Review in the live Supabase project, with a sample vehicle and a couple of diagnoses. Put the credentials in App Store Connect, App Review Information, so the reviewer can sign in (guideline 2.1). Do not use your personal password.
3. **(you)** Make sure the backend is up and the Anthropic key has credit during review. The reviewer will run diagnoses. Do not turn on `ENFORCE_USAGE_LIMITS`.
4. **(you)** Complete the **EU trader status** declaration (App Store Connect, Business). It is required to submit.
5. **(you)** Walk through every screen on a real iPhone, on a fresh install of the TestFlight build: sign up, consent, add a vehicle, diagnosis with text, with a photo, follow-up, history reopen and delete, quote analysis, OBD lookup, recalls, repair history, maintenance, settings, privacy, terms, help, sign out, Face ID sign-in. Fix anything that looks unpolished: typos, cut-off text, empty screens with no explanation, buttons that do nothing.
6. **(you)** Check the screens at the small and large iPhone sizes and with Dynamic Type on if possible. The app is iPhone-only (`supportsTablet: false`).
7. **(you)** Make sure the App Store listing matches the app exactly: name, description, screenshots from the real build (not mock-ups), no mention of features that are not in this version (such as Android or subscriptions), the correct support URL, and a working privacy policy URL.
8. **(you)** Answer the App Privacy questions to match what the app does: email, user content (text, photos), vehicle info, and that it is shared with an AI provider.
9. **(you)** Build a production binary with EAS only after the above. Test that exact build on TestFlight first. Submit only a build you have personally tested end to end.
10. Review `docs/NEW_APP_LISTING.md` for the bundle ID, Apple and EAS steps.

## Things to avoid
- Placeholder text, test accounts visible in the UI, "coming soon" buttons, or debug options.
- Submitting a build you have not run yourself on a device.
- Reusing the old listing's name and screenshots without checking that they match the new build.

## Not verified
I cannot see how Apple reviews apps, the old build's problems beyond Apple's message, or your real devices. This list covers the common causes of quality rejections and the rules that apply to this app, but it cannot guarantee approval.
