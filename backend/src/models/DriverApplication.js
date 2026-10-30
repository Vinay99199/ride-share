
import mongoose from "mongoose";

const driverApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    licenseNumber: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    vehicleType: {
      type: String,
      enum: ["car", "bike"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

driverApplicationSchema.index({ user: 1, status: 1 });

const DriverApplication = mongoose.model(
  "DriverApplication",
  driverApplicationSchema
);

export default DriverApplication;
