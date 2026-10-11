import test from "node:test";
import assert from "node:assert/strict";
import { saveDiagnosis, loadDiagnoses, fetchDiagnosis, deleteDiagnosis, updateDiagnosisMessages } from "./supabase.js";

const USER = "11111111-1111-1111-1111-111111111111";
const session = { user_id: USER, token: "user-jwt", refresh_token: "ref" };

const reply = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

const scripted = (...responses) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return next;
  };
  return { fetchImpl, calls };
};

test("requests carry the signed-in user's token, not just the public key", async () => {
  const { fetchImpl, calls } = scripted(reply(200, []));
  await loadDiagnoses(session, { fetchImpl });
  const { headers } = calls[0].init;
  assert.equal(headers.Authorization, "Bearer user-jwt");
  assert.ok(headers.apikey && headers.apikey !== "user-jwt");
});

test("loadDiagnoses filters to the user's id and returns rows", async () => {
  const rows = [{ id: "a" }, { id: "b" }];
  const { fetchImpl, calls } = scripted(reply(200, rows));
  assert.deepEqual(await loadDiagnoses(session, { fetchImpl }), rows);
  assert.match(calls[0].url, new RegExp(`/rest/v1/diagnoses\\?user_id=eq\\.${USER}&order=created_at\\.desc&limit=20$`));
});

test("loadDiagnoses returns [] when rejected, on errors, or without a user id", async () => {
  assert.deepEqual(await loadDiagnoses(session, { fetchImpl: scripted(reply(403, { message: "denied" })).fetchImpl }), []);
  assert.deepEqual(await loadDiagnoses(session, { fetchImpl: scripted(new Error("offline")).fetchImpl }), []);
  assert.deepEqual(await loadDiagnoses({ token: "t" }, { fetchImpl: scripted().fetchImpl }), []);
});

test("saveDiagnosis inserts under the session's user id and returns the new id from the response", async () => {
  const { fetchImpl, calls } = scripted(reply(201, [{ id: "new-id" }]));
  const id = await saveDiagnosis(session, "noise", "brake pads", "2015 Honda Civic", "10/11/2026", [{ role: "user", content: "noise" }], { fetchImpl });
  assert.equal(id, "new-id");
  assert.equal(calls.length, 1); // one request: no racy "fetch the latest row" follow-up
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.Prefer, "return=representation");
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.user_id, USER);
  assert.deepEqual(body.messages, [{ role: "user", content: "noise" }]);
});

test("saveDiagnosis returns null when the database rejects it, false when offline, null without a user", async () => {
  assert.equal(await saveDiagnosis(session, "p", "d", "c", "dt", [], { fetchImpl: scripted(reply(401, {})).fetchImpl }), null);
  assert.equal(await saveDiagnosis(session, "p", "d", "c", "dt", [], { fetchImpl: scripted(new Error("offline")).fetchImpl }), false);
  assert.equal(await saveDiagnosis({ token: "t" }, "p", "d", "c", "dt", [], { fetchImpl: scripted().fetchImpl }), null);
});

test("an expired token is refreshed once, reported, and the request retried", async () => {
  const { fetchImpl, calls } = scripted(
    reply(401, { message: "JWT expired" }),
    reply(200, { success: true, token: "fresh-jwt", refresh_token: "ref2" }),
    reply(200, [{ id: "a" }])
  );
  let updated = null;
  const rows = await loadDiagnoses(session, { fetchImpl, onSession: (s) => (updated = s) });
  assert.deepEqual(rows, [{ id: "a" }]);
  assert.match(calls[1].url, /\/auth\/refresh$/);
  assert.equal(calls[2].init.headers.Authorization, "Bearer fresh-jwt");
  assert.equal(updated.token, "fresh-jwt");
});

test("a 401 with no refresh token fails without looping", async () => {
  const { fetchImpl, calls } = scripted(reply(401, {}));
  assert.deepEqual(await loadDiagnoses({ user_id: USER, token: "old" }, { fetchImpl }), []);
  assert.equal(calls.length, 1);
});

test("fetchDiagnosis returns the first row or null", async () => {
  assert.deepEqual(await fetchDiagnosis(session, "x", { fetchImpl: scripted(reply(200, [{ id: "x" }])).fetchImpl }), { id: "x" });
  assert.equal(await fetchDiagnosis(session, "x", { fetchImpl: scripted(reply(200, [])).fetchImpl }), null);
  assert.equal(await fetchDiagnosis(session, "x", { fetchImpl: scripted(reply(401, {})).fetchImpl }), null);
});

test("deleteDiagnosis and updateDiagnosisMessages use the right verbs and report success", async () => {
  const del = scripted(reply(204, null));
  assert.equal(await deleteDiagnosis(session, "abc", { fetchImpl: del.fetchImpl }), true);
  assert.equal(del.calls[0].init.method, "DELETE");
  assert.match(del.calls[0].url, /diagnoses\?id=eq\.abc$/);

  const upd = scripted(reply(204, null));
  assert.equal(await updateDiagnosisMessages(session, "abc", [{ role: "user", content: "hi" }], { fetchImpl: upd.fetchImpl }), true);
  assert.equal(upd.calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(upd.calls[0].init.body), { messages: [{ role: "user", content: "hi" }] });

  assert.equal(await deleteDiagnosis(session, "abc", { fetchImpl: scripted(reply(403, {})).fetchImpl }), false);
});

test("ids are URL-encoded so a crafted id cannot add query filters", async () => {
  const { fetchImpl, calls } = scripted(reply(204, null));
  await deleteDiagnosis(session, "x&user_id=neq.0", { fetchImpl });
  assert.ok(!calls[0].url.includes("&user_id"));
});
