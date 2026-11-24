import express from "express";
import {
  cancelRide,
  createRide,
  getAvailableRides,
  getRideDetails,
  searchRides,
} from "../controllers/ride.controller.js";
import protect from "../middleware/auth.middleware.js";
import requireApprovedDriver from "../middleware/driver.middleware.js";

const router = express.Router();

router.get("/search", searchRides);
router.get("/", getAvailableRides);
router.post("/", protect, requireApprovedDriver, createRide);
router.get("/:rideId", getRideDetails);
router.patch("/:rideId/cancel", protect, cancelRide);

export default router;
