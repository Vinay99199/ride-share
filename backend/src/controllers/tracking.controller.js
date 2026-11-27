import trackingService from "../services/tracking.service.js";
import notificationService from "../services/notification.service.js";
import { stopTrackingRoom } from "../realtime/tracking.socket.js";

const respondWithTrackingError = (res, error, operation) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
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

export const startRide = async (req, res) => {
  try {
    const ride = await trackingService.startRide(req.params.rideId, req.user._id);
    await notificationService.notifyConfirmedRidePassengers(
      ride._id,
      "ride_started",
      "Ride started",
      "Your driver has started the ride."
    );
    return res.status(200).json({
      success: true,
      message: "Ride started and location sharing enabled",
      ride,
    });
  } catch (error) {
    return respondWithTrackingError(res, error, "Start ride");
  }
};

export const startLocationSharing = async (req, res) => {
  try {
    const ride = await trackingService.startSharing(
      req.params.rideId,
      req.user._id
    );
    return res.status(200).json({
      success: true,
      message: "Location sharing started",
      ride,
    });
  } catch (error) {
    return respondWithTrackingError(res, error, "Start location sharing");
  }
};

export const stopLocationSharing = async (req, res) => {
  try {
    const ride = await trackingService.stopSharing(
      req.params.rideId,
      req.user._id
    );
    await stopTrackingRoom(ride._id, "sharing_stopped");
    return res.status(200).json({
      success: true,
      message: "Location sharing stopped",
      ride,
    });
  } catch (error) {
    return respondWithTrackingError(res, error, "Stop location sharing");
  }
};

export const completeRide = async (req, res) => {
  try {
    const ride = await trackingService.completeRide(
      req.params.rideId,
      req.user._id
    );
    await notificationService.notifyConfirmedRidePassengers(
      ride._id,
      "ride_completed",
      "Ride completed",
      "Your ride has been marked as completed."
    );
    await stopTrackingRoom(ride._id, "ride_completed");
    return res.status(200).json({
      success: true,
      message: "Ride completed",
      ride,
    });
  } catch (error) {
    return respondWithTrackingError(res, error, "Complete ride");
  }
};

export const getRideTracking = async (req, res) => {
  try {
    const location = await trackingService.getLatestLocation(
      req.params.rideId,
      req.user._id
    );
    return res.status(200).json({
      success: true,
      location,
    });
  } catch (error) {
    return respondWithTrackingError(res, error, "Fetch ride tracking");
  }
};
