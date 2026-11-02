export const RESEND_COOLDOWN_SECONDS = 60;

// The backend marks a sign-in blocked by an unverified email with code "email_not_confirmed" (older text match kept as a fallback).
export const isUnverifiedError = (result) =>
  Boolean(result && !result.success && (result.code === "email_not_confirmed" || /email not confirmed/i.test(String(result.error || ""))));

// A sign-up that did not return a login token is waiting for the emailed link to be opened.
export const needsVerification = (result) => Boolean(result && result.success && (result.needs_verification || !result.token));

export const verifyMessage = (email, cooldownLeft) => ({
  title: "Check your email",
  body: `We sent a verification link to ${email}. Open it, then come back and tap "I've verified my email".`,
  resendLabel: cooldownLeft > 0 ? `Resend email (${cooldownLeft}s)` : "Resend email",
  canResend: cooldownLeft <= 0,
});

export const tickCooldown = (n) => (n > 0 ? n - 1 : 0);
