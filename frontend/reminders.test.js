import test from "node:test";
import assert from "node:assert/strict";
import { intervalTrigger, safeSchedule, REPAIR_FOLLOW_UP_SECONDS, MAINTENANCE_REMINDER_SECONDS } from "./reminders.js";

const TYPES = { TIME_INTERVAL: "timeInterval" };

test("the trigger carries a type, which expo-notifications requires", () => {
  const trigger = intervalTrigger(TYPES, 60);
  assert.deepEqual(trigger, { type: "timeInterval", seconds: 60, repeats: false });
});

test("reminder delays are 14 and 30 days", () => {
  assert.equal(REPAIR_FOLLOW_UP_SECONDS, 14 * 86400);
  assert.equal(MAINTENANCE_REMINDER_SECONDS, 30 * 86400);
});

test("safeSchedule passes the request through and reports success", async () => {
  const seen = [];
  assert.equal(await safeSchedule(async (r) => seen.push(r), { content: { title: "t" } }), true);
  assert.deepEqual(seen, [{ content: { title: "t" } }]);
});

test("safeSchedule never throws, so a failed reminder cannot break saving a repair", async () => {
  const boom = async () => {
    throw new TypeError("The `trigger` object you provided is invalid");
  };
  assert.equal(await safeSchedule(boom, {}), false);
});
