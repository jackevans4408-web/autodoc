// The AI sometimes answers with markdown (**bold**, "* " bullets, backticks). The chat shows plain text with its own styling,
// so those marks would otherwise appear as stray symbols. Clean one line of an answer for display.
export const cleanLine = (line) =>
  String(line ?? "")
    .replace(/##?\s*/g, "")
    .replace(/\*\*|__/g, "")
    .replace(/`+/g, "")
    .replace(/^\s*\*\s+/, "• ")
    .trim();
