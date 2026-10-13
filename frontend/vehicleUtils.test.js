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
