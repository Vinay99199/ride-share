import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["car", "bike"],
      required: true,
    },

    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    mileage: {
      type: Number,
      required: true,
      min: 0,
    },

    seats: {
      type: Number,
      required: true,
      min: 1,
    },

    rcUrl: {
      type: String,
      required: true,
    },

    dlUrl: {
      type: String,
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;