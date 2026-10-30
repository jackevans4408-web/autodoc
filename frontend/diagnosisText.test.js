import test from "node:test";
import assert from "node:assert/strict";
import { cleanLine } from "./diagnosisText.js";

test("bold markers are removed but the words stay", () => {
  assert.equal(cleanLine("**Most likely on a 2006 model:**"), "Most likely on a 2006 model:");
  assert.equal(cleanLine("• **Worn rubber brake hoses** - After 18+ years"), "• Worn rubber brake hoses - After 18+ years");
});

test("star bullets become dot bullets", () => {
  assert.equal(cleanLine("* Check the fluid"), "• Check the fluid");
});

test("headings and backticks are cleaned", () => {
  assert.equal(cleanLine("## Next steps"), "Next steps");
  assert.equal(cleanLine("Use `DOT 3` fluid"), "Use DOT 3 fluid");
});

test("plain lines, empty lines and odd input are unchanged or safe", () => {
  assert.equal(cleanLine("Step 1: Park on level ground"), "Step 1: Park on level ground");
  assert.equal(cleanLine(""), "");
  assert.equal(cleanLine(null), "");
  assert.equal(cleanLine(undefined), "");
});

test("a single asterisk used as a footnote mark is left alone", () => {
  assert.equal(cleanLine("Price*"), "Price*");
});
