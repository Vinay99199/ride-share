import express from "express";
import {
  cancelBooking,
  cancelBookingByDriver,
  createBooking,
  getBookingDetails,
  getMyDriverBookings,
  getMyBookings,
  getRideBookings,
  reviewBooking,
} from "../controllers/booking.controller.js";
import passengerDashboard from "../controllers/passengerDashboard.controller.js";
import protect from "../middleware/auth.middleware.js";
import requireApprovedDriver from "../middleware/driver.middleware.js";
import requirePassenger from "../middleware/passenger.middleware.js";

const router = express.Router();

router.post("/", protect, requirePassenger, createBooking);
router.get("/passenger-dashboard", protect, requirePassenger, passengerDashboard);
router.get("/my-bookings", protect, requirePassenger, getMyBookings);
router.get(
  "/driver-bookings",
  protect,
  requireApprovedDriver,
  getMyDriverBookings
);
router.get("/ride/:rideId", protect, requireApprovedDriver, getRideBookings);
router.get("/:bookingId", protect, getBookingDetails);
router.patch("/:bookingId/cancel", protect, requirePassenger, cancelBooking);
router.patch(
  "/:bookingId/driver-cancel",
  protect,
  requireApprovedDriver,
  cancelBookingByDriver
);
router.patch(
  "/:bookingId/review",
  protect,
  requireApprovedDriver,
  reviewBooking
);

export default router;
