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
