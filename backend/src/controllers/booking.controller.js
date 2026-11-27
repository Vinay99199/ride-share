import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Ride from "../models/Ride.js";
import User from "../models/User.js";
import notificationService from "../services/notification.service.js";
import { removeTrackingPassenger } from "../realtime/tracking.socket.js";
import { canCancelBooking } from "../services/bookingPolicy.service.js";

const publicUserFields = "name rating ratingCount";
const isValidId = (id) => mongoose.isValidObjectId(id);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const bookingOperationError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });
export const validateBookingInput = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "A JSON object is required";
  }
  if (
    Object.keys(body).some(
      (field) => !["rideId", "seatsBooked"].includes(field)
    )
  ) {
    return "Unexpected booking field";
  }
  if (!isValidId(body.rideId)) {
    return "A valid rideId is required";
  }
  if (!Number.isInteger(body.seatsBooked) || body.seatsBooked < 1) {
    return "seatsBooked must be a positive integer";
  }
  return null;
};

const populateBooking = (query) =>
  query
    .populate("passenger", publicUserFields)
    .populate({
      path: "ride",
      select:
        "driver pickupLocation dropLocation pickupLocationName pickupAddress dropLocationName dropAddress departureTime totalSeats availableSeats pricePerSeat vehicleType status startedAt trackingActive",
      populate: {
        path: "driver",
        select: publicUserFields,
      },
    });

const restoreRideSeats = async (rideId, seats, session) => {
  const result = await Ride.updateOne(
    {
      _id: rideId,
      status: { $in: ["scheduled", "cancelled"] },
      startedAt: null,
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

export const createBookingController = ({
  BookingModel = Booking,
  RideModel = Ride,
  notifications = notificationService,
  now = () => new Date(),
} = {}) => async (req, res) => {
  try {
    const body = req.body;
    const validationError = validateBookingInput(body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }
    const { rideId, seatsBooked } = body;

    const ride = await RideModel.findById(rideId);
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
      ride.startedAt ||
      ride.departureTime.getTime() <= now().getTime()
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

    const existingBooking = await BookingModel.findOne({
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

    const booking = await BookingModel.create({
      ride: ride._id,
      passenger: req.user._id,
      seatsBooked,
      totalPrice: seatsBooked * ride.pricePerSeat,
      status: "pending",
      isActive: true,
    });

    await notifications.notifyAfterCommit([
      {
        recipient: ride.driver,
        type: "booking_requested",
        title: "New booking request",
        message: "A passenger requested to book your ride.",
        relatedRide: ride._id,
        relatedBooking: booking._id,
        eventKey: `booking:${booking._id}:requested`,
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Booking request created successfully",
      booking,
    });
  } catch (error) {
    return respondWithError(res, error, "Create booking");
  }
};

export const createBooking = createBookingController();

export const createMyBookingsController = ({
  BookingModel = Booking,
  RideModel = Ride,
  UserModel = User,
  now = () => new Date(),
} = {}) => async (req, res) => {
  try {
    const allowedQueryFields = new Set([
      "page",
      "limit",
      "status",
      "search",
      "sort",
    ]);
    if (Object.keys(req.query ?? {}).some((key) => !allowedQueryFields.has(key))) {
      return res.status(400).json({
        success: false,
        message: "Unexpected booking filter",
      });
    }

    const pageValue = req.query.page === undefined ? 1 : Number(req.query.page);
    const limitValue = req.query.limit === undefined ? 10 : Number(req.query.limit);
    const status = req.query.status ?? "all";
    const sort = req.query.sort ?? "newest";
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (
      !Number.isInteger(pageValue) ||
      pageValue < 1 ||
      !Number.isInteger(limitValue) ||
      limitValue < 1 ||
      limitValue > 50 ||
      !["all", "upcoming", "pending", "confirmed", "rejected", "cancelled", "completed"].includes(status) ||
      !["newest", "oldest"].includes(sort) ||
      (req.query.search !== undefined &&
        (typeof req.query.search !== "string" || search.length > 100))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking search, status, sort, or pagination values",
      });
    }

    const clauses = [{ passenger: req.user._id }];
    if (status === "upcoming") {
      const upcomingRideIds = await RideModel.find({
        status: "scheduled",
        startedAt: null,
        departureTime: { $gt: now() },
      }).distinct("_id");
      clauses.push({
        status: { $in: ["pending", "confirmed"] },
        ride: { $in: upcomingRideIds },
      });
    } else if (status === "completed") {
      const completedRideIds = await RideModel.distinct("_id", {
        status: "completed",
      });
      clauses.push({
        status: "confirmed",
        ride: { $in: completedRideIds },
      });
    } else if (status === "cancelled") {
      const cancelledRideIds = await RideModel.distinct("_id", {
        status: "cancelled",
      });
      clauses.push({
        $or: [
          { status: "cancelled" },
          { ride: { $in: cancelledRideIds } },
        ],
      });
    } else if (status !== "all") {
      clauses.push({ status });
    }

    if (search) {
      const searchExpression = escapeRegExp(search);
      const matchingUsers = await UserModel.find({
        name: { $regex: searchExpression, $options: "i" },
      })
        .select("_id")
        .lean();
      const rideConditions = [];
      if (isValidId(search)) {
        rideConditions.push({ _id: search });
      }
      if (matchingUsers.length) {
        rideConditions.push({
          driver: { $in: matchingUsers.map((matchedUser) => matchedUser._id) },
        });
      }
      const matchingRideIds = rideConditions.length
        ? await RideModel.find({ $or: rideConditions }).distinct("_id")
        : [];
      const searchConditions = [];
      if (isValidId(search)) {
        searchConditions.push({ _id: search });
      }
      if (matchingRideIds.length) {
        searchConditions.push({ ride: { $in: matchingRideIds } });
      }
      clauses.push(
        searchConditions.length
          ? { $or: searchConditions }
          : { _id: { $exists: false } }
      );
    }

    const filter = clauses.length === 1 ? clauses[0] : { $and: clauses };
    const total = await BookingModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limitValue);
    const page = totalPages ? Math.min(pageValue, totalPages) : 1;
    const bookings = await populateBooking(
      BookingModel.find(filter)
    )
      .sort({ createdAt: sort === "newest" ? -1 : 1, _id: sort === "newest" ? -1 : 1 })
      .skip((page - 1) * limitValue)
      .limit(limitValue);

    return res.status(200).json({
      success: true,
      count: total,
      total,
      page,
      limit: limitValue,
      totalPages,
      bookings,
    });
  } catch (error) {
    return respondWithError(res, error, "Fetch bookings");
  }
};

export const getMyBookings = createMyBookingsController();

export const getMyDriverBookings = async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.user._id }).select("_id");
    const bookings = await populateBooking(
      Booking.find({
        ride: { $in: rides.map((ride) => ride._id) },
        status: { $in: ["pending", "confirmed"] },
        isActive: true,
      }).select("+isActive")
    ).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    return respondWithError(res, error, "Fetch driver bookings");
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

    const ride = await Ride.findById(booking.ride).select(
      "driver status startedAt"
    );
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }
    if (!canCancelBooking(booking, ride)) {
      return res.status(409).json({
        success: false,
        message: "Bookings cannot be cancelled after a ride has started",
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

    await notificationService.notifyAfterCommit([
      {
        recipient: ride.driver,
        type: "booking_cancelled_by_passenger",
        title: "Booking cancelled",
        message: "A passenger cancelled their booking.",
        relatedRide: previousBooking.ride,
        relatedBooking: previousBooking._id,
        eventKey: `booking:${previousBooking._id}:cancelled_by_passenger`,
      },
    ]);
    if (previousBooking.status === "confirmed") {
      await removeTrackingPassenger(previousBooking.ride, req.user._id);
    }

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

export const cancelBookingByDriver = async (req, res) => {
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

    const ride = await Ride.findById(booking.ride).select(
      "driver status startedAt"
    );
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }
    if (!ride.driver.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only the ride's driver can cancel this booking",
      });
    }
    if (!canCancelBooking(booking, ride)) {
      return res.status(409).json({
        success: false,
        message: "Bookings cannot be cancelled after a ride has started",
      });
    }
    if (booking.status !== "confirmed" || !booking.isActive) {
      return res.status(409).json({
        success: false,
        message: "Only confirmed bookings can be cancelled by the driver",
      });
    }

    session = await mongoose.startSession();
    let cancelledBooking;
    await session.withTransaction(async () => {
      cancelledBooking = await Booking.findOneAndUpdate(
        {
          _id: booking._id,
          status: "confirmed",
          isActive: true,
        },
        { $set: { status: "cancelled", isActive: false } },
        { new: false, session }
      );
      if (!cancelledBooking) {
        throw bookingOperationError(
          409,
          "Booking status changed before it could be cancelled"
        );
      }

      await restoreRideSeats(
        cancelledBooking.ride,
        cancelledBooking.seatsBooked,
        session
      );
    });

    await notificationService.notifyAfterCommit([
      {
        recipient: cancelledBooking.passenger,
        type: "booking_cancelled_by_driver",
        title: "Booking cancelled by driver",
        message: "The driver cancelled your confirmed booking.",
        relatedRide: cancelledBooking.ride,
        relatedBooking: cancelledBooking._id,
        eventKey: `booking:${cancelledBooking._id}:cancelled_by_driver`,
      },
    ]);
    await removeTrackingPassenger(cancelledBooking.ride, cancelledBooking.passenger);

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking: await populateBooking(Booking.findById(cancelledBooking._id)),
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

export const createReviewBookingController = ({
  BookingModel = Booking,
  RideModel = Ride,
  mongooseInstance = mongoose,
  notifications = notificationService,
  now = () => new Date(),
} = {}) => async (req, res) => {
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

    const booking = await BookingModel.findById(bookingId).select("+isActive");
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const ride = await RideModel.findById(booking.ride).select("driver");
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
      const rejectedBooking = await BookingModel.findOneAndUpdate(
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

      await notifications.notifyAfterCommit([
        {
          recipient: rejectedBooking.passenger,
          type: "booking_rejected",
          title: "Booking declined",
          message: "Your booking request was declined by the driver.",
          relatedRide: rejectedBooking.ride,
          relatedBooking: rejectedBooking._id,
          eventKey: `booking:${rejectedBooking._id}:rejected`,
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Booking rejected successfully",
        booking: await populateBooking(
          BookingModel.findById(rejectedBooking._id)
        ),
      });
    }

    session = await mongooseInstance.startSession();
    let confirmedBooking;
    await session.withTransaction(async () => {
      const updatedRide = await RideModel.findOneAndUpdate(
        {
          _id: booking.ride,
          status: "scheduled",
          startedAt: null,
          departureTime: { $gt: now() },
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

      confirmedBooking = await BookingModel.findOneAndUpdate(
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

    await notifications.notifyAfterCommit([
      {
        recipient: confirmedBooking.passenger,
        type: "booking_confirmed",
        title: "Booking confirmed",
        message: "Your booking has been confirmed by the driver.",
        relatedRide: confirmedBooking.ride,
        relatedBooking: confirmedBooking._id,
        eventKey: `booking:${confirmedBooking._id}:confirmed`,
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Booking confirmed successfully",
      booking: await populateBooking(
        BookingModel.findById(confirmedBooking._id)
      ),
    });
  } catch (error) {
    return respondWithError(res, error, "Review booking");
  } finally {
    await session?.endSession();
  }
};

export const reviewBooking = createReviewBookingController();
