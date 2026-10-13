// Outline shapes for the "diagnosing" animation (a gear that turns into a car). Pure data, so they can be tested and previewed.

const round = (n) => Math.round(n * 100) / 100;

// A gear outline centred on (cx, cy): `teeth` square-ish teeth around a ring, with a hole in the middle.
export const gearPath = (cx, cy, teeth, rOuter, rInner, rHole) => {
  const step = (Math.PI * 2) / teeth;
  const pt = (angle, r) => `${round(cx + r * Math.cos(angle))} ${round(cy + r * Math.sin(angle))}`;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const start = pt(a - 0.26 * step, rInner);
    d += `${i === 0 ? "M" : `A ${rInner} ${rInner} 0 0 1`} ${start} `;
    d += `L ${pt(a - 0.15 * step, rOuter)} L ${pt(a + 0.15 * step, rOuter)} L ${pt(a + 0.26 * step, rInner)} `;
  }
  d += `A ${rInner} ${rInner} 0 0 1 ${pt(-Math.PI / 2 - 0.26 * step, rInner)} Z `;
  // the hole, drawn as two half circles
  d += `M ${round(cx - rHole)} ${round(cy)} A ${rHole} ${rHole} 0 1 0 ${round(cx + rHole)} ${round(cy)} A ${rHole} ${rHole} 0 1 0 ${round(cx - rHole)} ${round(cy)} Z`;
  return d;
};

export const GEAR = { size: 48, path: gearPath(24, 24, 8, 22, 17, 7) };

// Side view of a car, drawn in a 100 x 48 box.
export const CAR = {
  width: 100,
  height: 48,
  body:
    "M18 36 L8 36 Q4 36 4 32 L4 27 Q4 24 8 23 L20 20 L29 10 Q31 7 35 7 L62 7 Q66 7 68 10 L77 20 L92 23 Q96 24 96 28 L96 32 Q96 36 92 36 L82 36 A10 10 0 0 0 62 36 L38 36 A10 10 0 0 0 18 36",
  windows: ["M24 20 L31 11 Q32 10 34 10 L47 10 L47 20 Z", "M52 10 L62 10 Q64 10 65 12 L72 20 L52 20 Z"],
  wheels: [
    { cx: 28, cy: 36, r: 7 },
    { cx: 72, cy: 36, r: 7 },
  ],
};
