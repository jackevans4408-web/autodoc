import { refreshSession } from "./api.js";

const BACKEND_URL = "https://autodoc-production-1703.up.railway.app";
const SUPABASE_URL = "https://mzgcvksqsxxyvsxqmuke.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16Z2N2a3Nxc3h4eXZzeHFtdWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxODE0NDIsImV4cCI6MjA5NTc1NzQ0Mn0.h5Z_Ro2gXhBxU0o2rq3WBcXIv_pP8BUKGxu58nlxf4k";

export const signIn = async (email, password) => {
  const response = await fetch(`${BACKEND_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

export const signUp = async (email, password) => {
  const response = await fetch(`${BACKEND_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// The public anon key only identifies the project. Row Level Security on the `diagnoses` table decides what a
// request may touch, based on the signed-in user's access token sent in the Authorization header.
const rest = async (path, { method = "GET", body, prefer } = {}, session, { onSession, fetchImpl = fetch } = {}) => {
  const send = (s) =>
    fetchImpl(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${s?.token || SUPABASE_KEY}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await send(session);
  if (res.status === 401) {
    // Access tokens last about an hour; swap in a fresh one once and retry.
    const fresh = await refreshSession(session, { fetchImpl });
    if (fresh) {
      onSession?.(fresh);
      res = await send(fresh);
    }
  }
  return res;
};

// Returns the new row's id, null if the save was rejected, or false on a network error.
export const saveDiagnosis = async (session, problem, diagnosis, car, date, messages = [], opts) => {
  try {
    if (!session?.user_id) return null;
    const response = await rest(
      "diagnoses",
      { method: "POST", body: { user_id: session.user_id, problem, diagnosis, car, date, messages }, prefer: "return=representation" },
      session,
      opts
    );
    if (!response.ok) {
      console.log("Save diagnosis failed:", response.status);
      return null;
    }
    const rows = await response.json();
    return rows?.[0]?.id || null;
  } catch (e) {
    console.log("Error saving diagnosis:", e);
    return false;
  }
};

export const loadDiagnoses = async (session, opts) => {
  try {
    if (!session?.user_id) return [];
    const response = await rest(`diagnoses?user_id=eq.${encodeURIComponent(session.user_id)}&order=created_at.desc&limit=20`, {}, session, opts);
    if (!response.ok) return [];
    const rows = await response.json();
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    console.log("Error loading diagnoses:", e);
    return [];
  }
};

export const deleteDiagnosis = async (session, id, opts) => {
  try {
    const response = await rest(`diagnoses?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }, session, opts);
    return response.ok;
  } catch (e) {
    console.log("Error deleting diagnosis:", e);
    return false;
  }
};

export const updateDiagnosisMessages = async (session, id, messages, opts) => {
  try {
    const response = await rest(
      `diagnoses?id=eq.${encodeURIComponent(id)}`,
      { method: "PATCH", body: { messages }, prefer: "return=minimal" },
      session,
      opts
    );
    if (!response.ok) console.log("Update diagnosis failed:", response.status);
    return response.ok;
  } catch (e) {
    console.log("Error updating diagnosis:", e);
    return false;
  }
};

export const fetchDiagnosis = async (session, id, opts) => {
  try {
    const response = await rest(`diagnoses?id=eq.${encodeURIComponent(id)}`, {}, session, opts);
    if (!response.ok) {
      console.log("Fetch diagnosis failed:", response.status);
      return null;
    }
    const rows = await response.json();
    return Array.isArray(rows) ? rows[0] || null : null;
  } catch (e) {
    console.log("Error fetching diagnosis:", e);
    return null;
  }
};

export const supabase = { auth: { signOut: async () => {} } };
