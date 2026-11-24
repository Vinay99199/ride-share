import mongoose from "mongoose";

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator(coordinates) {
          return (
            Array.isArray(coordinates) &&
            coordinates.length === 2 &&
            Number.isFinite(coordinates[0]) &&
            Number.isFinite(coordinates[1]) &&
            coordinates[0] >= -180 &&
            coordinates[0] <= 180 &&
            coordinates[1] >= -90 &&
            coordinates[1] <= 90
          );
        },
        message:
          "Coordinates must be [longitude, latitude] within valid geographic ranges",
      },
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pickupLocation: {
      type: pointSchema,
      required: true,
    },
    dropLocation: {
      type: pointSchema,
      required: true,
    },
    departureTime: {
      type: Date,
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Total seats must be a positive integer",
      },
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Available seats must be a non-negative integer",
      },
    },
    pricePerSeat: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: "Price per seat must be a finite number",
      },
    },
    vehicleType: {
      type: String,
      enum: ["car", "bike"],
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

rideSchema.pre("validate", function () {
  if (this.availableSeats > this.totalSeats) {
    this.invalidate(
      "availableSeats",
      "Available seats cannot exceed total seats"
    );
  }
});

rideSchema.index({ pickupLocation: "2dsphere" });
rideSchema.index({ dropLocation: "2dsphere" });
rideSchema.index({ status: 1, availableSeats: 1, departureTime: 1 });

const Ride = mongoose.model("Ride", rideSchema);

export default Ride;
