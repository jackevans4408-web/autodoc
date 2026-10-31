// Helpers for laying out the "HOW TO DIAGNOSE IT YOURSELF" part of an answer, where each possible cause is followed by its steps.

// "Step 3: Check the fluid level" -> { label: "Step 3", body: "Check the fluid level" }. Returns null for any other line.
export const splitStep = (line) => {
  const m = /^(Step\s*\d+)\s*[:.\-–]\s*(.*)$/i.exec(String(line ?? "").trim());
  return m ? { label: m[1].replace(/^(step)\s*(\d+)$/i, "$1 $2"), body: m[2].trim() } : null;
};

export const isDiagnoseHeader = (line) => {
  const t = String(line ?? "");
  return t.startsWith("🔍") || /how to diagnose/i.test(t);
};
