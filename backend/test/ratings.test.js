import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import { createRatingController } from "../src/controllers/rating.controller.js";
import protect from "../src/middleware/auth.middleware.js";
import { createRatingService } from "../src/services/rating.service.js";

const driverId = "65a1234567890abcdef12345";
const passengerId = "65a1234567890abcdef67890";
const outsiderId = "65a1234567890abcdef11111";
const rideId = "65a1234567890abcdef22222";
const bookingId = "65a1234567890abcdef33333";
const secondBookingId = "65a1234567890abcdef44444";

const query = (value) => ({
  select() {
    return this;
  },
  session() {
    return this;
  },
  populate() {
    return this;
  },
  sort() {
    return this;
  },
  lean() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject);
  },
});

const createFixture = ({
  rideStatus = "completed",
  bookingStatus = "confirmed",
  rideDriver = driverId,
  bookingPassenger = passengerId,
  includeSecondBooking = false,
} = {}) => {
  const ride = {
    _id: rideId,
    driver: new mongoose.Types.ObjectId(rideDriver),
    status: rideStatus,
  };
  const bookings = [
    {
      _id: bookingId,
      ride: rideId,
      passenger: bookingPassenger,
      status: bookingStatus,
      isActive: true,
    },
  ];
  if (includeSecondBooking) {
    bookings.push({
      _id: secondBookingId,
      ride: rideId,
      passenger: bookingPassenger,
      status: "confirmed",
      isActive: true,
    });
  }
  const users = [
    { _id: driverId, name: "Driver", rating: 0, ratingCount: 0 },
    { _id: passengerId, name: "Passenger", rating: 0, ratingCount: 0 },
  ];
  const ratings = [];
  let nextRatingId = 1;
  const RatingModel = {
    create: async ([data]) => {
      if (
        ratings.some(
          (existing) =>
            String(existing.booking) === String(data.booking) &&
            String(existing.reviewer) === String(data.reviewer)
        )
      ) {
        throw Object.assign(new Error("Duplicate review"), { code: 11000 });
      }
      const saved = {
        _id: String(nextRatingId++).padStart(24, "0"),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      ratings.push(saved);
      return [saved];
    },
    aggregate: (pipeline) => {
      const reviewee = String(pipeline[0].$match.reviewee);
      const relevant = ratings.filter(
        (rating) => String(rating.reviewee) === reviewee
      );
      const result = relevant.length
        ? [
            {
              _id: null,
              count: relevant.length,
              average:
                relevant.reduce((total, rating) => total + rating.rating, 0) /
                relevant.length,
            },
          ]
        : [];
      const promise = Promise.resolve(result);
      promise.session = () => promise;
      return promise;
    },
    findById: (id) => query(ratings.find((rating) => rating._id === String(id))),
    findOneAndUpdate: async (filter, update) => {
      const rating = ratings.find(
        (item) =>
          item._id === String(filter._id) &&
          String(item.reviewer) === String(filter.reviewer)
      );
      if (!rating) return null;
      Object.assign(rating, update.$set, { updatedAt: new Date() });
      return rating;
    },
    findOneAndDelete: async (filter) => {
      const index = ratings.findIndex(
        (item) =>
          item._id === String(filter._id) &&
          String(item.reviewer) === String(filter.reviewer)
      );
      return index < 0 ? null : ratings.splice(index, 1)[0];
    },
    find: () => query(ratings),
  };
  const BookingModel = {
    findById: (id) =>
      query(bookings.find((booking) => String(booking._id) === String(id))),
    findOne: (filter) =>
      query(
        bookings.find(
          (booking) =>
            String(booking.ride) === String(filter.ride) &&
            String(booking.passenger) === String(filter.passenger) &&
            booking.status === filter.status &&
            booking.isActive === filter.isActive
        )
      ),
  };
  const RideModel = {
    findById: (id) => query(String(id) === rideId ? ride : null),
  };
  const UserModel = {
    updateOne: async (filter, update) => {
      const user = users.find((item) => String(item._id) === String(filter._id));
      if (user) Object.assign(user, update.$set);
      return { matchedCount: user ? 1 : 0 };
    },
    findById: (id) =>
      query(users.find((user) => String(user._id) === String(id))),
  };
  const transactionManager = {
    startSession: async () => ({
      withTransaction: async (operation) => {
        const ratingSnapshot = ratings.map((rating) => ({ ...rating }));
        const userSnapshot = users.map((user) => ({ ...user }));
        try {
          return await operation();
        } catch (error) {
          ratings.splice(0, ratings.length, ...ratingSnapshot);
          users.splice(0, users.length, ...userSnapshot);
          throw error;
        }
      },
      endSession: async () => {},
    }),
  };
  const ratingService = createRatingService({
    mongoose: transactionManager,
    RatingModel,
    BookingModel,
    RideModel,
    UserModel,
  });
  const controller = createRatingController({
    mongoose,
    RatingModel,
    BookingModel,
    RideModel,
    UserModel,
    ratingService,
    logger: { error() {} },
  });

  return { bookings, controller, ratingService, ratings, ride, users };
};

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

test("supports both passenger-to-driver and driver-to-passenger reviews", async () => {
  const fixture = createFixture();
  const passengerReview = await fixture.ratingService.create(passengerId, {
    bookingId,
    rating: 5,
    review: "Great ride",
  });
  const driverReview = await fixture.ratingService.create(driverId, {
    bookingId,
    rating: 4,
  });

  assert.equal(String(passengerReview.reviewee), driverId);
  assert.equal(String(driverReview.reviewee), passengerId);
  assert.equal(fixture.users[0].rating, 5);
  assert.equal(fixture.users[1].rating, 4);
});

test("rejects reviews before completion, without a confirmed booking, and from nonparticipants", async () => {
  await assert.rejects(
    createFixture({ rideStatus: "scheduled" }).ratingService.create(
      passengerId,
      { bookingId, rating: 5 }
    ),
    { statusCode: 409 }
  );
  await assert.rejects(
    createFixture({ bookingStatus: "pending" }).ratingService.create(
      passengerId,
      { bookingId, rating: 5 }
    ),
    { statusCode: 409 }
  );
  await assert.rejects(
    createFixture().ratingService.create(outsiderId, {
      bookingId,
      rating: 5,
    }),
    { statusCode: 403 }
  );
});

test("rejects self-reviews and duplicate reviews for a booking and reviewer", async () => {
  const selfReview = createFixture({
    rideDriver: passengerId,
    bookingPassenger: passengerId,
  });
  await assert.rejects(
    selfReview.ratingService.create(passengerId, { bookingId, rating: 5 }),
    { statusCode: 400 }
  );

  const fixture = createFixture();
  await fixture.ratingService.create(passengerId, { bookingId, rating: 5 });
  await assert.rejects(
    fixture.ratingService.create(passengerId, { bookingId, rating: 4 }),
    { code: 11000 }
  );
});

test("validates integer ratings and rejects unexpected identity fields", async () => {
  const fixture = createFixture();
  for (const rating of [0, 6, 2.5, "5"]) {
    const res = response();
    await fixture.controller.createRating(
      { user: { _id: passengerId }, body: { bookingId, rating } },
      res
    );
    assert.equal(res.statusCode, 400);
  }

  const unexpected = response();
  await fixture.controller.createRating(
    {
      user: { _id: passengerId },
      body: { bookingId, rating: 5, reviewer: driverId },
    },
    unexpected
  );
  assert.equal(unexpected.statusCode, 400);

  const valid = response();
  await fixture.controller.createRating(
    { user: { _id: passengerId }, body: { bookingId, rating: 5 } },
    valid
  );
  assert.equal(valid.statusCode, 201);
});

test("only the review owner can update or delete; aggregates stay accurate", async () => {
  const fixture = createFixture({ includeSecondBooking: true });
  const first = await fixture.ratingService.create(passengerId, {
    bookingId,
    rating: 5,
  });
  const second = await fixture.ratingService.create(passengerId, {
    bookingId: secondBookingId,
    rating: 3,
  });
  assert.equal(fixture.users[0].rating, 4);
  assert.equal(fixture.users[0].ratingCount, 2);

  await assert.rejects(
    fixture.ratingService.update(first._id, driverId, { rating: 1 }),
    { statusCode: 403 }
  );
  await assert.rejects(
    fixture.ratingService.remove(first._id, driverId),
    { statusCode: 403 }
  );

  await fixture.ratingService.update(first._id, passengerId, { rating: 1 });
  assert.equal(fixture.users[0].rating, 2);
  assert.equal(fixture.users[0].ratingCount, 2);

  await fixture.ratingService.remove(second._id, passengerId);
  assert.equal(fixture.users[0].rating, 1);
  assert.equal(fixture.users[0].ratingCount, 1);
  await fixture.ratingService.remove(first._id, passengerId);
  assert.equal(fixture.users[0].rating, 0);
  assert.equal(fixture.users[0].ratingCount, 0);
});

test("rolls back a review when its recipient aggregate cannot be updated", async () => {
  const fixture = createFixture();
  fixture.users.splice(0, 1);
  await assert.rejects(
    fixture.ratingService.create(passengerId, { bookingId, rating: 5 }),
    { statusCode: 404 }
  );
  assert.equal(fixture.ratings.length, 0);
});

test("rating endpoints reject unauthenticated requests through protect", async () => {
  const res = response();
  await protect(
    { headers: {} },
    res,
    () => assert.fail("unauthenticated request must not continue")
  );
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});

test("review reads expose public names and restrict ride reviews to participants", async () => {
  const fixture = createFixture();
  await fixture.ratingService.create(passengerId, {
    bookingId,
    rating: 5,
    review: "Good trip",
  });

  const userResponse = response();
  await fixture.controller.getUserRatings(
    { params: { userId: driverId } },
    userResponse
  );
  assert.equal(userResponse.statusCode, 200);
  assert.deepEqual(userResponse.body.user, {
    _id: driverId,
    name: "Driver",
  });
  assert.equal(userResponse.body.ratingAverage, 5);
  assert.equal(userResponse.body.reviewCount, 1);
  assert.equal(Object.hasOwn(userResponse.body.user, "email"), false);

  const rideResponse = response();
  await fixture.controller.getRideRatings(
    { user: { _id: outsiderId }, params: { rideId } },
    rideResponse
  );
  assert.equal(rideResponse.statusCode, 403);

  const passengerResponse = response();
  await fixture.controller.getRideRatings(
    { user: { _id: passengerId }, params: { rideId } },
    passengerResponse
  );
  assert.equal(passengerResponse.statusCode, 200);
  assert.equal(passengerResponse.body.count, 1);
});
