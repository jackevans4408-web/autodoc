# Subscriptions and usage limits (backend)

## Plans

| Plan | Price | Diagnoses / 24h | Follow-ups / 24h | Quote analyses / 24h |
|---|---|---|---|---|
| Free | $0 | 10 | 30 | 1 |
| Plus | $4.99/mo | 50 | 150 | 25 |
| Unlimited | $24.99/mo | no limit | no limit | no limit |

Limits are in `backend/plans.py`. The window is a rolling 24 hours, not a calendar day.
Follow-ups are a separate allowance: they do not use up a diagnosis, but they are counted so the `is_followup` flag cannot be used to get unlimited free answers. The follow-up numbers are a product decision I made; change them in `LIMITS`.

## How it works
- The app sends `Authorization: Bearer <Supabase access token>` (it already receives `token` from `/auth/signin`).
- `/diagnose` checks the token with Supabase, looks up the user's plan, and atomically counts one use in Postgres. Over the limit returns **HTTP 402** with `{"detail": {"error": "quota_exceeded", "kind", "tier", "limit", "window_hours", "message"}}`. A missing or invalid token returns **401** `{"error": "auth_required"}`. The existing per-IP limiter (429) still applies first.
- If the AI call fails, the use is given back.
- Quote analysis must send `"kind": "quote"` in the `/diagnose` body (default is `"diagnosis"`).
- `GET /usage` returns the user's plan, used and remaining counts, for a usage counter and paywall.
- `POST /webhooks/revenuecat` receives purchase events and updates the user's plan. Paid plans lapse to Free automatically when `expires_at` passes, even if the expiration webhook is late.

## Why RevenueCat and not Stripe
Apple requires in-app purchase for digital subscriptions sold inside an iOS app, so Stripe cannot be used for the iOS paywall. RevenueCat wraps Apple and Google billing, validates receipts, and sends the webhooks this backend handles.

## Rollout (enforcement is OFF by default)
The live app sends no token and no `kind`, so turning enforcement on before an app update would block every current user. Until `ENFORCE_USAGE_LIMITS` is set, `/diagnose` behaves exactly as before (per-IP limits only).

1. **(you)** Run `supabase/migrations/001_subscriptions.sql` in the Supabase SQL editor.
2. **(you)** Add Railway variables:
   - `SUPABASE_SERVICE_KEY`: the service_role key from Supabase > Project Settings > API. Secret: never put it in the app or in git.
   - `REVENUECAT_WEBHOOK_AUTH`: a long random string you choose (the same value goes in RevenueCat, below).
   - optional `REVENUECAT_PRODUCT_TIERS`, e.g. `{"your.plus.product.id": "plus", "your.unlimited.product.id": "unlimited"}` if your App Store product IDs differ from the defaults `engineeye_plus_monthly` and `engineeye_unlimited_monthly`.
3. **(you)** App Store Connect: create the two auto-renewable subscriptions in one subscription group, with those product IDs. Paid Applications agreement and banking/tax info must be completed.
4. **(you)** RevenueCat: create the project, add the iOS app, add products, create entitlements named `plus` and `unlimited`, create an offering. Under Integrations > Webhooks, set the URL to `https://autodoc-production-1703.up.railway.app/webhooks/revenuecat` and the Authorization header value to your `REVENUECAT_WEBHOOK_AUTH`. Send the dashboard's TEST event; the response should be 200.
5. Frontend work (not in this change): install the RevenueCat SDK, call `Purchases.logIn(<Supabase user_id>)` after sign-in (the webhook identifies users by this id), build the paywall, send the bearer token and `"kind": "quote"` on requests, and handle 401 and 402.
6. Ship the app update. Once most users are on it, set `ENFORCE_USAGE_LIMITS=true` on Railway. Setting it back to `false` is an instant rollback.

## Tested vs not tested
Tested (98 automated tests, all external services mocked): plan limits, rolling-window counting, 401/402 behaviour, per-kind and per-user separation, refunds on failure, expiry fallback, webhook auth, out-of-order and duplicate webhook events, anonymous ids.
Not tested: the SQL functions executing in a real Supabase project (the file was only syntax-checked with the Postgres parser), real Supabase token verification, real RevenueCat or Apple events, and the frontend. Do a TestFlight sandbox purchase end to end before enabling enforcement.
`cancel_reason == "CUSTOMER_SUPPORT"` is treated as a refund based on RevenueCat's documentation; confirm against a real refund event.

## Known limitations
- A user who signs up for many accounts gets a free allowance per account. The per-IP limits blunt this; stronger fixes (device attestation, email verification) are separate work.
- Limits are enforced per user; `/diagnose` still saves diagnoses under user "anonymous" in the backend, as before.
