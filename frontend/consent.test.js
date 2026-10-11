import test from "node:test";
import assert from "node:assert/strict";
import { CONSENT_VERSION, hasValidConsent, makeConsent, parseConsent } from "./consent.js";
import { LOCAL_DATA_KEYS } from "./config.js";

test("a consent made for a user is valid for that user", () => {
  const c = makeConsent("u1", new Date("2026-10-11T12:00:00Z"));
  assert.deepEqual(c, { version: CONSENT_VERSION, userId: "u1", at: "2026-10-11T12:00:00.000Z" });
  assert.equal(hasValidConsent(c, "u1"), true);
});

test("consent does not carry over to another user", () => {
  assert.equal(hasValidConsent(makeConsent("u1"), "u2"), false);
});

test("an older consent version must be re-confirmed", () => {
  assert.equal(hasValidConsent({ version: CONSENT_VERSION - 1, userId: "u1" }, "u1"), false);
});

test("missing or broken stored consent is not consent", () => {
  assert.equal(hasValidConsent(null, "u1"), false);
  assert.equal(hasValidConsent(parseConsent("not json"), "u1"), false);
  assert.equal(hasValidConsent(parseConsent(undefined), "u1"), false);
  assert.equal(hasValidConsent(makeConsent("u1"), undefined), false);
});

test("stored consent round-trips through JSON", () => {
  const raw = JSON.stringify(makeConsent("u9"));
  assert.equal(hasValidConsent(parseConsent(raw), "u9"), true);
});

test("account deletion wipes the login, vehicles, history and the consent record", () => {
  for (const key of ["userSession", "userCar", "userCars", "repairHistory", "savedQuotes", "maintenanceSchedule", "aiConsent"]) {
    assert.ok(LOCAL_DATA_KEYS.includes(key), key);
  }
  assert.equal(new Set(LOCAL_DATA_KEYS).size, LOCAL_DATA_KEYS.length);
});
