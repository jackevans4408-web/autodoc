import test from "node:test";
import assert from "node:assert/strict";
import { afterDeletingVehicle } from "./vehicleUtils.js";

const civic = { id: "1", make: "Honda", model: "Civic" };
const camry = { id: "2", make: "Toyota", model: "Camry" };

test("deleting an inactive vehicle keeps the active one", () => {
  assert.deepEqual(afterDeletingVehicle([civic, camry], civic, "2"), { cars: [civic], activeCar: civic });
});

test("deleting the active vehicle switches to the next one", () => {
  assert.deepEqual(afterDeletingVehicle([civic, camry], civic, "1"), { cars: [camry], activeCar: camry });
});

test("deleting the last vehicle leaves no active vehicle instead of a stale one", () => {
  assert.deepEqual(afterDeletingVehicle([civic], civic, "1"), { cars: [], activeCar: null });
});

test("deleting an unknown id changes nothing", () => {
  assert.deepEqual(afterDeletingVehicle([civic], civic, "zzz"), { cars: [civic], activeCar: civic });
});

test("works when there was no active vehicle", () => {
  assert.deepEqual(afterDeletingVehicle([civic], null, "1"), { cars: [], activeCar: null });
});

import { carLabel, needsVehicleScreen } from "./vehicleUtils.js";

test("carLabel joins the parts and never prints undefined", () => {
  assert.equal(carLabel({ year: "2015", make: "Honda", model: "Civic" }), "2015 Honda Civic");
  assert.equal(carLabel({ year: "2015", make: "Honda" }), "2015 Honda");
  assert.equal(carLabel({}), "");
  assert.equal(carLabel(null), "");
  assert.equal(carLabel(undefined), "");
});

test("a new user is sent to the vehicle screen unless they skipped it", () => {
  assert.equal(needsVehicleScreen({ car: null, showAddCar: false, skipped: false }), true);
  assert.equal(needsVehicleScreen({ car: null, showAddCar: false, skipped: true }), false);
});

test("having a vehicle skips the screen, and asking to add one always shows it", () => {
  assert.equal(needsVehicleScreen({ car: civic, showAddCar: false, skipped: false }), false);
  assert.equal(needsVehicleScreen({ car: civic, showAddCar: true, skipped: false }), true);
  assert.equal(needsVehicleScreen({ car: null, showAddCar: true, skipped: true }), true);
});
