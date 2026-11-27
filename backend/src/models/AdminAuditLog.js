import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    action: {
      type: String,
      required: true,
      enum: [
        "user.activate",
        "user.deactivate",
        "user.role.change",
        "organization.create",
        "organization.update",
        "organization.domain.verify",
        "driverApplication.review",
        "identityVerification.review",
        "report.review",
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: [
        "user",
        "organization",
        "driverApplication",
        "identityVerification",
        "report",
      ],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    previousStatus: {
      type: String,
      default: null,
    },
    newStatus: {
      type: String,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    fieldsChanged: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

adminAuditLogSchema.index({ organization: 1, createdAt: -1 });
adminAuditLogSchema.index({ admin: 1, createdAt: -1 });
adminAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const AdminAuditLog = mongoose.model("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
