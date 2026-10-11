import test from "node:test";
import assert from "node:assert/strict";
import { fitWithin, MAX_IMAGE_EDGE } from "./imageUtils.js";
import { parseLineItems } from "./quoteParse.js";

// A real reply from the live backend for a made-up quote photo.
const REAL_REPLY = `✅ NECESSARY
• Front brake pads and rotors $489.00 — Fair price (DIY $150-250)
• Synthetic oil change $89.99 — Slightly high (DIY $40-50)

⚠️ OPTIONAL / CAN WAIT
• Cabin air filter $62.00 — Easy DIY for $15-20, can wait unless reduced airflow
• Tire rotation and balance $45.00 — Fair price, can wait 1-2 months if no vibration

🚨 OVERPRICED / SKIP
• Serpentine belt replacement $215.00 — Overpriced unless belt shows cracks/damage (DIY $30-40, shop should be $100-150)
• Shop supplies/disposal fee $28.50 — Negotiable, some shops include this in labor

⚠️ IF LEFT UNFIXED
• Brake pads/rotors: Metal-on-metal grinding damages calipers, costs jump to $800-1200
• Oil change: Engine wear accelerates after 7500 miles, potential $4000-6000 engine damage
• Serpentine belt: If cracked/glazed and breaks, strands you and may damage pulleys ($300-500 tow+repair)

💰 BOTTOM LINE
Pay: Brakes + Oil change = $579
Skip: Cabin filter (DIY), negotiate supplies fee, verify serpentine belt actually needs replacement = Save $250-305`;

test("fitWithin leaves small images alone and scales big ones by their longest side", () => {
  assert.equal(fitWithin(1000, 800), null);
  assert.equal(fitWithin(MAX_IMAGE_EDGE, 100), null);
  assert.deepEqual(fitWithin(4032, 3024), { width: MAX_IMAGE_EDGE }); // landscape iPhone photo
  assert.deepEqual(fitWithin(3024, 4032), { height: MAX_IMAGE_EDGE }); // portrait
});

test("fitWithin ignores unknown sizes", () => {
  assert.equal(fitWithin(0, 0), null);
  assert.equal(fitWithin(undefined, 4000), null);
});

test("parseLineItems returns only the quote's items from a real reply, not damage costs or totals", () => {
  assert.deepEqual(parseLineItems(REAL_REPLY), [
    "Front brake pads and rotors",
    "Synthetic oil change",
    "Cabin air filter",
    "Tire rotation and balance",
    "Serpentine belt replacement",
    "Shop supplies/disposal fee",
  ]);
});

test("parseLineItems copes with bold text, numbering and dash or colon separators", () => {
  const text = `✅ NECESSARY\n1. **Brake pads** — $200\n2) Oil change: $50\n- Wiper blades - $20`;
  assert.deepEqual(parseLineItems(text), ["Brake pads", "Oil change", "Wiper blades"]);
});

test("parseLineItems skips totals and tax", () => {
  const text = `✅ NECESSARY\n• Brake pads $200\n• Subtotal $200\n• Tax $16\n• Total $216`;
  assert.deepEqual(parseLineItems(text), ["Brake pads"]);
});

test("parseLineItems falls back to scanning every line when the reply has no sections", () => {
  assert.deepEqual(parseLineItems("Brake pads $200\nOil change $50"), ["Brake pads", "Oil change"]);
});

test("parseLineItems returns an empty list for replies with no prices, or no text", () => {
  assert.deepEqual(parseLineItems("I can't read this image. Please send a clearer photo."), []);
  assert.deepEqual(parseLineItems(""), []);
  assert.deepEqual(parseLineItems(null), []);
  assert.deepEqual(parseLineItems(undefined), []);
});

test("parseLineItems removes duplicates", () => {
  assert.deepEqual(parseLineItems("✅ NECESSARY\n• Oil change $50\n⚠️ OPTIONAL / CAN WAIT\n• Oil change $50"), ["Oil change"]);
});
