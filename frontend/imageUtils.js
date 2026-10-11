// Photos from a modern iPhone are 12 megapixels or more. Sending them as-is is slow and can exceed the AI service's
// size limit, so every photo is shrunk and re-encoded as a JPEG before it is attached.

// Longest side, in pixels. Larger images are scaled down by the AI service anyway.
export const MAX_IMAGE_EDGE = 1568;

// Returns { width } or { height } to scale the longest side down to `max`, or null when the image already fits.
export const fitWithin = (width, height, max = MAX_IMAGE_EDGE) => {
  if (!width || !height || Math.max(width, height) <= max) return null;
  return width >= height ? { width: max } : { height: max };
};
