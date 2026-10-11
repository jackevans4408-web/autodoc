// Backend client. Sends the Supabase access token, refreshes it once on 401, and turns failures into typed errors.
// Free of React/Expo imports so it can be tested with `node --test`.

export const BACKEND_URL = "https://autodoc-production-1703.up.railway.app";

// kind: "auth_required" | "quota_exceeded" | "rate_limited" | "too_large" | "server" | "network"
export class ApiError extends Error {
  constructor(kind, message, { status, detail } = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

// A session can only be used if it carries the user's access token. Sessions saved by older versions, or created by
// sign-up (which used to return no token), do not, and the database rejects requests without one.
export const isUsableSession = (session) => Boolean(session && session.user_id && session.token);

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

export const toApiError = (status, body) => {
  const detail = body && typeof body === "object" ? body.detail : undefined;
  if (status === 401) return new ApiError("auth_required", "Please sign in again.", { status, detail });
  if (status === 402) {
    const message = detail?.message || "You have reached your limit for now.";
    return new ApiError("quota_exceeded", message, { status, detail });
  }
  if (status === 429) return new ApiError("rate_limited", "You're going a little fast. Wait a moment and try again.", { status, detail });
  if (status === 413 || status === 422) return new ApiError("too_large", "That request was too large. Try shorter text or a smaller photo.", { status, detail });
  return new ApiError("server", "Something went wrong on our end. Please try again.", { status, detail });
};

// Exchange the stored refresh token for a new session. Returns the updated session, or null if it cannot be refreshed.
export const refreshSession = async (session, { fetchImpl = fetch } = {}) => {
  if (!session?.refresh_token) return null;
  try {
    const res = await fetchImpl(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const data = parseJson(await res.text());
    if (!data?.success || !data.token) return null;
    return { ...session, token: data.token, refresh_token: data.refresh_token || session.refresh_token };
  } catch (e) {
    return null;
  }
};

export const authedRequest = async (path, { method = "GET", body, signal } = {}, session, { onSession, fetchImpl = fetch } = {}) => {
  const send = (s) =>
    fetchImpl(`${BACKEND_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

  let res = await send(session);
  if (res.status === 401) {
    const fresh = await refreshSession(session, { fetchImpl });
    if (fresh) {
      onSession?.(fresh);
      res = await send(fresh);
    }
  }
  const parsed = parseJson(await res.text());
  if (!res.ok) throw toApiError(res.status, parsed);
  if (parsed === null) throw new ApiError("server", "Unexpected response from the server.", { status: res.status });
  return parsed;
};

export const diagnose = (body, session, opts) => authedRequest("/diagnose", { method: "POST", body, signal: opts?.signal }, session, opts);

export const fetchUsage = (session, opts) => authedRequest("/usage", { method: "GET", signal: opts?.signal }, session, opts);

// Permanently deletes the signed-in user's account and server-side data.
export const deleteAccount = (session, opts) => authedRequest("/auth/account", { method: "DELETE", signal: opts?.signal }, session, opts);

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// After a purchase the plan is activated by a webhook, which can take a few seconds. Poll /usage until it shows a paid tier.
export const waitForPaidTier = async (session, { attempts = 15, delayMs = 2000, sleep = defaultSleep, ...opts } = {}) => {
  for (let i = 0; i < attempts; i++) {
    try {
      const usage = await fetchUsage(session, opts);
      if (usage.tier !== "free") return usage;
    } catch (e) {
      if (e instanceof ApiError && e.kind === "auth_required") return null;
    }
    if (i < attempts - 1) await sleep(delayMs);
  }
  return null;
};
