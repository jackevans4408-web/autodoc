// Feature switches, set at build time (EXPO_PUBLIC_* values are baked into the app).

// The paywall, usage counter and plan row stay hidden until subscriptions are fully set up and tested.
export const SUBSCRIPTIONS_ENABLED = process.env.EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED === "true";

// The numeric id in the app's App Store URL (apps.apple.com/app/id123456789). The Rate row is hidden until it is set.
export const APP_STORE_ID = process.env.EXPO_PUBLIC_APP_STORE_ID || "";

// Everything the app keeps on the device. Deleting an account wipes all of it.
export const LOCAL_DATA_KEYS = [
  "userSession",
  "userCar",
  "userCars",
  "repairHistory",
  "savedQuotes",
  "dismissedRecalls",
  "activeMaintenanceItems",
  "maintenanceSchedule",
  "carMileages",
  "aiConsent",
];
