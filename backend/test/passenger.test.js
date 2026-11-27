import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createBookingController,
  createMyBookingsController,
  validateBookingInput,
} from "../src/controllers/booking.controller.js";
import { createPassengerDashboardController } from "../src/controllers/passengerDashboard.controller.js";
import { createRideSearchController } from "../src/controllers/ride.controller.js";
import {
  canCancelBooking,
  canCancelRide,
} from "../src/services/bookingPolicy.service.js";
import {
  createRequirePassenger,
} from "../src/middleware/passenger.middleware.js";

const passengerId = "65a1234567890abcdef12345";
const driverId = "65a1234567890abcdef67890";
const rideId = "65a1234567890abcdef11111";
const bookingId = "65a1234567890abcdef22222";

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

const queryResult = (value) => ({
  select() { return this; },
  populate() { return this; },
  sort(value) { this.sortValue = value; return this; },
  skip(value) { this.skipValue = value; return this; },
  limit(value) { this.limitValue = value; return this; },
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject);
  },
});

test("ride search excludes the caller's rides and applies safe filters, sorting, and pagination", async () => {
  let capturedFilter;
  let capturedSort;
  let capturedSkip;
  const rides = [{ _id: rideId, driver: { _id: driverId, name: "Driver" } }];
  const controller = createRideSearchController({
    RideModel: {
      find(filter) {
        capturedFilter = filter;
        return {
          populate() { return this; },
          sort(sortValue) { capturedSort = sortValue; return this; },
          skip(value) { capturedSkip = value; return this; },
          limit() { return this; },
          then(resolve, reject) {
            return Promise.resolve(rides).then(resolve, reject);
          },
        };
      },
      countDocuments: async () => 11,
    },
    UserModel: { collection: { name: "users" } },
    now: () => new Date("2026-11-25T10:00:00.000Z"),
    logger: { error() {} },
  });
  const res = response();

  await controller(
    {
      user: { _id: passengerId },
      query: {
        seatsRequired: "2",
        vehicleType: "car",
        maxPrice: "40",
        page: "2",
        limit: "5",
        sort: "price_asc",
      },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(capturedFilter.driver, { $ne: passengerId });
  assert.deepEqual(capturedFilter.availableSeats, { $gte: 2 });
  assert.equal(capturedFilter.status, "scheduled");
  assert.equal(capturedFilter.departureTime.$gt.toISOString(), "2026-11-25T10:00:00.000Z");
  assert.equal(capturedFilter.vehicleType, "car");
  assert.deepEqual(capturedFilter.pricePerSeat, { $lte: 40 });
  assert.deepEqual(capturedSort, {
    pricePerSeat: 1,
    departureTime: 1,
    _id: 1,
  });
  assert.equal(capturedSkip, 5);
  assert.equal(res.body.total, 11);
  assert.equal(res.body.totalPages, 3);
  assert.equal(res.body.rides.length, 1);
});

test("distance sorting requires a pickup and invalid ride-search filters are rejected", async () => {
  let queryCount = 0;
  const controller = createRideSearchController({
    RideModel: {
      find: () => { queryCount += 1; return queryResult([]); },
      countDocuments: async () => 0,
    },
    logger: { error() {} },
  });
  const res = response();

  await controller(
    { user: { _id: passengerId }, query: { sort: "distance" } },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(queryCount, 0);

  const invalidSort = response();
  await controller(
    { user: { _id: passengerId }, query: { sort: "random" } },
    invalidSort
  );
  assert.equal(invalidSort.statusCode, 400);
});

test("ride search interprets the selected travel date in the passenger's timezone", async () => {
  let capturedFilter;
  const controller = createRideSearchController({
    RideModel: {
      find(filter) {
        capturedFilter = filter;
        return queryResult([]);
      },
      countDocuments: async () => 0,
    },
    now: () => new Date("2026-11-25T12:00:00.000Z"),
    logger: { error() {} },
  });
  const res = response();

  await controller(
    {
      user: { _id: passengerId },
      query: {
        departureDate: "2026-11-26",
        timezoneOffsetMinutes: "-330",
        sort: "departure",
      },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(
    capturedFilter.departureTime.$gt.toISOString(),
    "2026-11-25T18:30:00.000Z"
  );
  assert.equal(
    capturedFilter.departureTime.$lt.toISOString(),
    "2026-11-26T18:30:00.000Z"
  );
});

test("my bookings filters by owner, searches driver names, and returns bounded pages", async () => {
  let userFilter;
  let rideFilter;
  let bookingFilter;
  let pageQuery;
  const matchingUsers = [{ _id: driverId }];
  const controller = createMyBookingsController({
    UserModel: {
      find(filter) {
        userFilter = filter;
        return {
          select() { return this; },
          lean: async () => matchingUsers,
        };
      },
    },
    RideModel: {
      find(filter) {
        rideFilter = filter;
        return {
          distinct: async () => [rideId],
        };
      },
      distinct: async () => [],
    },
    BookingModel: {
      countDocuments: async (filter) => {
        bookingFilter = filter;
        return 8;
      },
      find(filter) {
        pageQuery = queryResult([{ _id: bookingId, ride: rideId }]);
        pageQuery.filter = filter;
        return pageQuery;
      },
    },
  });
  const res = response();

  await controller(
    {
      user: { _id: passengerId },
      query: {
        page: "2",
        limit: "3",
        status: "confirmed",
        sort: "oldest",
        search: "Dr.*",
      },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(userFilter.name, { $regex: "Dr\\.\\*", $options: "i" });
  assert.deepEqual(rideFilter.$or[0], { driver: { $in: [driverId] } });
  assert.deepEqual(bookingFilter.$and[0], { passenger: passengerId });
  assert.deepEqual(bookingFilter.$and[1], { status: "confirmed" });
  assert.equal(pageQuery.skipValue, 3);
  assert.equal(pageQuery.limitValue, 3);
  assert.deepEqual(pageQuery.sortValue, { createdAt: 1, _id: 1 });
  assert.equal(res.body.total, 8);
  assert.equal(res.body.page, 2);
  assert.equal(res.body.bookings[0]._id, bookingId);
});

test("upcoming passenger bookings include only pending or confirmed future scheduled rides", async () => {
  let rideFilter;
  let bookingFilter;
  const controller = createMyBookingsController({
    now: () => new Date("2026-11-26T10:00:00.000Z"),
    RideModel: {
      find(filter) {
        rideFilter = filter;
        return { distinct: async () => [rideId] };
      },
    },
    BookingModel: {
      countDocuments: async (filter) => {
        bookingFilter = filter;
        return 1;
      },
      find(filter) {
        const result = queryResult([{ _id: bookingId, ride: rideId }]);
        result.filter = filter;
        return result;
      },
    },
  });
  const res = response();

  await controller(
    {
      user: { _id: passengerId },
      query: { status: "upcoming" },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(rideFilter, {
    status: "scheduled",
    startedAt: null,
    departureTime: { $gt: new Date("2026-11-26T10:00:00.000Z") },
  });
  assert.deepEqual(bookingFilter.$and[0], { passenger: passengerId });
  assert.deepEqual(bookingFilter.$and[1], {
    status: { $in: ["pending", "confirmed"] },
    ride: { $in: [rideId] },
  });
});

test("my bookings rejects malformed pagination and status filters", async () => {
  let countCalls = 0;
  const controller = createMyBookingsController({
    BookingModel: {
      countDocuments: async () => { countCalls += 1; return 0; },
    },
  });
  const res = response();

  await controller(
    {
      user: { _id: passengerId },
      query: { page: "0", limit: "1000", status: "driver" },
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(countCalls, 0);
});

test("passenger dashboard aggregates private account data for the caller only", async () => {
  const summaryPipeline = [];
  const ratingPipeline = [];
  const recent = [{ _id: bookingId, status: "confirmed" }];
  const controller = createPassengerDashboardController({
    BookingModel: {
      collection: { name: "bookings" },
      aggregate: async (pipeline) => {
        summaryPipeline.push(pipeline);
        return [{
          totalBookings: 4,
          pendingRequests: 1,
          confirmedBookings: 2,
          upcomingRides: 1,
          activeRides: 1,
          completedRides: 1,
          cancelledOrRejectedBookings: 1,
        }];
      },
      find: () => queryResult(recent),
    },
    RatingModel: {
      aggregate: async (pipeline) => {
        ratingPipeline.push(pipeline);
        return [{ count: 2, average: 4.5 }];
      },
    },
    RideModel: { collection: { name: "rides" } },
    logger: { error() {} },
  });
  const res = response();

  await controller({ user: { _id: passengerId } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(summaryPipeline[0][0], { $match: { passenger: passengerId } });
  assert.deepEqual(ratingPipeline[0][0], { $match: { reviewer: passengerId } });
  assert.equal(res.body.stats.totalRidesTravelled, 1);
  assert.equal(res.body.stats.averageRatingGiven, 4.5);
  assert.equal(res.body.stats.reviewsGiven, 2);
  assert.equal(res.body.recentBookings[0]._id, bookingId);
});

test("booking and ride cancellation are unavailable after a trip starts or completes", () => {
  assert.equal(canCancelRide({ status: "scheduled", startedAt: null }), true);
  assert.equal(canCancelRide({ status: "scheduled", startedAt: new Date() }), false);
  assert.equal(canCancelRide({ status: "completed", startedAt: new Date() }), false);
  assert.equal(
    canCancelBooking({ status: "confirmed" }, { status: "scheduled", startedAt: null }),
    true
  );
  assert.equal(
    canCancelBooking({ status: "confirmed" }, { status: "scheduled", startedAt: new Date() }),
    false
  );
  assert.equal(
    canCancelBooking({ status: "confirmed" }, { status: "completed", startedAt: new Date() }),
    false
  );
  assert.equal(
    canCancelBooking({ status: "cancelled" }, { status: "cancelled", startedAt: null }),
    false
  );
});

test("booking input rejects client-supplied prices and identity fields", () => {
  assert.equal(
    validateBookingInput({ rideId, seatsBooked: 2 }),
    null
  );
  assert.equal(
    validateBookingInput({
      rideId,
      seatsBooked: 2,
      totalPrice: 1,
      passenger: passengerId,
    }),
    "Unexpected booking field"
  );
  assert.equal(
    validateBookingInput({ rideId, seatsBooked: 1.5 }),
    "seatsBooked must be a positive integer"
  );
});

test("booking creation derives passenger and total price on the server", async () => {
  let created;
  const controller = createBookingController({
    RideModel: {
      findById: async () => ({
        _id: rideId,
        driver: { equals: (id) => id === driverId },
        status: "scheduled",
        startedAt: null,
        departureTime: new Date("2026-11-27T10:00:00.000Z"),
        availableSeats: 4,
        pricePerSeat: 12.5,
      }),
    },
    BookingModel: {
      findOne: async () => null,
      create: async (booking) => {
        created = { _id: bookingId, ...booking };
        return created;
      },
    },
    notifications: { notifyAfterCommit: async () => {} },
    now: () => new Date("2026-11-26T10:00:00.000Z"),
  });
  const res = response();

  await controller(
    {
      user: { _id: passengerId },
      body: { rideId, seatsBooked: 2 },
    },
    res
  );

  assert.equal(res.statusCode, 201);
  assert.equal(created.passenger, passengerId);
  assert.equal(created.totalPrice, 25);
  assert.equal(created.status, "pending");
  assert.equal(created.ride, rideId);
});

test("booking creation blocks own rides, duplicates, and unavailable rides", async () => {
  let createCalls = 0;
  let existingBooking = null;
  let rideState = {
    driver: { equals: (id) => id === driverId },
    status: "scheduled",
    startedAt: null,
    departureTime: new Date("2026-11-27T10:00:00.000Z"),
    availableSeats: 1,
    pricePerSeat: 10,
  };
  const controller = createBookingController({
    RideModel: { findById: async () => rideState },
    BookingModel: {
      findOne: async () => existingBooking,
      create: async () => { createCalls += 1; return {}; },
    },
    notifications: { notifyAfterCommit: async () => {} },
    now: () => new Date("2026-11-26T10:00:00.000Z"),
  });

  const ownRideResponse = response();
  await controller(
    {
      user: { _id: driverId },
      body: { rideId, seatsBooked: 1 },
    },
    ownRideResponse
  );
  assert.equal(ownRideResponse.statusCode, 403);

  const insufficientSeats = response();
  await controller(
    {
      user: { _id: passengerId },
      body: { rideId, seatsBooked: 2 },
    },
    insufficientSeats
  );
  assert.equal(insufficientSeats.statusCode, 409);

  existingBooking = { status: "pending" };
  const duplicate = response();
  await controller(
    {
      user: { _id: passengerId },
      body: { rideId, seatsBooked: 1 },
    },
    duplicate
  );
  assert.equal(duplicate.statusCode, 409);

  existingBooking = null;
  rideState = { ...rideState, status: "completed" };
  const unavailable = response();
  await controller(
    {
      user: { _id: passengerId },
      body: { rideId, seatsBooked: 1 },
    },
    unavailable
  );
  assert.equal(unavailable.statusCode, 409);
  assert.equal(createCalls, 0);
});

test("passenger API middleware permits users and denies administrators", async () => {
  const next = { called: false };
  await createRequirePassenger()({ user: { role: "user" } }, response(), () => {
    next.called = true;
  });
  assert.equal(next.called, true);

  const res = response();
  await createRequirePassenger()(
    { user: { role: "organizationAdmin" } },
    res,
    () => assert.fail("administrator must not enter passenger endpoints")
  );
  assert.equal(res.statusCode, 403);
});

test("passenger API middleware permits only approved driver accounts", async () => {
  let capturedFilter;
  const approvedDriver = createRequirePassenger({
    DriverApplicationModel: {
      findOne(filter) {
        capturedFilter = filter;
        return queryResult({ _id: "approved-application" });
      },
    },
  });
  let nextCalled = false;
  await approvedDriver(
    { user: { _id: driverId, role: "driver" } },
    response(),
    () => { nextCalled = true; }
  );
  assert.equal(nextCalled, true);
  assert.deepEqual(capturedFilter, { user: driverId, status: "approved" });

  const unapprovedDriver = createRequirePassenger({
    DriverApplicationModel: {
      findOne() {
        return queryResult(null);
      },
    },
  });
  const driverResponse = response();
  await unapprovedDriver(
    { user: { _id: driverId, role: "driver" } },
    driverResponse,
    () => assert.fail("unapproved drivers must not enter passenger endpoints")
  );
  assert.equal(driverResponse.statusCode, 403);
});
