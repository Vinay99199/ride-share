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
      enum: ["company", "college", "school"],
      required: true,
    },

    allowedDomains: {
      type: [String],
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

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;