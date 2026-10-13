import test from "node:test";
import assert from "node:assert/strict";
import { CAR, GEAR, gearPath } from "./loadingShapes.js";

test("gearPath draws one tooth per requested tooth and a hole, all closed", () => {
  const d = gearPath(24, 24, 8, 22, 17, 7);
  assert.equal((d.match(/L /g) || []).length, 8 * 3); // three straight edges per tooth
  assert.equal((d.match(/M /g) || []).length, 2); // outline + hole
  assert.equal((d.match(/Z/g) || []).length, 2);
  assert.ok(!d.includes("NaN"));
});

test("gear teeth stay inside the box the animation reserves for it", () => {
  const nums = GEAR.path.match(/-?\d+(\.\d+)?/g).map(Number);
  assert.ok(Math.min(...nums) >= 0 && Math.max(...nums) <= GEAR.size);
});

test("the car has a body, two windows and two wheels inside its box", () => {
  assert.equal(CAR.windows.length, 2);
  assert.equal(CAR.wheels.length, 2);
  for (const w of CAR.wheels) assert.ok(w.cx - w.r >= 0 && w.cx + w.r <= CAR.width && w.cy + w.r <= CAR.height);
  assert.ok(!CAR.body.includes("NaN"));
});
