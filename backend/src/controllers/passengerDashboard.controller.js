import Booking from "../models/Booking.js";
import Rating from "../models/Rating.js";
import Ride from "../models/Ride.js";

const recentBookingFields =
  "ride passenger seatsBooked totalPrice status createdAt updatedAt";

export const createPassengerDashboardController = ({
  BookingModel = Booking,
  RatingModel = Rating,
  RideModel = Ride,
  logger = console,
  now = () => new Date(),
} = {}) => async (req, res) => {
  try {
    const userId = req.user._id;
    const currentTime = now();
    const [bookingSummaries, ratingSummaries, recentBookings] =
      await Promise.all([
        BookingModel.aggregate([
          { $match: { passenger: userId } },
          {
            $lookup: {
              from: RideModel.collection.name,
              localField: "ride",
              foreignField: "_id",
              as: "ride",
            },
          },
          {
            $unwind: {
              path: "$ride",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              pendingRequests: {
                $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
              },
              confirmedBookings: {
                $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
              },
              upcomingRides: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$status", "confirmed"] },
                        { $eq: ["$ride.status", "scheduled"] },
                        { $eq: [{ $ifNull: ["$ride.startedAt", null] }, null] },
                        { $gt: ["$ride.departureTime", currentTime] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              activeRides: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$status", "confirmed"] },
                        { $eq: ["$ride.status", "scheduled"] },
                        { $ne: [{ $ifNull: ["$ride.startedAt", null] }, null] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              completedRides: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$status", "confirmed"] },
                        { $eq: ["$ride.status", "completed"] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              cancelledOrRejectedBookings: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $in: ["$status", ["cancelled", "rejected"]] },
                        { $eq: ["$ride.status", "cancelled"] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),
        RatingModel.aggregate([
          { $match: { reviewer: userId } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              average: { $avg: "$rating" },
            },
          },
        ]),
        BookingModel.find({ passenger: userId })
          .select(recentBookingFields)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate({
            path: "ride",
            select:
              "driver pickupLocation dropLocation pickupLocationName pickupAddress dropLocationName dropAddress departureTime availableSeats totalSeats pricePerSeat vehicleType status startedAt trackingActive",
            populate: {
              path: "driver",
              select: "name rating ratingCount",
            },
          }),
      ]);

    const bookingSummary = bookingSummaries[0] ?? {};
    const ratingSummary = ratingSummaries[0] ?? {};
    return res.status(200).json({
      success: true,
      stats: {
        totalBookings: bookingSummary.totalBookings ?? 0,
        pendingRequests: bookingSummary.pendingRequests ?? 0,
        confirmedBookings: bookingSummary.confirmedBookings ?? 0,
        upcomingRides: bookingSummary.upcomingRides ?? 0,
        activeRides: bookingSummary.activeRides ?? 0,
        completedRides: bookingSummary.completedRides ?? 0,
        totalRidesTravelled: bookingSummary.completedRides ?? 0,
        cancelledOrRejectedBookings:
          bookingSummary.cancelledOrRejectedBookings ?? 0,
        reviewsGiven: ratingSummary.count ?? 0,
        averageRatingGiven: ratingSummary.average
          ? Math.round(ratingSummary.average * 100) / 100
          : 0,
      },
      recentBookings,
    });
  } catch (error) {
    logger.error("Passenger dashboard error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load passenger dashboard",
    });
  }
};

const passengerDashboard = createPassengerDashboardController();
export default passengerDashboard;
