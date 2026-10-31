import test from "node:test";
import assert from "node:assert/strict";
import { isDiagnoseHeader, splitStep } from "./diagnosisLayout.js";

test("splitStep separates the step number from its instruction", () => {
  assert.deepEqual(splitStep("Step 1: Park on level ground and pump the brake pedal"), { label: "Step 1", body: "Park on level ground and pump the brake pedal" });
  assert.deepEqual(splitStep("Step 12: Check the hose"), { label: "Step 12", body: "Check the hose" });
});

test("splitStep copes with spacing and punctuation variants", () => {
  assert.deepEqual(splitStep("  step 2 - Inspect the cap "), { label: "step 2", body: "Inspect the cap" });
  assert.deepEqual(splitStep("Step3:Tighten"), { label: "Step 3", body: "Tighten" });
});

test("splitStep leaves cause names and other lines alone", () => {
  assert.equal(splitStep("Faulty EGR Valve Stuck Open"), null);
  assert.equal(splitStep("Stepping stones: not a step"), null);
  assert.equal(splitStep(""), null);
  assert.equal(splitStep(null), null);
});

test("the diagnose section is recognised by its emoji or its title", () => {
  assert.equal(isDiagnoseHeader("🔍 HOW TO DIAGNOSE IT YOURSELF"), true);
  assert.equal(isDiagnoseHeader("How to diagnose it yourself"), true);
  assert.equal(isDiagnoseHeader("💰 COST ESTIMATE"), false);
  assert.equal(isDiagnoseHeader(""), false);
});
