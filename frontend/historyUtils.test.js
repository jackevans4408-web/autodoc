import test from "node:test";
import assert from "node:assert/strict";
import { buildApiHistory, appendExchange, parseStoredMessages, restoreConversation, toDisplayMessages } from "./historyUtils.js";

const convo = (n) =>
  Array.from({ length: n }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content: `m${i}` }));

test("buildApiHistory leaves short histories untouched", () => {
  assert.deepEqual(buildApiHistory(convo(4)), convo(4));
});

test("buildApiHistory trims long histories to first + latest 5 without mutating the input", () => {
  const full = convo(10);
  const trimmed = buildApiHistory(full);
  assert.equal(trimmed.length, 6);
  assert.equal(trimmed[0].content, "m0");
  assert.equal(trimmed[5].content, "m9");
  assert.equal(full.length, 10);
});

test("full history keeps growing even when the API history is trimmed", () => {
  let full = convo(6);
  full = appendExchange(full, "q", "a");
  full = appendExchange(full, "q2", "a2");
  assert.equal(full.length, 10);
  assert.equal(full[0].content, "m0");
});

test("parseStoredMessages handles JSON strings, arrays, null and garbage", () => {
  assert.deepEqual(parseStoredMessages(JSON.stringify(convo(2))), convo(2));
  assert.deepEqual(parseStoredMessages(convo(2)), convo(2));
  assert.deepEqual(parseStoredMessages(null), []);
  assert.deepEqual(parseStoredMessages("not json"), []);
  assert.deepEqual(parseStoredMessages('{"a":1}'), []);
  assert.deepEqual(parseStoredMessages([{ role: "system", content: "x" }, null, { role: "user", content: 5 }]), []);
});

test("restoreConversation returns the full saved conversation", () => {
  const { history, display } = restoreConversation({ problem: "p", diagnosis: "d", messages: JSON.stringify(convo(6)) });
  assert.equal(history.length, 6);
  assert.equal(display.length, 6);
  assert.deepEqual(display[1], { role: "bot", text: "m1" });
});

test("restoreConversation falls back to problem/diagnosis for rows with no messages", () => {
  const { history, display } = restoreConversation({ problem: "p", diagnosis: "d", messages: "[]" });
  assert.deepEqual(history, [
    { role: "user", content: "p" },
    { role: "assistant", content: "d" },
  ]);
  assert.deepEqual(display, toDisplayMessages(history));
});

import { adoptSavedId, withUpdatedMessages } from "./historyUtils.js";

test("adoptSavedId swaps the temporary id for the database id and leaves other items alone", () => {
  const list = [{ id: "1760000000000", problem: "a" }, { id: "other", problem: "b" }];
  const out = adoptSavedId(list, "1760000000000", "uuid-123");
  assert.deepEqual(out[0], { id: "uuid-123", supabaseId: "uuid-123", problem: "a" });
  assert.deepEqual(out[1], list[1]);
  assert.equal(list[0].id, "1760000000000"); // input not mutated
});

test("adoptSavedId with an unknown id changes nothing", () => {
  const list = [{ id: "x" }];
  assert.deepEqual(adoptSavedId(list, "nope", "uuid"), list);
});

test("withUpdatedMessages replaces only the matching item's messages", () => {
  const list = [{ id: "a", messages: [1] }, { id: "b", messages: [2] }];
  const out = withUpdatedMessages(list, "a", [1, 2, 3]);
  assert.deepEqual(out[0].messages, [1, 2, 3]);
  assert.deepEqual(out[1].messages, [2]);
  assert.deepEqual(list[0].messages, [1]);
});

test("a follow-up is visible when a just-saved conversation is reopened from the local list", () => {
  let list = [{ id: "tmp", problem: "noise", diagnosis: "pads", messages: [{ role: "user", content: "noise" }, { role: "assistant", content: "pads" }] }];
  list = adoptSavedId(list, "tmp", "uuid-1");
  const full = appendExchange(list[0].messages, "how much?", "$150");
  list = withUpdatedMessages(list, "uuid-1", full);
  const { history } = restoreConversation(list[0]);
  assert.equal(history.length, 4);
  assert.equal(history[3].content, "$150");
});
