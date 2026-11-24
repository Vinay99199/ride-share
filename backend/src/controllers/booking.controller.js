import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Ride from "../models/Ride.js";

const publicUserFields = "name rating";
const isValidId = (id) => mongoose.isValidObjectId(id);

const bookingOperationError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const populateBooking = (query) =>
  query
    .populate("passenger", publicUserFields)
    .populate({
      path: "ride",
      select:
        "driver pickupLocation dropLocation departureTime totalSeats availableSeats pricePerSeat vehicleType status",
      populate: {
        path: "driver",
        select: publicUserFields,
      },
    });

const restoreRideSeats = async (rideId, seats, session) => {
  const result = await Ride.updateOne(
    {
      _id: rideId,
      $expr: {
        $lte: [{ $add: ["$availableSeats", seats] }, "$totalSeats"],
      },
    },
    { $inc: { availableSeats: seats } },
    { session }
  );

  if (result.matchedCount !== 1) {
    throw bookingOperationError(
      409,
      "Ride seats changed before they could be restored"
    );
  }
};

const respondWithError = (res, error, operation) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "You already have an active booking for this ride",
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  console.error(`${operation} error:`, error.message);
  return res.status(500).json({
    success: false,
    message: `Unable to ${operation.toLowerCase()}`,
  });
};

export const createBooking = async (req, res) => {
  try {
    const { rideId, seatsBooked } = req.body ?? {};

    if (!isValidId(rideId)) {
      return res.status(400).json({
        success: false,
        message: "A valid rideId is required",
      });
    }

    if (!Number.isInteger(seatsBooked) || seatsBooked < 1) {
      return res.status(400).json({
        success: false,
        message: "seatsBooked must be a positive integer",
      });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.driver.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot book your own ride",
      });
    }

    if (
      ride.status !== "scheduled" ||
      ride.departureTime.getTime() <= Date.now()
    ) {
      return res.status(409).json({
        success: false,
        message: "Only scheduled rides with a future departure can be booked",
      });
    }

    if (ride.availableSeats < seatsBooked) {
      return res.status(409).json({
        success: false,
        message: "Not enough seats are available",
      });
    }

    const existingBooking = await Booking.findOne({
      ride: ride._id,
      passenger: req.user._id,
      isActive: true,
    });
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "You already have an active booking for this ride",
      });
    }

    const booking = await Booking.create({
      ride: ride._id,
      passenger: req.user._id,
      seatsBooked,
      totalPrice: seatsBooked * ride.pricePerSeat,
      status: "pending",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Booking request created successfully",
      booking,
    });
  } catch (error) {
    return respondWithError(res, error, "Create booking");
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await populateBooking(
      Booking.find({ passenger: req.user._id })
    ).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    return respondWithError(res, error, "Fetch bookings");
  }
};

export const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!isValidId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await populateBooking(
      Booking.findById(bookingId).select("+isActive")
    );
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const isPassenger = booking.passenger._id.equals(req.user._id);
    const isRideDriver =
      booking.ride?.driver?._id.equals(req.user._id) ?? false;
    if (!isPassenger && !isRideDriver) {
      return res.status(403).json({
        success: false,
        message: "Only the passenger or ride driver can view this booking",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    return respondWithError(res, error, "Fetch booking details");
  }
};

export const cancelBooking = async (req, res) => {
  let session;
  try {
    const { bookingId } = req.params;
    if (!isValidId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findById(bookingId).select("+isActive");
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!booking.passenger.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only the passenger who created this booking can cancel it",
      });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(409).json({
        success: false,
        message: "This booking can no longer be cancelled",
      });
    }

    session = await mongoose.startSession();
    let previousBooking;
    await session.withTransaction(async () => {
      previousBooking = await Booking.findOneAndUpdate(
        {
          _id: booking._id,
          passenger: req.user._id,
          isActive: true,
          status: { $in: ["pending", "confirmed"] },
        },
        { $set: { status: "cancelled", isActive: false } },
        { new: false, session }
      );

      if (!previousBooking) {
        throw bookingOperationError(
          409,
          "Booking status changed before it could be cancelled"
        );
      }

      if (previousBooking.status === "confirmed") {
        await restoreRideSeats(
          previousBooking.ride,
          previousBooking.seatsBooked,
          session
        );
      }
    });

    const cancelledBooking = await populateBooking(
      Booking.findById(previousBooking._id)
    );

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking: cancelledBooking,
    });
  } catch (error) {
    return respondWithError(res, error, "Cancel booking");
  } finally {
    await session?.endSession();
  }
};

export const getRideBookings = async (req, res) => {
  try {
    const { rideId } = req.params;
    if (!isValidId(rideId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    const ride = await Ride.findById(rideId).select("driver");
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (!ride.driver.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only the ride's driver can view its bookings",
      });
    }

    const bookings = await Booking.find({ ride: ride._id })
      .populate("passenger", publicUserFields)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    return respondWithError(res, error, "Fetch ride bookings");
  }
};

export const reviewBooking = async (req, res) => {
  let session;

  try {
    const { bookingId } = req.params;
    const { status } = req.body ?? {};

    if (!isValidId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    if (!["confirmed", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be confirmed or rejected",
      });
    }

    const booking = await Booking.findById(bookingId).select("+isActive");
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const ride = await Ride.findById(booking.ride).select("driver");
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (!ride.driver.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only the ride's driver can review this booking",
      });
    }

    if (booking.status !== "pending" || !booking.isActive) {
      return res.status(409).json({
        success: false,
        message: "Only pending bookings can be reviewed",
      });
    }

    if (status === "rejected") {
      const rejectedBooking = await Booking.findOneAndUpdate(
        { _id: booking._id, status: "pending", isActive: true },
        { $set: { status: "rejected", isActive: false } },
        { new: true, runValidators: true }
      );

      if (!rejectedBooking) {
        return res.status(409).json({
          success: false,
          message: "Booking status changed before it could be reviewed",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Booking rejected successfully",
        booking: await populateBooking(
          Booking.findById(rejectedBooking._id)
        ),
      });
    }

    session = await mongoose.startSession();
    let confirmedBooking;
    await session.withTransaction(async () => {
      const updatedRide = await Ride.findOneAndUpdate(
        {
          _id: booking.ride,
          status: "scheduled",
          departureTime: { $gt: new Date() },
          availableSeats: { $gte: booking.seatsBooked },
        },
        { $inc: { availableSeats: -booking.seatsBooked } },
        { new: true, session }
      );

      if (!updatedRide) {
        throw bookingOperationError(
          409,
          "Ride is no longer available or has insufficient seats"
        );
      }

      confirmedBooking = await Booking.findOneAndUpdate(
        { _id: booking._id, status: "pending", isActive: true },
        { $set: { status: "confirmed" } },
        { new: true, runValidators: true, session }
      );

      if (!confirmedBooking) {
        throw bookingOperationError(
          409,
          "Booking status changed before it could be confirmed"
        );
      }
    });

    return res.status(200).json({
      success: true,
      message: "Booking confirmed successfully",
      booking: await populateBooking(
        Booking.findById(confirmedBooking._id)
      ),
    });
  } catch (error) {
    return respondWithError(res, error, "Review booking");
  } finally {
    await session?.endSession();
  }
};
