// Where to put the tutorial's text card so it never covers what it points at and never runs off the screen.

const MARGIN = 16;
const GAP = 14;

// hole: { x, y, width, height } of the highlighted element (window coordinates), or null.
// screen: { width, height }. card: { width, height }. Returns { top, left }.
export const placeCard = ({ hole, screen, card }) => {
  const centred = {
    top: Math.max((screen.height - card.height) / 2, MARGIN),
    left: Math.max((screen.width - card.width) / 2, MARGIN),
  };
  if (!hole) return centred;

  const clampLeft = (left) => Math.min(Math.max(left, MARGIN), Math.max(screen.width - card.width - MARGIN, MARGIN));
  const left = clampLeft(hole.x + hole.width / 2 - card.width / 2);
  const spaceBelow = screen.height - (hole.y + hole.height);
  const spaceAbove = hole.y;

  if (spaceBelow >= card.height + GAP + MARGIN) return { top: hole.y + hole.height + GAP, left };
  if (spaceAbove >= card.height + GAP + MARGIN) return { top: hole.y - GAP - card.height, left };
  return centred;
};

// Pad the measured box a little so the highlight has breathing room, and keep it on screen. Returns null for unusable boxes.
export const padHole = (box, screen, pad = 6) => {
  if (!box || !(box.width > 0) || !(box.height > 0)) return null;
  const x = Math.max(box.x - pad, 0);
  const y = Math.max(box.y - pad, 0);
  const right = Math.min(box.x + box.width + pad, screen.width);
  const bottom = Math.min(box.y + box.height + pad, screen.height);
  return right > x && bottom > y ? { x, y, width: right - x, height: bottom - y } : null;
};
