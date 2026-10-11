// Plan copy and helpers shared by the paywall and the usage counter. Keep limits in sync with backend/plans.py.

export const PLANS = [
  { tier: "free", name: "Free", price: "$0", features: ["10 diagnoses per day", "1 quote analysis per day"] },
  { tier: "plus", name: "Plus", price: "$4.99 / month", features: ["50 diagnoses per day", "25 quote analyses per day"] },
  { tier: "unlimited", name: "Unlimited", price: "$24.99 / month", features: ["Unlimited diagnoses", "Unlimited quote analyses"] },
];

// Must match the product ids created in App Store Connect and REVENUECAT_PRODUCT_TIERS on the backend.
const PRODUCT_TIERS = {
  engineeye_plus_monthly: "plus",
  engineeye_unlimited_monthly: "unlimited",
};

export const tierForProductId = (productId) => PRODUCT_TIERS[productId] || null;

const KIND_LABELS = {
  diagnosis: ["diagnosis", "diagnoses"],
  followup: ["follow-up", "follow-ups"],
  quote: ["quote analysis", "quote analyses"],
};

// "7 of 10 diagnoses left today", or null when the plan is unlimited or enforcement is off.
export const formatUsageLine = (usage, kind = "diagnosis") => {
  if (!usage || !usage.enforced) return null;
  const entry = usage.usage?.[kind];
  if (!entry || entry.limit === null) return null;
  const [singular, plural] = KIND_LABELS[kind];
  const noun = entry.limit === 1 ? singular : plural;
  return `${entry.remaining} of ${entry.limit} ${noun} left today`;
};

// What to tell the user in the chat when a request is blocked.
export const quotaMessage = (detail) => {
  const kind = detail?.kind;
  const [, plural] = KIND_LABELS[kind] || KIND_LABELS.diagnosis;
  if (!detail?.tier || detail.tier === "free") return `You've used all of your free ${plural} for today. Upgrade to keep going.`;
  return `You've reached your plan's daily limit of ${plural}. It resets on a rolling 24-hour basis.`;
};
