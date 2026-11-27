import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "company",
        "college",
        "university",
        "institute",
        "school",
        "institution",
        "other",
      ],
      required: true,
    },

    shortName: {
      type: String,
      trim: true,
      maxlength: 40,
    },

    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    state: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    country: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    domainVerificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
    },

    verifiedDomains: {
      type: [String],
      default: [],
    },

    domainVerifiedAt: {
      type: Date,
    },

    domainVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    domainVerificationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      required: true,
    },

    approvalReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    website: {
      type: String,
      trim: true,
      maxlength: 2048,
    },

    officialEmail: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    contactPerson: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    contactPhone: {
      type: String,
      trim: true,
      maxlength: 30,
    },

    registrationNumber: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    allowedDomains: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: (domains) =>
          Array.isArray(domains) &&
          domains.every(
            (domain) =>
              typeof domain === "string" &&
              /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)
          ),
        message: "Allowed email domains must be valid",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
     // required: true,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.index({ isActive: 1, name: 1 });
organizationSchema.index({ approvalStatus: 1, isActive: 1 });

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;