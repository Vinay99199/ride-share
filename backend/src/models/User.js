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
    isEmailVerified: {
      type: Boolean,
      default: false,
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
    authVersion: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
      validate: Number.isInteger,
    },
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
      select: false,
    },
    pendingEmailOtpHash: {
      type: String,
      select: false,
    },
    pendingEmailOtpExpiresAt: {
      type: Date,
      select: false,
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
    homeLocationName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    homeAddress: {
      type: String,
      trim: true,
      maxlength: 500,
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
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Rating count must be a non-negative integer",
      },
    },

    role: {
      type: String,
      enum: [
        "user",
        "passenger",
        "driver",
        "organization",
        "organizationAdmin",
        "superAdmin",
      ],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },

    identityVerification: {
      type: new mongoose.Schema(
        {
          legalName: { type: String, trim: true, maxlength: 120 },
          documentType: {
            type: String,
            enum: ["passport", "national_id", "driver_license"],
          },
          documentLast4: {
            type: String,
            match: /^[A-Za-z0-9]{4}$/,
          },
          submittedAt: { type: Date },
          rejectionReason: { type: String, trim: true, maxlength: 500 },
          reviewedAt: { type: Date },
          reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },
        { _id: false }
      ),
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ homeLocation: "2dsphere" });
userSchema.index({ organization: 1 });

const User = mongoose.model("User", userSchema);

export default User;