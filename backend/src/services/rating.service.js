const ratingError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const sameId = (left, right) => String(left) === String(right);

const withSession = (query, session) =>
  typeof query?.session === "function" ? query.session(session) : query;

const refreshUserRating = async (
  reviewee,
  session,
  { RatingModel, UserModel }
) => {
  let aggregate = RatingModel.aggregate([
    { $match: { reviewee } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        average: { $avg: "$rating" },
      },
    },
  ]);
  aggregate = withSession(aggregate, session);
  const [summary] = await aggregate;
  const average = summary ? Math.round(summary.average * 100) / 100 : 0;
  const count = summary?.count ?? 0;
  const result = await UserModel.updateOne(
    { _id: reviewee },
    { $set: { rating: average, ratingCount: count } },
    { session }
  );

  if (result.matchedCount === 0) {
    throw ratingError(404, "Review recipient not found");
  }
};

const startTransaction = async (mongoose, operation) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => operation(session));
  } finally {
    await session.endSession();
  }
};

export const createRatingService = ({
  mongoose,
  RatingModel,
  BookingModel,
  RideModel,
  UserModel,
}) => {
  const dependencies = { RatingModel, UserModel };

  const create = (reviewer, { bookingId, rating, review }) =>
    startTransaction(mongoose, async (session) => {
      let bookingQuery = BookingModel.findById(bookingId);
      if (typeof bookingQuery.select === "function") {
        bookingQuery = bookingQuery.select("+isActive");
      }
      const booking = await withSession(bookingQuery, session);
      if (!booking) {
        throw ratingError(404, "Booking not found");
      }
      if (booking.status !== "confirmed" || booking.isActive !== true) {
        throw ratingError(
          409,
          "Only an active, confirmed booking can be reviewed"
        );
      }

      const ride = await withSession(
        RideModel.findById(booking.ride),
        session
      );
      if (!ride) {
        throw ratingError(404, "Ride not found");
      }
      if (ride.status !== "completed") {
        throw ratingError(409, "Reviews are allowed only after ride completion");
      }

      const isPassenger = sameId(booking.passenger, reviewer);
      const isDriver = sameId(ride.driver, reviewer);
      if (!isPassenger && !isDriver) {
        throw ratingError(
          403,
          "Only the passenger or driver on this booking can submit a review"
        );
      }

      const reviewee = isPassenger ? ride.driver : booking.passenger;
      if (sameId(reviewer, reviewee)) {
        throw ratingError(400, "You cannot review yourself");
      }

      const [created] = await RatingModel.create(
        [
          {
            ride: ride._id,
            booking: booking._id,
            reviewer,
            reviewee,
            rating,
            review,
          },
        ],
        { session }
      );
      await refreshUserRating(reviewee, session, dependencies);
      return created;
    });

  const update = (ratingId, reviewer, changes) =>
    startTransaction(mongoose, async (session) => {
      const existing = await withSession(
        RatingModel.findById(ratingId),
        session
      );
      if (!existing) {
        throw ratingError(404, "Rating not found");
      }
      if (!sameId(existing.reviewer, reviewer)) {
        throw ratingError(403, "You can update only your own review");
      }

      const updated = await RatingModel.findOneAndUpdate(
        { _id: ratingId, reviewer },
        { $set: changes },
        { new: true, runValidators: true, session }
      );
      if (!updated) {
        throw ratingError(409, "Review changed before it could be updated");
      }
      await refreshUserRating(updated.reviewee, session, dependencies);
      return updated;
    });

  const remove = (ratingId, reviewer) =>
    startTransaction(mongoose, async (session) => {
      const existing = await withSession(
        RatingModel.findById(ratingId),
        session
      );
      if (!existing) {
        throw ratingError(404, "Rating not found");
      }
      if (!sameId(existing.reviewer, reviewer)) {
        throw ratingError(403, "You can delete only your own review");
      }

      const deleteQuery = withSession(
        RatingModel.findOneAndDelete({ _id: ratingId, reviewer }),
        session
      );
      const deleted = await deleteQuery;
      if (!deleted) {
        throw ratingError(409, "Review changed before it could be deleted");
      }
      await refreshUserRating(deleted.reviewee, session, dependencies);
      return deleted;
    });

  return { create, update, remove };
};
