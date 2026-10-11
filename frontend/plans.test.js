import test from "node:test";
import assert from "node:assert/strict";
import { PLANS, formatUsageLine, quotaMessage, tierForProductId } from "./plans.js";

const usage = (overrides = {}) => ({
  tier: "free",
  enforced: true,
  usage: {
    diagnosis: { used: 3, limit: 10, remaining: 7 },
    quote: { used: 0, limit: 1, remaining: 1 },
  },
  ...overrides,
});

test("plans list free, plus and unlimited with the agreed prices", () => {
  assert.deepEqual(PLANS.map((p) => p.tier), ["free", "plus", "unlimited"]);
  assert.equal(PLANS[1].price, "$4.99 / month");
  assert.equal(PLANS[2].price, "$24.99 / month");
});

test("tierForProductId maps the store products", () => {
  assert.equal(tierForProductId("engineeye_plus_monthly"), "plus");
  assert.equal(tierForProductId("engineeye_unlimited_monthly"), "unlimited");
  assert.equal(tierForProductId("other"), null);
  assert.equal(tierForProductId(undefined), null);
});

test("formatUsageLine shows what is left", () => {
  assert.equal(formatUsageLine(usage()), "7 of 10 diagnoses left today");
  assert.equal(formatUsageLine(usage(), "quote"), "1 of 1 quote analysis left today");
});

test("formatUsageLine is hidden for unlimited, unenforced or missing data", () => {
  assert.equal(formatUsageLine(usage({ usage: { diagnosis: { used: 0, limit: null, remaining: null } } })), null);
  assert.equal(formatUsageLine(usage({ enforced: false })), null);
  assert.equal(formatUsageLine(null), null);
  assert.equal(formatUsageLine(usage(), "followup"), null);
});

test("quotaMessage differs for free and paid users", () => {
  assert.match(quotaMessage({ tier: "free", kind: "quote" }), /free quote analyses.*Upgrade/);
  assert.match(quotaMessage({ tier: "plus", kind: "diagnosis" }), /plan's daily limit of diagnoses/);
  assert.match(quotaMessage(undefined), /free diagnoses/);
});
