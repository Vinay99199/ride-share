import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Seats booked must be a positive integer",
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled"],
      default: "pending",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ passenger: 1, createdAt: -1 });
bookingSchema.index({ ride: 1, status: 1, createdAt: -1 });
bookingSchema.index(
  { ride: 1, passenger: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
