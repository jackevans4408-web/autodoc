// Pulls repair line items (just the names) out of the AI's quote analysis, for the "log these repairs" screen.
//
// The analysis has sections: NECESSARY, OPTIONAL / CAN WAIT, OVERPRICED / SKIP, then IF LEFT UNFIXED and BOTTOM LINE.
// Only the first three list the quote's items. Lines in the other two also contain dollar amounts (damage costs, totals),
// so they must not be treated as repairs.

const HEADER_START = /^(✅|⚠️|⚠|🚨|💰)/;
const ITEM_SECTION = /NECESSARY|OPTIONAL|CAN WAIT|OVERPRICED|SKIP/i;
const OTHER_SECTION = /UNFIXED|BOTTOM LINE/i;
const NOT_A_REPAIR = /^(total|subtotal|sub-total|grand total|tax|pay|skip|savings?|save)\b/i;

const cleanName = (text) =>
  text
    .replace(/^[\s\-•*·▪◦]+/, "") // bullet
    .replace(/^\d+[.)]\s+/, "") // "1. " numbering
    .replace(/[*_`]+/g, "") // markdown emphasis
    .replace(/[\s\-–—:(,;]+$/, "") // trailing separators left before the price
    .trim();

export const parseLineItems = (analysisText) => {
  if (!analysisText || typeof analysisText !== "string") return [];

  const lines = analysisText.split("\n").map((l) => l.trim());
  const hasSections = lines.some((l) => HEADER_START.test(l) && ITEM_SECTION.test(l));

  let inItems = !hasSections; // with no recognisable sections, fall back to scanning every line
  const names = [];

  for (const line of lines) {
    if (!line) continue;
    if (HEADER_START.test(line)) {
      inItems = !hasSections || (ITEM_SECTION.test(line) && !OTHER_SECTION.test(line));
      continue;
    }
    if (!inItems) continue;
    const dollar = line.indexOf("$");
    if (dollar <= 0) continue;
    const name = cleanName(line.slice(0, dollar));
    if (name.length > 2 && !NOT_A_REPAIR.test(name)) names.push(name);
  }
  return [...new Set(names)];
};
