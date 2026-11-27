import express from "express";
import {
  createRating,
  deleteRating,
  getMyReviews,
  getRideRatings,
  getUserRatings,
  updateRating,
} from "../controllers/rating.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createRating);
router.get("/my-reviews", protect, getMyReviews);
router.get("/user/:userId", protect, getUserRatings);
router.get("/ride/:rideId", protect, getRideRatings);
router.patch("/:ratingId", protect, updateRating);
router.delete("/:ratingId", protect, deleteRating);

export default router;
