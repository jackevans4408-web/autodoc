# Email verification (built, not switched on)

Code is on `feature/email-verification`. Turning it on needs a new app build plus Supabase settings. Do the steps in order; do **not** turn on Supabase "Confirm email" before the new build is live, or version 1.0 users who sign up will be stuck.

## Order
1. Merge the PR, build with EAS, submit to App Store, wait for approval and release.
2. Pick an email sender. Supabase's built-in sender is limited to a few emails per hour and often lands in spam. Use your own SMTP (for example Resend): Supabase, Authentication, Emails, SMTP Settings, enable custom SMTP.
3. Edit the template: Authentication, Emails, Confirm signup. Keep the `{{ .ConfirmationURL }}` link. Use a short Engine Eye message.
4. Set the redirect: Authentication, URL Configuration. Site URL can be `https://jackevans4408-web.github.io/autodoc/` (a simple page that says "Email verified, return to the app").
5. Turn on Authentication, Providers, Email, "Confirm email".
6. Test with a new address: sign up, see the "Check your email" screen, open the link, tap "I've verified my email".
7. The demo account for App Review must already be verified (existing accounts are not affected by the switch).

## What the code does
- Backend: `/auth/signup` adds `needs_verification: true` when no session is returned; `/auth/signin` adds `code: "email_not_confirmed"`; new `/auth/resend` (rate limited, always answers success).
- App: sign-up or sign-in for an unverified account shows a "Check your email" panel with "I've verified my email", "Resend email" (60 second wait) and "Back to sign in".
- With "Confirm email" off, nothing changes: sign-up signs the user in right away.
