# Paywall and usage limits (app side)

Goes with the backend in `docs/SUBSCRIPTIONS.md` (PR #4). Merge and set up the backend first.

## What was added
- `frontend/api.js`: one client for `/diagnose` and `/usage`. Sends `Authorization: Bearer <token>`, refreshes an expired token once through `/auth/refresh` and retries, and turns failures into typed errors (`quota_exceeded` for 402, `auth_required` for 401, `rate_limited` for 429, and so on).
- `frontend/purchases.js`: RevenueCat wrapper. Configures the SDK, logs in with the Supabase user id (the backend webhook identifies users by it), loads plans, buys, restores.
- `frontend/PaywallScreen.js`: plan cards, Subscribe, Restore Purchases, and the auto-renewal disclosure with Terms and Privacy links that Apple requires. After a purchase it polls `/usage` until the backend webhook has activated the plan.
- `frontend/plans.js`: plan copy, product-id mapping, usage-counter text.
- `App.js`: uses the new client, shows a "7 of 10 diagnoses left today" bar above the input (only while limits are enforced and the plan is not unlimited), opens the paywall on a 402, and sends the user back to sign in on an unrecoverable 401. Settings has a Plan row. Quote analysis sends `kind: "quote"`.
- Tests: `cd frontend && npm test` (27 tests: API client, token refresh, polling, plan helpers, history).

## Setup (needs your accounts)
1. Finish the backend steps in `docs/SUBSCRIPTIONS.md` (SQL, Railway variables, App Store subscriptions, RevenueCat project and webhook).
2. Product IDs in App Store Connect must be `engineeye_plus_monthly` and `engineeye_unlimited_monthly`, or change them in `frontend/plans.js` and the backend's `REVENUECAT_PRODUCT_TIERS` together. In RevenueCat, attach both to the current offering (as packages) and create entitlements named `plus` and `unlimited`.
3. Copy `frontend/.env.example` to `frontend/.env` and add the RevenueCat **public** iOS SDK key (starts with `appl_`). For EAS builds, also add it as an EAS environment variable named `EXPO_PUBLIC_REVENUECAT_IOS_KEY`. Without a key the paywall says subscriptions are unavailable instead of crashing.
4. Real purchases do not work in Expo Go. Build a development client (`npx expo install expo-dev-client`, then an EAS `development` build) or a TestFlight build, and test with an App Store sandbox tester.

## Rollout order
1. Merge the backend PRs and deploy. Enforcement is still off, so the live app is unaffected.
2. Ship this app version (with a new refresh-token-capable login) to the App Store / TestFlight.
3. Test in sandbox: free limit reached, paywall, purchase, plan activates, restore purchases, expired token refresh.
4. Set `ENFORCE_USAGE_LIMITS=true` on Railway once most users are on the new version. Users on older versions will then be blocked (they send no token), so wait for adoption or force an update.

## Not verified
Nothing here was run on a device or with real RevenueCat/Apple. The JavaScript bundles and the logic is unit-tested, but the screens, the purchase flow and the native SDK need a TestFlight sandbox run.
Existing logged-in users have saved sessions without a refresh token; once limits are enforced they will be asked to sign in again once.
