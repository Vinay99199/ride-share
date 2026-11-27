import assert from "node:assert/strict";
import test from "node:test";
import { createRideController } from "../src/controllers/ride.controller.js";

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const rideBody = {
  pickupLocation: {
    longitude: 80.3319,
    latitude: 26.4499,
    name: "Kanpur Central",
    address: "Kanpur Central, Kanpur, Uttar Pradesh, India",
  },
  dropLocation: {
    longitude: 80.347,
    latitude: 26.472,
    name: "IIT Kanpur",
    address: "IIT Kanpur, Kalyanpur, Kanpur, Uttar Pradesh, India",
  },
  departureTime: "2027-01-01T10:00:00.000Z",
  totalSeats: 2,
  pricePerSeat: 10,
  vehicleType: "car",
};

const request = (body) => ({
  body,
  user: { _id: "driver-id" },
  driverApplication: { vehicleType: "car" },
});

test("ride creation converts selected place coordinates to GeoJSON and preserves labels", async () => {
  let savedRide;
  const controller = createRideController({
    RideModel: {
      create: async (ride) => {
        savedRide = ride;
        return ride;
      },
    },
    now: () => Date.parse("2026-01-01T00:00:00.000Z"),
  });
  const res = response();

  await controller(request(rideBody), res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(savedRide.pickupLocation, {
    type: "Point",
    coordinates: [80.3319, 26.4499],
  });
  assert.deepEqual(savedRide.dropLocation, {
    type: "Point",
    coordinates: [80.347, 26.472],
  });
  assert.equal(savedRide.pickupLocationName, "Kanpur Central");
  assert.equal(savedRide.pickupAddress, "Kanpur Central, Kanpur, Uttar Pradesh, India");
  assert.equal(savedRide.dropLocationName, "IIT Kanpur");
});

test("ride creation remains compatible with existing GeoJSON request bodies", async () => {
  let savedRide;
  const controller = createRideController({
    RideModel: {
      create: async (ride) => {
        savedRide = ride;
        return ride;
      },
    },
    now: () => Date.parse("2026-01-01T00:00:00.000Z"),
  });
  const legacyBody = {
    ...rideBody,
    pickupLocation: { type: "Point", coordinates: [80.3319, 26.4499] },
    dropLocation: { type: "Point", coordinates: [80.347, 26.472] },
  };
  const res = response();

  await controller(request(legacyBody), res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(savedRide.pickupLocation.coordinates, [80.3319, 26.4499]);
  assert.equal(savedRide.pickupLocationName, undefined);
});

test("ride creation rejects invalid selected coordinates without saving", async () => {
  let writes = 0;
  const controller = createRideController({
    RideModel: { create: async () => { writes += 1; } },
    now: () => Date.parse("2026-01-01T00:00:00.000Z"),
  });

  for (const invalidPickup of [
    { longitude: 181, latitude: 26.4, name: "Invalid", address: "Invalid" },
    { longitude: "80.3", latitude: 26.4, name: "Invalid", address: "Invalid" },
    { longitude: 80.3, latitude: -91, name: "Invalid", address: "Invalid" },
  ]) {
    const res = response();
    await controller(
      request({ ...rideBody, pickupLocation: invalidPickup }),
      res
    );
    assert.equal(res.statusCode, 400);
  }
  assert.equal(writes, 0);
});
