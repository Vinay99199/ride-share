import express from "express";
import {
  cancelBooking,
  createBooking,
  getBookingDetails,
  getMyBookings,
  getRideBookings,
  reviewBooking,
} from "../controllers/booking.controller.js";
import protect from "../middleware/auth.middleware.js";
import requireApprovedDriver from "../middleware/driver.middleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my-bookings", protect, getMyBookings);
router.get("/ride/:rideId", protect, requireApprovedDriver, getRideBookings);
router.get("/:bookingId", protect, getBookingDetails);
router.patch("/:bookingId/cancel", protect, cancelBooking);
router.patch(
  "/:bookingId/review",
  protect,
  requireApprovedDriver,
  reviewBooking
);

export default router;
