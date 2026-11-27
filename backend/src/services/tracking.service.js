import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import DriverApplication from "../models/DriverApplication.js";
import LiveLocation from "../models/LiveLocation.js";
import Ride from "../models/Ride.js";
import User from "../models/User.js";

const LOCATION_TTL_MS = 90 * 1000;
const MIN_UPDATE_INTERVAL_MS = 2 * 1000;
const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000;
const MAX_FUTURE_TIMESTAMP_MS = 30 * 1000;

const trackingError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const sameId = (left, right) => String(left) === String(right);

export const parseLocationUpdate = (payload, now = new Date()) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw trackingError(400, "A location object is required");
  }

  const { latitude, longitude, timestamp } = payload;
  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw trackingError(400, "Latitude or longitude is outside valid ranges");
  }

  if (typeof timestamp !== "string" || !timestamp.trim()) {
    throw trackingError(400, "timestamp must be a valid ISO date string");
  }
  const timestampParts = timestamp.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
  );
  const parsedTimestamp = new Date(timestamp);
  const calendarDate = timestampParts
    ? new Date(`${timestampParts[1]}T00:00:00.000Z`)
    : null;
  if (
    !timestampParts ||
    Number.isNaN(parsedTimestamp.getTime()) ||
    Number.isNaN(calendarDate.getTime()) ||
    calendarDate.toISOString().slice(0, 10) !== timestampParts[1] ||
    Number(timestampParts[2]) > 23 ||
    Number(timestampParts[3]) > 59 ||
    Number(timestampParts[4]) > 59 ||
    parsedTimestamp.getTime() < now.getTime() - MAX_TIMESTAMP_AGE_MS ||
    parsedTimestamp.getTime() > now.getTime() + MAX_FUTURE_TIMESTAMP_MS
  ) {
    throw trackingError(400, "timestamp is stale or in the future");
  }

  return { latitude, longitude, timestamp: parsedTimestamp };
};

export const createTrackingService = ({
  RideModel = Ride,
  BookingModel = Booking,
  DriverApplicationModel = DriverApplication,
  LiveLocationModel = LiveLocation,
  UserModel = User,
  now = () => new Date(),
} = {}) => {
  const findRide = async (rideId) => {
    if (!mongoose.isValidObjectId(rideId)) {
      throw trackingError(400, "Invalid ride ID");
    }

    const ride = await RideModel.findById(rideId);
    if (!ride) {
      throw trackingError(404, "Ride not found");
    }
    return ride;
  };

  const assertRideDriver = async (ride, userId) => {
    if (!sameId(ride.driver, userId)) {
      throw trackingError(403, "Only the ride's driver can manage tracking");
    }

    const user = await UserModel.findById(userId).select("role");
    if (!user || !["driver", "user"].includes(user.role)) {
      throw trackingError(403, "Driver account access required");
    }

    const approvedApplication = await DriverApplicationModel.findOne({
      user: userId,
      status: "approved",
    });
    if (!approvedApplication) {
      throw trackingError(403, "Approved driver application required");
    }
  };

  const hasConfirmedPassenger = (rideId) =>
    BookingModel.findOne({
      ride: rideId,
      status: "confirmed",
      isActive: true,
    });

  const assertStartedRide = (ride) => {
    if (ride.status !== "scheduled" || !ride.startedAt) {
      throw trackingError(409, "Ride has not been started or is no longer active");
    }
  };

  const assertTrackingActive = (ride) => {
    assertStartedRide(ride);
    if (!ride.trackingActive) {
      throw trackingError(409, "Location sharing is not active");
    }
  };

  const startRide = async (rideId, userId) => {
    const ride = await findRide(rideId);
    await assertRideDriver(ride, userId);

    if (ride.status !== "scheduled" || ride.startedAt) {
      throw trackingError(409, "Only a ride that has not started can be started");
    }
    if (!(await hasConfirmedPassenger(ride._id))) {
      throw trackingError(409, "A confirmed passenger is required to start tracking");
    }

    const startedRide = await RideModel.findOneAndUpdate(
      { _id: ride._id, driver: userId, status: "scheduled", startedAt: null },
      { $set: { startedAt: now(), trackingActive: true } },
      { new: true, runValidators: true }
    );
    if (!startedRide) {
      throw trackingError(409, "Ride status changed before it could be started");
    }
    return startedRide;
  };

  const startSharing = async (rideId, userId) => {
    const ride = await findRide(rideId);
    await assertRideDriver(ride, userId);
    assertStartedRide(ride);
    if (ride.trackingActive) {
      throw trackingError(409, "Location sharing is already active");
    }
    if (!(await hasConfirmedPassenger(ride._id))) {
      throw trackingError(409, "A confirmed passenger is required for tracking");
    }

    const updatedRide = await RideModel.findOneAndUpdate(
      { _id: ride._id, driver: userId, status: "scheduled", trackingActive: false },
      { $set: { trackingActive: true } },
      { new: true, runValidators: true }
    );
    if (!updatedRide) {
      throw trackingError(409, "Ride status changed before sharing could start");
    }
    return updatedRide;
  };

  const stopSharing = async (rideId, userId) => {
    const ride = await findRide(rideId);
    await assertRideDriver(ride, userId);
    if (ride.status !== "scheduled" || !ride.startedAt) {
      throw trackingError(409, "Only an active ride can stop location sharing");
    }

    const updatedRide = await RideModel.findOneAndUpdate(
      { _id: ride._id, driver: userId, status: "scheduled", startedAt: { $ne: null } },
      { $set: { trackingActive: false } },
      { new: true, runValidators: true }
    );
    if (!updatedRide) {
      throw trackingError(409, "Ride status changed before sharing could stop");
    }
    await LiveLocationModel.deleteOne({ ride: ride._id });
    return updatedRide;
  };

  const completeRide = async (rideId, userId) => {
    const ride = await findRide(rideId);
    await assertRideDriver(ride, userId);
    assertStartedRide(ride);

    const completedRide = await RideModel.findOneAndUpdate(
      { _id: ride._id, driver: userId, status: "scheduled", startedAt: { $ne: null } },
      { $set: { status: "completed", trackingActive: false } },
      { new: true, runValidators: true }
    );
    if (!completedRide) {
      throw trackingError(409, "Ride status changed before it could be completed");
    }
    await LiveLocationModel.deleteOne({ ride: ride._id });
    return completedRide;
  };

  const authorizeTrackingAccess = async (rideId, userId) => {
    const ride = await findRide(rideId);
    assertTrackingActive(ride);

    if (sameId(ride.driver, userId)) {
      await assertRideDriver(ride, userId);
      return ride;
    }

    const booking = await BookingModel.findOne({
      ride: ride._id,
      passenger: userId,
      status: "confirmed",
      isActive: true,
    });
    if (!booking) {
      throw trackingError(403, "A confirmed booking is required to track this ride");
    }
    return ride;
  };

  const updateLocation = async (rideId, userId, payload) => {
    const location = parseLocationUpdate(payload, now());
    const ride = await findRide(rideId);
    await assertRideDriver(ride, userId);
    assertTrackingActive(ride);

    const updateTime = now();
    let savedLocation;
    try {
      savedLocation = await LiveLocationModel.findOneAndUpdate(
        {
          ride: ride._id,
          $or: [
            {
              updatedAt: {
                $lte: new Date(updateTime.getTime() - MIN_UPDATE_INTERVAL_MS),
              },
            },
            { updatedAt: { $exists: false } },
          ],
        },
        {
          $set: {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: location.timestamp,
            expiresAt: new Date(updateTime.getTime() + LOCATION_TTL_MS),
          },
          $setOnInsert: { ride: ride._id },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (error) {
      if (error.code === 11000) {
        throw trackingError(429, "Location updates are too frequent");
      }
      throw error;
    }
    if (!savedLocation) {
      throw trackingError(429, "Location updates are too frequent");
    }

    const activeRide = await RideModel.findById(ride._id);
    if (
      !activeRide ||
      activeRide.status !== "scheduled" ||
      !activeRide.startedAt ||
      !activeRide.trackingActive
    ) {
      await LiveLocationModel.deleteOne({ ride: ride._id });
      throw trackingError(409, "Location sharing stopped before the update completed");
    }

    return {
      rideId: String(ride._id),
      latitude: savedLocation.latitude,
      longitude: savedLocation.longitude,
      timestamp: new Date(savedLocation.timestamp).toISOString(),
    };
  };

  const getLatestLocation = async (rideId, userId) => {
    const ride = await authorizeTrackingAccess(rideId, userId);
    const location = await LiveLocationModel.findOne({
      ride: ride._id,
      expiresAt: { $gt: now() },
    });
    if (!location) {
      return null;
    }

    return {
      rideId: String(ride._id),
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date(location.timestamp).toISOString(),
    };
  };

  return {
    authorizeTrackingAccess,
    completeRide,
    getLatestLocation,
    startRide,
    startSharing,
    stopSharing,
    updateLocation,
  };
};

const trackingService = createTrackingService();
export default trackingService;
