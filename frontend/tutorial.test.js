import test from "node:test";
import assert from "node:assert/strict";
import { TUTORIAL_STEPS, TUTORIAL_TARGETS } from "./tutorialSteps.js";
import { padHole, placeCard } from "./tutorialLayout.js";

const screen = { width: 400, height: 800 };
const card = { width: 320, height: 200 };

test("every step has an id, title and text, ids are unique", () => {
  const ids = TUTORIAL_STEPS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of TUTORIAL_STEPS) {
    assert.ok(s.id && s.title && s.text, s.id);
  }
});

test("the tour starts and ends with a centred card, and every target is a known spot", () => {
  assert.equal(TUTORIAL_STEPS[0].target, null);
  assert.equal(TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].target, null);
  for (const s of TUTORIAL_STEPS) {
    if (s.target !== null) assert.ok(TUTORIAL_TARGETS.includes(s.target), s.target);
  }
});

test("the tour mentions the features it points at", () => {
  const text = TUTORIAL_STEPS.map((s) => s.text.toLowerCase()).join(" ");
  for (const word of ["photo", "obd", "quote", "recall", "settings"]) assert.ok(text.includes(word), word);
});

test("with nothing to highlight the card is centred", () => {
  assert.deepEqual(placeCard({ hole: null, screen, card }), { top: 300, left: 40 });
});

test("a highlight near the top puts the card below it", () => {
  const pos = placeCard({ hole: { x: 20, y: 60, width: 100, height: 40 }, screen, card });
  assert.equal(pos.top, 60 + 40 + 14);
});

test("a highlight near the bottom puts the card above it", () => {
  const pos = placeCard({ hole: { x: 20, y: 700, width: 360, height: 60 }, screen, card });
  assert.equal(pos.top, 700 - 14 - 200);
});

test("the card never runs off the sides", () => {
  const left = placeCard({ hole: { x: 0, y: 60, width: 20, height: 20 }, screen, card });
  assert.ok(left.left >= 16);
  const right = placeCard({ hole: { x: 380, y: 60, width: 20, height: 20 }, screen, card });
  assert.ok(right.left + card.width <= screen.width - 16);
});

test("if there is no room above or below, the card is centred instead of covering the highlight", () => {
  const tall = placeCard({ hole: { x: 20, y: 100, width: 360, height: 600 }, screen, card });
  assert.deepEqual(tall, { top: 300, left: 40 });
});

test("padHole adds breathing room, clips to the screen, and rejects empty boxes", () => {
  assert.deepEqual(padHole({ x: 50, y: 50, width: 100, height: 40 }, screen), { x: 44, y: 44, width: 112, height: 52 });
  assert.deepEqual(padHole({ x: 2, y: 2, width: 30, height: 30 }, screen), { x: 0, y: 0, width: 38, height: 38 });
  assert.equal(padHole({ x: 0, y: 0, width: 0, height: 10 }, screen), null);
  assert.equal(padHole(null, screen), null);
  assert.equal(padHole({ x: NaN, y: 0, width: 10, height: 10 }, screen), null);
});
