import mongoose from "mongoose";
import DriverApplication from "../models/DriverApplication.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import notificationService from "../services/notification.service.js";
import {
  canManageOrganization,
  getAdminOrganizationIds,
} from "../services/adminAuthorization.service.js";
import { runAuditedAdminAction } from "../services/adminAudit.service.js";

const respondError = (res, status, message) =>
  res.status(status).json({ success: false, message });

export const createAdminController = ({
  mongoose: mongooseInstance = mongoose,
  DriverApplicationModel = DriverApplication,
  UserModel = User,
  OrganizationModel = Organization,
  AuditLogModel = AdminAuditLog,
  notificationService: notifications = notificationService,
  isValidObjectId = mongoose.isValidObjectId,
  logger = console,
} = {}) => ({
  getPendingDriverApplications: async (req, res) => {
    try {
      const organizationIds = await getAdminOrganizationIds(
        req.user,
        OrganizationModel
      );
      if (organizationIds && organizationIds.length === 0) {
        return respondError(
          res,
          403,
          "No organization is assigned to this administrator"
        );
      }

      const filter = { status: "pending" };
      if (organizationIds) {
        const users = await UserModel.find({
          organization: { $in: organizationIds },
        })
          .select("_id")
          .lean();
        filter.user = { $in: users.map((applicant) => applicant._id) };
      }

      const applications = await DriverApplicationModel.find(filter)
        .populate("user", "name email phone organization")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: applications.length,
        applications,
      });
    } catch (error) {
      logger.error("Fetch pending applications error:", error.message);
      return respondError(res, 500, "Unable to fetch driver applications");
    }
  },

  reviewDriverApplication: async (req, res) => {
    try {
      const { applicationId } = req.params;
      if (!isValidObjectId(applicationId)) {
        return respondError(res, 400, "Invalid driver application ID");
      }

      const body = req.body;
      const allowedFields = new Set(["status", "rejectionReason"]);
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).some((field) => !allowedFields.has(field))
      ) {
        return respondError(
          res,
          400,
          "Only status and rejectionReason are accepted"
        );
      }
      const { status, rejectionReason } = body;
      if (!["approved", "rejected"].includes(status)) {
        return respondError(res, 400, "Status must be approved or rejected");
      }
      if (
        status === "rejected" &&
        (typeof rejectionReason !== "string" ||
          rejectionReason.trim().length < 5 ||
          rejectionReason.trim().length > 500)
      ) {
        return respondError(
          res,
          400,
          "A rejectionReason between 5 and 500 characters is required"
        );
      }
      if (
        rejectionReason !== undefined &&
        (typeof rejectionReason !== "string" ||
          rejectionReason.trim().length > 500)
      ) {
        return respondError(
          res,
          400,
          "rejectionReason must be a string up to 500 characters"
        );
      }

      const application = await DriverApplicationModel.findById(applicationId);
      if (!application) {
        return respondError(res, 404, "Driver application not found");
      }
      if (application.status !== "pending") {
        return respondError(
          res,
          409,
          "This application has already been reviewed"
        );
      }

      const applicant = await UserModel.findById(application.user)
        .select("organization")
        .lean();
      if (!applicant) {
        return respondError(res, 404, "Driver applicant not found");
      }
      const canManage = await canManageOrganization(
        req.user,
        applicant.organization,
        OrganizationModel
      );
      if (!canManage) {
        return respondError(
          res,
          403,
          "This applicant is outside your organization"
        );
      }

      const reviewedApplication = await runAuditedAdminAction({
        mongoose: mongooseInstance,
        AuditLogModel,
        admin: req.user,
        organization: applicant.organization,
        action: "driverApplication.review",
        entityType: "driverApplication",
        entityId: application._id,
        previousStatus: application.status,
        newStatus: status,
        reason: status === "rejected" ? rejectionReason.trim() : "",
        operation: (session) =>
          DriverApplicationModel.findOneAndUpdate(
            { _id: application._id, status: "pending" },
            {
              $set: {
                status,
                rejectionReason:
                  status === "rejected"
                    ? rejectionReason.trim()
                    : null,
              },
            },
            { new: true, runValidators: true, session }
          ),
      });

      await notifications.notifyAfterCommit([
        {
          recipient: reviewedApplication.user,
          type: `driver_application_${status}`,
          title:
            status === "approved"
              ? "Driver application approved"
              : "Driver application rejected",
          message:
            status === "approved"
              ? "Your driver application has been approved."
              : "Your driver application has been rejected.",
          eventKey: `driver-application:${reviewedApplication._id}:${status}`,
        },
      ]);

      return res.status(200).json({
        success: true,
        message: `Driver application ${status} successfully`,
        application: {
          id: reviewedApplication._id,
          status: reviewedApplication.status,
          rejectionReason: reviewedApplication.rejectionReason || null,
        },
      });
    } catch (error) {
      if (error.statusCode) return respondError(res, error.statusCode, error.message);
      logger.error("Review driver application error:", error.message);
      return respondError(res, 500, "Unable to review driver application");
    }
  },
});

const controller = createAdminController();

export const getPendingDriverApplications =
  controller.getPendingDriverApplications;
export const reviewDriverApplication = controller.reviewDriverApplication;
