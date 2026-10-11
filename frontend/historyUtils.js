// Pure helpers for diagnosis conversation history. Kept free of React/Expo imports so they can be tested with `node --test`.

const API_HISTORY_LIMIT = 6;

// The backend only needs recent context: keep the first message plus the latest few.
export const buildApiHistory = (fullHistory) =>
  fullHistory.length > API_HISTORY_LIMIT
    ? [fullHistory[0], ...fullHistory.slice(-(API_HISTORY_LIMIT - 1))]
    : [...fullHistory];

export const appendExchange = (fullHistory, userText, assistantText) => [
  ...fullHistory,
  { role: "user", content: userText },
  { role: "assistant", content: assistantText },
];

// The messages column may come back as a JSON string, an array, or null.
export const parseStoredMessages = (raw) => {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(value)
    ? value.filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
    : [];
};

export const toDisplayMessages = (history) =>
  history.map((m) => ({ role: m.role === "user" ? "user" : "bot", text: m.content }));

// Rebuild the conversation from a saved row, falling back to the first exchange for older rows without messages.
export const restoreConversation = (row) => {
  const stored = parseStoredMessages(row?.messages);
  const history = stored.length > 0
    ? stored
    : [
        { role: "user", content: row?.problem ?? "" },
        { role: "assistant", content: row?.diagnosis ?? "" },
      ];
  return { history, display: toDisplayMessages(history) };
};

// A conversation is added to the history list under a temporary id before the database has assigned its real one.
// Swap the real id in once it arrives, so reopening and deleting talk to the right database row.
export const adoptSavedId = (list, tempId, realId) =>
  list.map((d) => (d.id === tempId ? { ...d, id: realId, supabaseId: realId } : d));

// Keep the local copy of a saved conversation in step with follow-ups, so reopening it never shows a stale version.
export const withUpdatedMessages = (list, id, messages) => list.map((d) => (d.id === id ? { ...d, messages } : d));
