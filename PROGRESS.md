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
