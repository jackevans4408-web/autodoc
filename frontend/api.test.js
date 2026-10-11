import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, BACKEND_URL, authedRequest, diagnose, fetchUsage, refreshSession, toApiError, waitForPaidTier } from "./api.js";

const reply = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
});

// Scripted fetch: returns the queued responses in order and records the calls.
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

const session = { user_id: "u1", token: "tok", refresh_token: "ref" };

test("sends the bearer token and JSON body", async () => {
  const { fetchImpl, calls } = scripted(reply(200, { diagnosis: "ok" }));
  const data = await diagnose({ text: "noise", kind: "diagnosis" }, session, { fetchImpl });
  assert.deepEqual(data, { diagnosis: "ok" });
  assert.equal(calls[0].url, `${BACKEND_URL}/diagnose`);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.Authorization, "Bearer tok");
  assert.deepEqual(JSON.parse(calls[0].init.body), { text: "noise", kind: "diagnosis" });
});

test("omits Authorization when there is no session token", async () => {
  const { fetchImpl, calls } = scripted(reply(200, { ok: true }));
  await authedRequest("/usage", {}, { user_id: "old" }, { fetchImpl });
  assert.equal("Authorization" in calls[0].init.headers, false);
  assert.equal(calls[0].init.body, undefined);
});

test("402 becomes a quota_exceeded error carrying the backend detail", async () => {
  const detail = { error: "quota_exceeded", kind: "quote", tier: "free", limit: 1, message: "used up" };
  const { fetchImpl } = scripted(reply(402, { detail }));
  await assert.rejects(diagnose({ text: "x" }, session, { fetchImpl }), (e) => {
    assert.ok(e instanceof ApiError);
    assert.equal(e.kind, "quota_exceeded");
    assert.equal(e.message, "used up");
    assert.deepEqual(e.detail, detail);
    return true;
  });
});

test("429, 422 and 500 map to friendly error kinds", () => {
  assert.equal(toApiError(429, null).kind, "rate_limited");
  assert.equal(toApiError(422, { detail: [] }).kind, "too_large");
  assert.equal(toApiError(500, "Internal Server Error").kind, "server");
});

test("401 refreshes the token once, reports the new session, and retries", async () => {
  const { fetchImpl, calls } = scripted(
    reply(401, { detail: { error: "auth_required" } }),
    reply(200, { success: true, token: "tok2", refresh_token: "ref2" }),
    reply(200, { diagnosis: "ok" })
  );
  let updated = null;
  const data = await diagnose({ text: "x" }, session, { fetchImpl, onSession: (s) => (updated = s) });
  assert.deepEqual(data, { diagnosis: "ok" });
  assert.equal(calls[1].url, `${BACKEND_URL}/auth/refresh`);
  assert.deepEqual(JSON.parse(calls[1].init.body), { refresh_token: "ref" });
  assert.equal(calls[2].init.headers.Authorization, "Bearer tok2");
  assert.deepEqual(updated, { user_id: "u1", token: "tok2", refresh_token: "ref2" });
});

test("401 with a failed refresh surfaces auth_required and does not loop", async () => {
  const { fetchImpl, calls } = scripted(reply(401, {}), reply(200, { success: false, error: "Invalid Refresh Token" }));
  await assert.rejects(diagnose({ text: "x" }, session, { fetchImpl }), (e) => e.kind === "auth_required");
  assert.equal(calls.length, 2);
});

test("401 on the retry is not refreshed a second time", async () => {
  const { fetchImpl, calls } = scripted(reply(401, {}), reply(200, { success: true, token: "t2" }), reply(401, {}));
  await assert.rejects(diagnose({ text: "x" }, session, { fetchImpl }), (e) => e.kind === "auth_required");
  assert.equal(calls.length, 3);
});

test("old sessions without a refresh token go straight to auth_required", async () => {
  const { fetchImpl, calls } = scripted(reply(401, {}));
  await assert.rejects(diagnose({ text: "x" }, { token: "t" }, { fetchImpl }), (e) => e.kind === "auth_required");
  assert.equal(calls.length, 1);
});

test("refreshSession tolerates network errors", async () => {
  const { fetchImpl } = scripted(new Error("offline"));
  assert.equal(await refreshSession(session, { fetchImpl }), null);
});

test("network failures on the main request propagate to the caller", async () => {
  const { fetchImpl } = scripted(new Error("offline"));
  await assert.rejects(diagnose({ text: "x" }, session, { fetchImpl }), /offline/);
});

test("a 200 with a non-JSON body is an error, not undefined data", async () => {
  const { fetchImpl } = scripted(reply(200, "<html>"));
  await assert.rejects(diagnose({ text: "x" }, session, { fetchImpl }), (e) => e.kind === "server");
});

test("fetchUsage uses GET without a body", async () => {
  const { fetchImpl, calls } = scripted(reply(200, { tier: "free" }));
  assert.deepEqual(await fetchUsage(session, { fetchImpl }), { tier: "free" });
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.body, undefined);
});

test("waitForPaidTier polls until the plan upgrades", async () => {
  const { fetchImpl, calls } = scripted(reply(200, { tier: "free" }), reply(200, { tier: "free" }), reply(200, { tier: "plus" }));
  const sleeps = [];
  const usage = await waitForPaidTier(session, { fetchImpl, sleep: async (ms) => sleeps.push(ms), delayMs: 5 });
  assert.equal(usage.tier, "plus");
  assert.equal(calls.length, 3);
  assert.deepEqual(sleeps, [5, 5]);
});

test("waitForPaidTier gives up after the attempt limit", async () => {
  const { fetchImpl, calls } = scripted(reply(200, { tier: "free" }), reply(200, { tier: "free" }), reply(200, { tier: "free" }));
  const usage = await waitForPaidTier(session, { fetchImpl, sleep: async () => {}, attempts: 3 });
  assert.equal(usage, null);
  assert.equal(calls.length, 3);
});

test("waitForPaidTier stops early when the user must sign in again", async () => {
  const { fetchImpl, calls } = scripted(reply(401, {}));
  assert.equal(await waitForPaidTier({ token: "t" }, { fetchImpl, sleep: async () => {} }), null);
  assert.equal(calls.length, 1);
});

test("waitForPaidTier keeps polling through transient server errors", async () => {
  const { fetchImpl } = scripted(reply(500, "boom"), reply(200, { tier: "unlimited" }));
  const usage = await waitForPaidTier(session, { fetchImpl, sleep: async () => {} });
  assert.equal(usage.tier, "unlimited");
});
