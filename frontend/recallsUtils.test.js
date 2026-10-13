import test from "node:test";
import assert from "node:assert/strict";
import { parseCollapsed, recallsCountLabel, serializeCollapsed, visibleRecalls } from "./recallsUtils.js";

const recalls = [{ NHTSACampaignNumber: "A1" }, { NHTSACampaignNumber: "B2" }, { NHTSACampaignNumber: "C3" }];

test("visibleRecalls hides the ones marked as fixed", () => {
  assert.deepEqual(visibleRecalls(recalls, ["B2"]).map((r) => r.NHTSACampaignNumber), ["A1", "C3"]);
  assert.equal(visibleRecalls(recalls, []).length, 3);
});

test("visibleRecalls copes with missing data", () => {
  assert.deepEqual(visibleRecalls(null, []), []);
  assert.deepEqual(visibleRecalls(undefined, undefined), []);
  assert.equal(visibleRecalls(recalls, undefined).length, 3);
});

test("the count label reflects only recalls that are still open", () => {
  assert.equal(recallsCountLabel(recalls, ["A1"]), "(2)");
  assert.equal(recallsCountLabel([], []), "(0)");
  assert.equal(recallsCountLabel(null, []), "");
});

test("hiding the list is remembered as a string and defaults to shown", () => {
  assert.equal(parseCollapsed(serializeCollapsed(true)), true);
  assert.equal(parseCollapsed(serializeCollapsed(false)), false);
  assert.equal(parseCollapsed(null), false);
  assert.equal(parseCollapsed("garbage"), false);
});
