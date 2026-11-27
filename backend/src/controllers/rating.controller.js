import mongoose from "mongoose";
import Rating from "../models/Rating.js";
import Booking from "../models/Booking.js";
import Ride from "../models/Ride.js";
import User from "../models/User.js";
import { createRatingService } from "../services/rating.service.js";

const publicRatingFields =
  "_id ride booking reviewer reviewee rating review createdAt updatedAt";
const allowedCreateFields = new Set(["bookingId", "rating", "review"]);
const allowedUpdateFields = new Set(["rating", "review"]);

const invalidFields = (body, allowed) =>
  Object.keys(body).some((field) => !allowed.has(field));

const validateReviewFields = (body, { requireBookingId = false } = {}) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "A JSON object is required";
  }
  if (invalidFields(body, requireBookingId ? allowedCreateFields : allowedUpdateFields)) {
    return "Unexpected request field";
  }
  if (requireBookingId && !mongoose.isValidObjectId(body.bookingId)) {
    return "A valid bookingId is required";
  }
  if (
    Object.prototype.hasOwnProperty.call(body, "rating") &&
    (typeof body.rating !== "number" ||
      !Number.isInteger(body.rating) ||
      body.rating < 1 ||
      body.rating > 5)
  ) {
    return "rating must be an integer from 1 to 5";
  }
  if (
    Object.prototype.hasOwnProperty.call(body, "review") &&
    (typeof body.review !== "string" || body.review.length > 1000)
  ) {
    return "review must be a string no longer than 1000 characters";
  }
  if (requireBookingId && !Object.prototype.hasOwnProperty.call(body, "rating")) {
    return "rating is required";
  }
  if (!requireBookingId && Object.keys(body).length === 0) {
    return "At least one of rating or review is required";
  }
  return null;
};

const sendError = (res, error, operation, logger) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "You have already reviewed this booking",
    });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  logger.error(`${operation} error:`, error.message);
  return res.status(500).json({
    success: false,
    message: `Unable to ${operation.toLowerCase()}`,
  });
};

const withQuery = (query, method, ...args) =>
  typeof query?.[method] === "function" ? query[method](...args) : query;

export const createRatingController = ({
  RatingModel = Rating,
  BookingModel = Booking,
  RideModel = Ride,
  UserModel = User,
  ratingService = createRatingService({
    mongoose,
    RatingModel,
    BookingModel,
    RideModel,
    UserModel,
  }),
  logger = console,
} = {}) => {
  const createRating = async (req, res) => {
    const validationError = validateReviewFields(req.body, {
      requireBookingId: true,
    });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    try {
      const rating = await ratingService.create(req.user._id, req.body);
      return res.status(201).json({
        success: true,
        message: "Review submitted successfully",
        rating,
      });
    } catch (error) {
      return sendError(res, error, "Submit review", logger);
    }
  };

  const getUserRatings = async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    try {
      const user = await withQuery(
        withQuery(UserModel.findById(userId), "select", "name"),
        "lean"
      );
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const reviewQuery = withQuery(
        RatingModel.find({ reviewee: userId }),
        "populate",
        "reviewer",
        "name"
      );
      const reviews = await withQuery(
        withQuery(reviewQuery, "select", publicRatingFields),
        "sort",
        { createdAt: -1 }
      );
      const [summary] = await RatingModel.aggregate([
        { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            average: { $avg: "$rating" },
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        user: { _id: user._id, name: user.name },
        ratingAverage: summary
          ? Math.round(summary.average * 100) / 100
          : 0,
        reviewCount: summary?.count ?? 0,
        reviews,
      });
    } catch (error) {
      return sendError(res, error, "Fetch user reviews", logger);
    }
  };

  const getRideRatings = async (req, res) => {
    const { rideId } = req.params;
    if (!mongoose.isValidObjectId(rideId)) {
      return res.status(400).json({ success: false, message: "Invalid ride ID" });
    }

    try {
      const ride = await RideModel.findById(rideId).select("driver");
      if (!ride) {
        return res.status(404).json({ success: false, message: "Ride not found" });
      }

      const isDriver = ride.driver.equals(req.user._id);
      if (!isDriver) {
        const booking = await BookingModel.findOne({
          ride: ride._id,
          passenger: req.user._id,
          status: "confirmed",
          isActive: true,
        }).select("_id");
        if (!booking) {
          return res.status(403).json({
            success: false,
            message: "Only ride participants can view its reviews",
          });
        }
      }

      const reviews = await RatingModel.find({ ride: ride._id })
        .select(publicRatingFields)
        .populate("reviewer", "name")
        .populate("reviewee", "name")
        .sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: reviews.length,
        reviews,
      });
    } catch (error) {
      return sendError(res, error, "Fetch ride reviews", logger);
    }
  };

  const getMyReviews = async (req, res) => {
    try {
      const reviews = await RatingModel.find({ reviewer: req.user._id })
        .select(publicRatingFields)
        .populate("reviewee", "name")
        .sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: reviews.length,
        reviews,
      });
    } catch (error) {
      return sendError(res, error, "Fetch submitted reviews", logger);
    }
  };

  const updateRating = async (req, res) => {
    const { ratingId } = req.params;
    if (!mongoose.isValidObjectId(ratingId)) {
      return res.status(400).json({ success: false, message: "Invalid rating ID" });
    }
    const validationError = validateReviewFields(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    try {
      const rating = await ratingService.update(
        ratingId,
        req.user._id,
        req.body
      );
      return res.status(200).json({
        success: true,
        message: "Review updated successfully",
        rating,
      });
    } catch (error) {
      return sendError(res, error, "Update review", logger);
    }
  };

  const deleteRating = async (req, res) => {
    const { ratingId } = req.params;
    if (!mongoose.isValidObjectId(ratingId)) {
      return res.status(400).json({ success: false, message: "Invalid rating ID" });
    }

    try {
      await ratingService.remove(ratingId, req.user._id);
      return res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error) {
      return sendError(res, error, "Delete review", logger);
    }
  };

  return {
    createRating,
    getUserRatings,
    getRideRatings,
    getMyReviews,
    updateRating,
    deleteRating,
  };
};

const controller = createRatingController();

export const createRating = controller.createRating;
export const getUserRatings = controller.getUserRatings;
export const getRideRatings = controller.getRideRatings;
export const getMyReviews = controller.getMyReviews;
export const updateRating = controller.updateRating;
export const deleteRating = controller.deleteRating;
