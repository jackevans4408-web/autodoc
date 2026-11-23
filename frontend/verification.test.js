import { test } from "node:test";
import assert from "node:assert/strict";
import { isUnverifiedError, needsVerification, verifyMessage, tickCooldown, RESEND_COOLDOWN_SECONDS } from "./verification.js";

test("an unverified sign-in is recognised by code or by Supabase's message", () => {
  assert.equal(isUnverifiedError({ success: false, code: "email_not_confirmed", error: "x" }), true);
  assert.equal(isUnverifiedError({ success: false, error: "Email not confirmed" }), true);
  assert.equal(isUnverifiedError({ success: false, error: "Invalid login credentials" }), false);
  assert.equal(isUnverifiedError({ success: true }), false);
  assert.equal(isUnverifiedError(null), false);
});

test("a sign-up without a token needs verification, one with a token does not", () => {
  assert.equal(needsVerification({ success: true, user_id: "u", needs_verification: true }), true);
  assert.equal(needsVerification({ success: true, user_id: "u" }), true);
  assert.equal(needsVerification({ success: true, user_id: "u", token: "t", refresh_token: "r" }), false);
  assert.equal(needsVerification({ success: false, error: "x" }), false);
});

test("the verify message names the email and gates the resend button on the cooldown", () => {
  const waiting = verifyMessage("a@b.com", 42);
  assert.match(waiting.body, /a@b\.com/);
  assert.equal(waiting.canResend, false);
  assert.equal(waiting.resendLabel, "Resend email (42s)");
  const ready = verifyMessage("a@b.com", 0);
  assert.equal(ready.canResend, true);
  assert.equal(ready.resendLabel, "Resend email");
});

test("the cooldown counts down to zero and stops", () => {
  assert.equal(tickCooldown(RESEND_COOLDOWN_SECONDS), RESEND_COOLDOWN_SECONDS - 1);
  assert.equal(tickCooldown(1), 0);
  assert.equal(tickCooldown(0), 0);
});
