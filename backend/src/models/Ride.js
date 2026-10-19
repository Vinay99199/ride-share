import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    origin: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    destination: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    route: {
      type: {
        type: String,
        enum: ["LineString"],
        required: true,
      },
      coordinates: {
        type: [[Number]],
        required: true,
      },
    },

    departureTime: {
      type: Date,
      required: true,
    },

    days: {
      type: [String],
      required: true,
    },

    seatsAvailable: {
      type: Number,
      required: true,
      min: 0,
    },

    costPerKm: {
      type: Number,
      required: true,
      min: 0,
    },

    womenOnly: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

rideSchema.index({ route: "2dsphere" });

const Ride = mongoose.model("Ride", rideSchema);

export default Ride;