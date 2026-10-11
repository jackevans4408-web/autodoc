# Engine Eye – progress log

## 2026-10-11
- Synced the local working copy (`Desktop\AutoDoc_1`, Expo SDK 57) into this repo as branch `sync/local-working-copy`. `.env` and `node_modules` were not copied.
- Branch `fix/diagnosis-history-loading` fixes saved conversations not reloading in full:
  - Removed a duplicate `./supabase` import in `App.js`.
  - First save stored an empty history (stale state); it now saves the full exchange.
  - Stored history was trimmed to 6 messages; only the API request is trimmed now.
  - Loading a saved diagnosis now sets the active diagnosis id, so follow-ups update that row instead of a previously open one.
  - New conversations reset the active id; follow-ups sent before the first save returns wait for it.
  - Logic extracted to `frontend/historyUtils.js` with tests (`cd frontend && npm test`, 6 passing).
- Verified: `npx expo export --platform ios` bundles successfully.
- Not verified: behavior on a real device or against live Supabase (no keys used).

## Open
- Rotate the Anthropic key that was exposed in git history (commit 0438b94) – owner action.
- `frontend/supabase.js` hardcodes the Supabase anon key and uses it for all table access; make sure Row Level Security is on for `diagnoses`.
- Backend `/diagnose` has no auth or rate limit.
- New bundle ID + App Store resubmission, Android build, subscriptions: need owner accounts.

## 2026-10-11 (later)
Open pull requests (stacked; merge in this order):
1. #1 `fix/diagnosis-history-loading`: synced local work + history fix.
2. #3 `feature/new-bundle-id`: bundle ID `com.jackevans.engineeye`, SDK 57 config fixes (base: #1).
3. #5 `feature/subscription-frontend`: paywall, RevenueCat, token-aware API client, usage counter (base: #3).
4. #2 `feature/backend-tests-rate-limit`: backend tests, per-IP rate limits (base: main).
5. #4 `feature/subscription-backend`: plans, quotas, RevenueCat webhook, `/auth/refresh`, SQL migration (base: #2).

Tests: backend 101 (`.venv\Scripts\python -m pytest`), frontend 27 (`cd frontend && npm test`). All external services mocked.

Not verified anywhere: real device, TestFlight sandbox purchases, real Supabase SQL execution, real RevenueCat/Apple events.

Owner actions still needed (cannot be done from code):
- Rotate the Anthropic key exposed in git history (commit 0438b94); check RLS on `diagnoses`.
- Subscriptions: run `supabase/migrations/001_subscriptions.sql`, set Railway vars (`SUPABASE_SERVICE_KEY`, `REVENUECAT_WEBHOOK_AUTH`), create App Store products + RevenueCat project/webhook, add the RevenueCat public key to `frontend/.env` and EAS. See `docs/SUBSCRIPTIONS.md` and `docs/PAYWALL_APP.md`.
- App Store: register the new App ID, create the new listing, EAS build/submit. See `docs/NEW_APP_LISTING.md`. Android needs a Google Play developer account.
- Only after the new app version is live: set `ENFORCE_USAGE_LIMITS=true` on Railway.

Ideas not started: GitHub Actions CI (run both test suites on PRs; add after the PRs merge so the tests exist on main), removing committed `__pycache__` files, pinning backend dependency versions, per-user saving of diagnoses in the backend (currently saved under "anonymous").
