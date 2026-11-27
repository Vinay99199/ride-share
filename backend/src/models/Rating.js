import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer from 1 to 5",
      },
    },
    review: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

ratingSchema.index({ booking: 1, reviewer: 1 }, { unique: true });
ratingSchema.index({ reviewee: 1, createdAt: -1 });
ratingSchema.index({ ride: 1, createdAt: -1 });

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;
