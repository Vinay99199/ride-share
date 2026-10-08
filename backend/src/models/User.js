import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailOtp: {
      type: String,
    },

    emailOtpExpiresAt: {
      type: Date,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    homeLocation: {
      type: {
        type: String,
        enum: ["Point"],
       // required: true,
      },
      coordinates: {
        type: [Number],
        //required: true,
      },
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    role: {
      type: String,
      enum: ["user", "organizationAdmin", "superAdmin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ homeLocation: "2dsphere" });

const User = mongoose.model("User", userSchema);

export default User;