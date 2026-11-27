
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
      maxlength: 120,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
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

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
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
