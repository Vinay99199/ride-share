import express from "express";
import {
  cancelRide,
  createRide,
  getAvailableRides,
  getMyRides,
  getRideDetails,
  searchRides,
} from "../controllers/ride.controller.js";
import {
  completeRide,
  getRideTracking,
  startLocationSharing,
  startRide,
  stopLocationSharing,
} from "../controllers/tracking.controller.js";
import protect from "../middleware/auth.middleware.js";
import requireApprovedDriver from "../middleware/driver.middleware.js";
import requirePassenger from "../middleware/passenger.middleware.js";

const router = express.Router();

router.get("/search", protect, requirePassenger, searchRides);
router.get("/", getAvailableRides);
router.post("/", protect, requireApprovedDriver, createRide);
router.get("/my-rides", protect, requireApprovedDriver, getMyRides);
router.post("/:rideId/start", protect, requireApprovedDriver, startRide);
router.post(
  "/:rideId/tracking/start",
  protect,
  requireApprovedDriver,
  startLocationSharing
);
router.post(
  "/:rideId/tracking/stop",
  protect,
  requireApprovedDriver,
  stopLocationSharing
);
router.post("/:rideId/complete", protect, requireApprovedDriver, completeRide);
router.get("/:rideId/tracking", protect, getRideTracking);
router.get("/:rideId", getRideDetails);
router.patch("/:rideId/cancel", protect, requireApprovedDriver, cancelRide);

export default router;
