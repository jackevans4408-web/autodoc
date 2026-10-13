// Recalls from NHTSA, minus the ones the user has marked as fixed.
export const visibleRecalls = (recalls, dismissedIds) =>
  Array.isArray(recalls) ? recalls.filter((r) => !(dismissedIds || []).includes(r.NHTSACampaignNumber)) : [];

// Text beside the "Active Recalls" heading: the count while the list is still loading is unknown, so show nothing.
export const recallsCountLabel = (recalls, dismissedIds) => (Array.isArray(recalls) ? `(${visibleRecalls(recalls, dismissedIds).length})` : "");

// The collapsed choice is stored as a string on the device.
export const parseCollapsed = (stored) => stored === "true";
export const serializeCollapsed = (collapsed) => (collapsed ? "true" : "false");
