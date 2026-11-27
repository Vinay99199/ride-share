import assert from "node:assert/strict";
import mongoose from "mongoose";
import test from "node:test";
import { createReviewBookingController } from "../src/controllers/booking.controller.js";

const queryFor = (value) => ({
  select: async () => value,
  populate() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject);
  },
});

const response = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("concurrent booking confirmations cannot allocate the same final seat", async () => {
  const driverId = new mongoose.Types.ObjectId();
  const rideId = new mongoose.Types.ObjectId();
  const firstBookingId = new mongoose.Types.ObjectId();
  const secondBookingId = new mongoose.Types.ObjectId();
  const bookings = new Map([
    [
      String(firstBookingId),
      {
        _id: firstBookingId,
        ride: rideId,
        passenger: new mongoose.Types.ObjectId(),
        seatsBooked: 1,
        status: "pending",
        isActive: true,
      },
    ],
    [
      String(secondBookingId),
      {
        _id: secondBookingId,
        ride: rideId,
        passenger: new mongoose.Types.ObjectId(),
        seatsBooked: 1,
        status: "pending",
        isActive: true,
      },
    ],
  ]);
  let availableSeats = 1;
  let transactionTail = Promise.resolve();
  const notificationsSent = [];
  const ride = {
    _id: rideId,
    driver: driverId,
    status: "scheduled",
    startedAt: null,
    departureTime: new Date("2030-01-01T00:00:00.000Z"),
  };
  const BookingModel = {
    findById: (id) => queryFor(bookings.get(String(id))),
    findOneAndUpdate: async (filter, update) => {
      const booking = bookings.get(String(filter._id));
      if (!booking || booking.status !== filter.status || !booking.isActive) {
        return null;
      }
      Object.assign(booking, update.$set);
      return booking;
    },
  };
  const RideModel = {
    findById: () => queryFor(ride),
    findOneAndUpdate: async (filter, update) => {
      if (
        filter._id.equals(rideId) &&
        filter.status === ride.status &&
        filter.startedAt === ride.startedAt &&
        filter.availableSeats.$gte <= availableSeats
      ) {
        availableSeats += update.$inc.availableSeats;
        return ride;
      }
      return null;
    },
  };
  const mongooseInstance = {
    startSession: async () => ({
      withTransaction: async (operation) => {
        const previousTransaction = transactionTail;
        let release;
        transactionTail = new Promise((resolve) => {
          release = resolve;
        });
        await previousTransaction;
        const seatsBefore = availableSeats;
        const statusesBefore = new Map(
          [...bookings].map(([id, booking]) => [id, booking.status])
        );
        try {
          return await operation();
        } catch (error) {
          availableSeats = seatsBefore;
          for (const [id, status] of statusesBefore) {
            bookings.get(id).status = status;
          }
          throw error;
        } finally {
          release();
        }
      },
      endSession: async () => {},
    }),
  };
  const review = createReviewBookingController({
    BookingModel,
    RideModel,
    mongooseInstance,
    notifications: {
      notifyAfterCommit: async (events) => notificationsSent.push(...events),
    },
    now: () => new Date("2026-11-26T00:00:00.000Z"),
  });
  const submitConfirmation = (bookingId) => {
    const res = response();
    return review(
      {
        params: { bookingId: String(bookingId) },
        body: { status: "confirmed" },
        user: { _id: driverId },
      },
      res
    ).then(() => res);
  };

  const results = await Promise.all([
    submitConfirmation(firstBookingId),
    submitConfirmation(secondBookingId),
  ]);

  assert.deepEqual(
    results.map((result) => result.statusCode).sort(),
    [200, 409]
  );
  assert.equal(availableSeats, 0);
  assert.equal(
    [...bookings.values()].filter((booking) => booking.status === "confirmed")
      .length,
    1
  );
  assert.equal(notificationsSent.length, 1);
});
