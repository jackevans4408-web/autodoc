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

export const saveDiagnosis = async (userId, problem, diagnosis, car, date, messages = []) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/diagnoses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ user_id: userId, problem, diagnosis, car, date, messages }),
    });
    const text = await response.text();
    console.log("Save diagnosis response:", response.status, text);
    if (response.ok) {
      const rows = await fetch(`${SUPABASE_URL}/rest/v1/diagnoses?user_id=eq.${userId}&order=created_at.desc&limit=1`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      });
      const data = await rows.json();
      return data[0]?.id || null;
    }
    return null;
  } catch (e) {
    console.log("Error saving diagnosis:", e);
    return false;
  }
};

export const loadDiagnoses = async (userId) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/diagnoses?user_id=eq.${userId}&order=created_at.desc&limit=20`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    const text = await response.text();
    console.log("Supabase response:", text);
    return JSON.parse(text);
  } catch (e) {
    console.log("Error loading diagnoses:", e);
    return [];
  }
};

export const deleteDiagnosis = async (id) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/diagnoses?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    return response.ok;
  } catch (e) {
    console.log("Error deleting diagnosis:", e);
    return false;
  }
};
export const updateDiagnosisMessages = async (id, messages) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/diagnoses?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ messages: messages }),
    });
    const text = await response.text();
    console.log("Update messages response:", response.status, text);
    return response.ok;
  } catch (e) {
    console.log("Error updating diagnosis:", e);
    return false;
  }
};
export const fetchDiagnosis = async (id) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/diagnoses?id=eq.${id}`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    const data = await response.json();
    return data[0] || null;
  } catch (e) {
    console.log("Error fetching diagnosis:", e);
    return null;
  }
};

export const supabase = { auth: { signOut: async () => {} } };
