// What the app should show after a vehicle is deleted. If the active vehicle is the one removed, fall back to the first
// remaining one, or to none at all, and never keep pointing at a vehicle that no longer exists.
export const afterDeletingVehicle = (cars, activeCar, deletedId) => {
  const remaining = cars.filter((c) => c.id !== deletedId);
  if (!activeCar || activeCar.id !== deletedId) return { cars: remaining, activeCar };
  return { cars: remaining, activeCar: remaining[0] || null };
};

// "2015 Honda Civic", or an empty string when there is no vehicle (never "undefined undefined undefined").
export const carLabel = (car) => [car?.year, car?.make, car?.model].filter(Boolean).join(" ");

// The "add your vehicle" screen is only forced on a new user who has not chosen to skip it.
export const needsVehicleScreen = ({ car, showAddCar, skipped }) => Boolean(showAddCar || (!car && !skipped));
