import assert from "node:assert/strict";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import {
  createTrackingService,
  parseLocationUpdate,
} from "../src/services/tracking.service.js";
import {
  createSocketAuthentication,
  registerTrackingSocketHandlers,
} from "../src/realtime/tracking.socket.js";

const rideId = "65a1234567890abcdef12345";
const driverId = "65a1234567890abcdef67890";
const passengerId = "65a1234567890abcdef11111";
const otherUserId = "65a1234567890abcdef22222";
const fixedNow = new Date("2026-11-25T10:00:00.000Z");
const validPayload = {
  latitude: 12.9716,
  longitude: 77.5946,
  timestamp: fixedNow.toISOString(),
};

const createFixture = ({
  approvedDriver = true,
  confirmedPassengers = [passengerId],
  userRole = "driver",
} = {}) => {
  const ride = {
    _id: rideId,
    driver: driverId,
    status: "scheduled",
    startedAt: null,
    trackingActive: false,
  };
  const bookings = confirmedPassengers.map((passenger) => ({
    passenger,
    status: "confirmed",
    isActive: true,
  }));
  const locations = [];

  const RideModel = {
    findById: async (id) => (String(id) === rideId ? ride : null),
    findOneAndUpdate: async (filter, update) => {
      if (
        String(filter._id) !== rideId ||
        String(filter.driver) !== driverId ||
        ride.status !== filter.status
      ) {
        return null;
      }
      if (
        Object.prototype.hasOwnProperty.call(filter, "startedAt") &&
        filter.startedAt === null &&
        ride.startedAt
      ) {
        return null;
      }
      if (
        filter.startedAt?.$ne === null &&
        !ride.startedAt
      ) {
        return null;
      }
      if (
        Object.prototype.hasOwnProperty.call(filter, "trackingActive") &&
        ride.trackingActive !== filter.trackingActive
      ) {
        return null;
      }
      Object.assign(ride, update.$set);
      return ride;
    },
  };
  const BookingModel = {
    findOne: async (filter) =>
      bookings.find(
        (booking) =>
          booking.status === filter.status &&
          booking.isActive === filter.isActive &&
          (filter.passenger === undefined ||
            booking.passenger === String(filter.passenger))
      ) ?? null,
  };
  const DriverApplicationModel = {
    findOne: async (filter) =>
      approvedDriver &&
      String(filter.user) === driverId &&
      filter.status === "approved"
        ? { user: driverId, status: "approved" }
        : null,
  };
  const UserModel = {
    findById: (id) => ({
      select: async () =>
        String(id) === driverId ? { _id: driverId, role: userRole } : null,
    }),
  };
  const LiveLocationModel = {
    findOne: async (filter) =>
      locations.find(
        (location) =>
          String(location.ride) === String(filter.ride) &&
          (!filter.expiresAt ||
            location.expiresAt > filter.expiresAt.$gt)
      ) ?? null,
    findOneAndUpdate: async (filter, update) => {
      let location = locations.find(
        (entry) => String(entry.ride) === String(filter.ride)
      );
      if (
        location?.updatedAt &&
        location.updatedAt > filter.$or[0].updatedAt.$lte
      ) {
        return null;
      }
      if (!location) {
        location = { ride: filter.ride };
        locations.push(location);
      }
      Object.assign(location, update.$set, { updatedAt: fixedNow });
      return location;
    },
    deleteOne: async (filter) => {
      const index = locations.findIndex(
        (entry) => String(entry.ride) === String(filter.ride)
      );
      if (index >= 0) {
        locations.splice(index, 1);
      }
      return { deletedCount: index >= 0 ? 1 : 0 };
    },
  };

  const service = createTrackingService({
    RideModel,
    BookingModel,
    DriverApplicationModel,
    LiveLocationModel,
    UserModel,
    now: () => fixedNow,
  });
  return { ride, locations, service };
};

test("rejects malformed, out-of-range, stale, and future coordinates", () => {
  assert.throws(
    () => parseLocationUpdate({ ...validPayload, latitude: 91 }, fixedNow),
    { statusCode: 400 }
  );
  assert.throws(
    () => parseLocationUpdate({ ...validPayload, longitude: -181 }, fixedNow),
    { statusCode: 400 }
  );
  assert.throws(
    () =>
      parseLocationUpdate(
        { ...validPayload, timestamp: "not-a-date" },
        fixedNow
      ),
    { statusCode: 400 }
  );
  assert.throws(
    () =>
      parseLocationUpdate(
        { ...validPayload, timestamp: "2026-11-25" },
        fixedNow
      ),
    { statusCode: 400 }
  );
  assert.throws(
    () =>
      parseLocationUpdate(
        { ...validPayload, timestamp: "2026-02-31T10:00:00.000Z" },
        fixedNow
      ),
    { statusCode: 400 }
  );
  assert.throws(
    () =>
      parseLocationUpdate(
        {
          ...validPayload,
          timestamp: "2026-11-25T09:00:00.000Z",
        },
        fixedNow
      ),
    { statusCode: 400 }
  );
});

test("only an approved owner can start a ride with a confirmed passenger", async () => {
  const { ride, service } = createFixture();
  await assert.rejects(service.startRide(rideId, otherUserId), {
    statusCode: 403,
  });

  const unapproved = createFixture({ approvedDriver: false });
  await assert.rejects(
    unapproved.service.startRide(rideId, driverId),
    { statusCode: 403 }
  );

  const noPassenger = createFixture({ confirmedPassengers: [] });
  await assert.rejects(
    noPassenger.service.startRide(rideId, driverId),
    { statusCode: 409 }
  );

  const startedRide = await service.startRide(rideId, driverId);
  assert.ok(startedRide.startedAt instanceof Date);
  assert.equal(ride.trackingActive, true);
});

test("a passenger role cannot manage tracking even with an approved legacy application", async () => {
  const { service } = createFixture({ userRole: "passenger" });
  await assert.rejects(
    () => service.startRide(rideId, driverId),
    { statusCode: 403, message: "Driver account access required" }
  );
});

test("only confirmed passengers and the approved owner can access live location", async () => {
  const { service } = createFixture();
  await service.startRide(rideId, driverId);
  await service.updateLocation(rideId, driverId, validPayload);

  const passengerLocation = await service.getLatestLocation(
    rideId,
    passengerId
  );
  assert.equal(passengerLocation.latitude, validPayload.latitude);
  await assert.rejects(
    service.getLatestLocation(rideId, otherUserId),
    { statusCode: 403 }
  );
});

test("rejects rapid updates and stops updates after completion or cancellation", async () => {
  const { ride, service } = createFixture();
  await service.startRide(rideId, driverId);
  await service.updateLocation(rideId, driverId, validPayload);
  await assert.rejects(
    service.updateLocation(rideId, driverId, validPayload),
    { statusCode: 429 }
  );

  const completedRide = await service.completeRide(rideId, driverId);
  assert.equal(completedRide.status, "completed");
  assert.equal(completedRide.trackingActive, false);
  await assert.rejects(
    service.getLatestLocation(rideId, passengerId),
    { statusCode: 409 }
  );
  await assert.rejects(
    service.updateLocation(rideId, driverId, validPayload),
    { statusCode: 409 }
  );

  const cancelled = createFixture();
  await cancelled.service.startRide(rideId, driverId);
  cancelled.ride.status = "cancelled";
  cancelled.ride.trackingActive = false;
  await assert.rejects(
    cancelled.service.updateLocation(rideId, driverId, validPayload),
    { statusCode: 409 }
  );
});

test("rejects invalid and expired socket JWTs", async () => {
  const auth = createSocketAuthentication({
    secret: "tracking-test-secret",
    UserModel: {
      findById: () => ({
        select: async () => ({ _id: driverId }),
      }),
    },
  });
  const tokens = [
    "invalid-token",
    jwt.sign({ id: driverId }, "tracking-test-secret", { expiresIn: -1 }),
  ];

  for (const token of tokens) {
    const socket = {
      handshake: { auth: { token } },
      data: {},
    };
    await new Promise((resolve) => {
      auth(socket, (error) => {
        assert.ok(error);
        assert.equal(socket.data.userId, undefined);
        resolve();
      });
    });
  }
});

test("unauthorized sockets cannot join; authorized location updates broadcast", async () => {
  const service = {
    authorizeTrackingAccess: async (id, userId) => {
      if (id !== rideId || userId !== passengerId) {
        throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
      }
    },
    getLatestLocation: async () => null,
    updateLocation: async (id, userId, payload) => ({
      rideId: id,
      latitude: payload.latitude,
      longitude: payload.longitude,
      timestamp: payload.timestamp,
      sender: userId,
    }),
  };
  const emitted = [];
  const rooms = new Set();
  const handlers = {};
  const io = {
    use() {},
    on(event, handler) {
      if (event === "connection") {
        this.connectionHandler = handler;
      }
    },
    to(room) {
      return {
        emit: (event, payload) => emitted.push({ room, event, payload }),
      };
    },
  };
  registerTrackingSocketHandlers(io, service);
  const socket = {
    data: { userId: otherUserId },
    on: (event, handler) => {
      handlers[event] = handler;
    },
    join: async (room) => rooms.add(room),
    leave: (room) => rooms.delete(room),
    emit() {},
  };
  io.connectionHandler(socket);
  await handlers["tracking:join"]({ rideId }, () => {});
  assert.equal(rooms.size, 0);

  socket.data.userId = passengerId;
  await handlers["tracking:join"]({ rideId }, () => {});
  assert.ok(rooms.has(`ride-tracking:${rideId}`));

  await handlers["tracking:location:update"](
    { rideId, ...validPayload },
    () => {}
  );
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].event, "tracking:location");
  assert.equal(emitted[0].payload.latitude, validPayload.latitude);
});
