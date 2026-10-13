// What the app should show after a vehicle is deleted. If the active vehicle is the one removed, fall back to the first
// remaining one, or to none at all, and never keep pointing at a vehicle that no longer exists.
export const afterDeletingVehicle = (cars, activeCar, deletedId) => {
  const remaining = cars.filter((c) => c.id !== deletedId);
  if (!activeCar || activeCar.id !== deletedId) return { cars: remaining, activeCar };
  return { cars: remaining, activeCar: remaining[0] || null };
};
