// Scheduling helpers for local reminder notifications. Kept free of native imports so they can be tested with `node --test`.

// expo-notifications (SDK 53+) rejects a trigger without a `type`. `types` is Notifications.SchedulableTriggerInputTypes.
export const intervalTrigger = (types, seconds) => ({ type: types.TIME_INTERVAL, seconds, repeats: false });

const DAY = 60 * 60 * 24;
export const REPAIR_FOLLOW_UP_SECONDS = 14 * DAY;
export const MAINTENANCE_REMINDER_SECONDS = 30 * DAY;

// A reminder is a convenience. If it cannot be scheduled (permission refused, bad input), the repair or service the user
// just logged must still be saved and the screen must carry on, so failures are swallowed and reported as `false`.
export const safeSchedule = async (schedule, request) => {
  try {
    await schedule(request);
    return true;
  } catch (e) {
    console.log("Could not schedule reminder:", e?.message || e);
    return false;
  }
};
