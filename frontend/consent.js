// The user's permission to send their information to the AI service (Apple guideline 5.1.2(i)).
// Bump CONSENT_VERSION whenever what is shared changes, so everyone is asked again.

export const CONSENT_VERSION = 1;

export const makeConsent = (userId, now = new Date()) => ({ version: CONSENT_VERSION, userId, at: now.toISOString() });

export const parseConsent = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

// Consent belongs to one user on one version of the terms; someone else signing in on the same phone must agree themselves.
export const hasValidConsent = (stored, userId) => Boolean(userId && stored && stored.version === CONSENT_VERSION && stored.userId === userId);
