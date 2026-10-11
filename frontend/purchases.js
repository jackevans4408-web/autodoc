import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import { tierForProductId } from "./plans";

// RevenueCat public SDK keys (they start with "appl_" / "goog_" and are safe to ship in the app).
// Set them in frontend/.env as EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY. Without one, the paywall shows "unavailable".
const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

let configured = false;
let loggedInAs = null;

export const purchasesAvailable = () => Boolean(API_KEY);

// Configure once, and tie purchases to the Supabase user id. The backend webhook identifies users by this id.
export const initPurchases = async (userId) => {
  if (!API_KEY || !userId) return false;
  try {
    if (!configured) {
      Purchases.configure({ apiKey: API_KEY });
      configured = true;
    }
    if (loggedInAs !== userId) {
      await Purchases.logIn(userId);
      loggedInAs = userId;
    }
    return true;
  } catch (e) {
    console.log("RevenueCat init failed:", e?.message || e);
    return false;
  }
};

export const signOutPurchases = async () => {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    // Logging out an anonymous user throws; nothing to do.
  }
  loggedInAs = null;
};

// Returns the paid plans from the current offering, sorted by tier: [{ tier, pkg, title, priceString, productId }]
export const loadPlans = async () => {
  const offerings = await Purchases.getOfferings();
  const packages = offerings.current?.availablePackages || [];
  const order = { plus: 1, unlimited: 2 };
  return packages
    .map((pkg) => ({
      tier: tierForProductId(pkg.product.identifier),
      pkg,
      title: pkg.product.title,
      priceString: pkg.product.priceString,
      productId: pkg.product.identifier,
    }))
    .filter((p) => p.tier)
    .sort((a, b) => order[a.tier] - order[b.tier]);
};

// Resolves { ok: true } on success, { cancelled: true } if the user backed out, and throws on real errors.
export const buyPlan = async (pkg) => {
  try {
    await Purchases.purchasePackage(pkg);
    return { ok: true };
  } catch (e) {
    if (e?.userCancelled) return { cancelled: true };
    throw e;
  }
};

export const restorePurchases = async () => {
  const info = await Purchases.restorePurchases();
  return Object.keys(info.entitlements?.active || {}).length > 0;
};
