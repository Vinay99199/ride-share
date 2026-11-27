import mongoose from "mongoose";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import {
  canManageOrganization,
  getAdminOrganizationIds,
} from "../services/adminAuthorization.service.js";
import { runAuditedAdminAction } from "../services/adminAudit.service.js";
import notificationService from "../services/notification.service.js";

const allowedSubmissionFields = new Set([
  "legalName",
  "documentType",
  "documentLast4",
]);
const allowedReviewFields = new Set(["status", "rejectionReason"]);
const documentTypes = new Set([
  "passport",
  "national_id",
  "driver_license",
]);

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

export const createIdentityVerificationController = ({
  mongoose: mongooseInstance = mongoose,
  UserModel = User,
  OrganizationModel = Organization,
  AuditLogModel = AdminAuditLog,
  notifications = notificationService,
  isValidObjectId = mongoose.isValidObjectId,
  logger = console,
} = {}) => ({
  getMyVerification: async (req, res) => {
    try {
      const user = await UserModel.findById(req.user._id)
        .select("+identityVerification")
        .lean();
      if (!user) return sendError(res, 404, "User not found");

      const verification = user.identityVerification || {};
      const hasSubmission = Boolean(verification.submittedAt);
      const status =
        hasSubmission || user.verificationStatus !== "pending"
          ? user.verificationStatus
          : "not_submitted";

      return res.status(200).json({
        success: true,
        verification: {
          status,
          legalName: verification.legalName || null,
          documentType: verification.documentType || null,
          documentLast4: verification.documentLast4 || null,
          rejectionReason: verification.rejectionReason || null,
          submittedAt: verification.submittedAt || null,
          reviewedAt: verification.reviewedAt || null,
        },
      });
    } catch (error) {
      logger.error("Fetch own identity verification error:", error.message);
      return sendError(res, 500, "Unable to fetch identity verification status");
    }
  },

  submitVerification: async (req, res) => {
    try {
      const body = req.body;
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).some((field) => !allowedSubmissionFields.has(field))
      ) {
        return sendError(
          res,
          400,
          "Only legalName, documentType, and documentLast4 are accepted"
        );
      }

      const legalName =
        typeof body.legalName === "string" ? body.legalName.trim() : "";
      const documentType = body.documentType;
      const documentLast4 =
        typeof body.documentLast4 === "string"
          ? body.documentLast4.trim()
          : "";

      if (legalName.length < 2 || legalName.length > 120) {
        return sendError(res, 400, "legalName must be between 2 and 120 characters");
      }
      if (!documentTypes.has(documentType)) {
        return sendError(
          res,
          400,
          "documentType must be passport, national_id, or driver_license"
        );
      }
      if (!/^[A-Za-z0-9]{4}$/.test(documentLast4)) {
        return sendError(res, 400, "documentLast4 must contain exactly 4 letters or digits");
      }

      const existingUser = await UserModel.findById(req.user._id)
        .select("+identityVerification")
        .lean();
      if (!existingUser) return sendError(res, 404, "User not found");
      if (existingUser.verificationStatus === "verified") {
        return sendError(res, 409, "Identity verification is already approved");
      }
      if (
        existingUser.verificationStatus === "pending" &&
        existingUser.identityVerification?.submittedAt
      ) {
        return sendError(res, 409, "Your identity verification is already pending");
      }

      const filter = {
        _id: req.user._id,
        verificationStatus: existingUser.verificationStatus,
      };
      if (existingUser.verificationStatus === "pending") {
        filter["identityVerification.submittedAt"] = { $exists: false };
      } else if (existingUser.verificationStatus === "rejected") {
        filter["identityVerification.submittedAt"] =
          existingUser.identityVerification?.submittedAt ?? { $exists: false };
      }

      const submittedAt = new Date();
      const updatedUser = await UserModel.findOneAndUpdate(
        filter,
        {
          $set: {
            verificationStatus: "pending",
            "identityVerification.legalName": legalName,
            "identityVerification.documentType": documentType,
            "identityVerification.documentLast4": documentLast4,
            "identityVerification.submittedAt": submittedAt,
            "identityVerification.rejectionReason": null,
            "identityVerification.reviewedAt": null,
            "identityVerification.reviewedBy": null,
          },
        },
        { new: true, runValidators: true }
      ).select("+identityVerification");

      if (!updatedUser) {
        return sendError(res, 409, "Verification status changed; refresh and try again");
      }

      return res.status(201).json({
        success: true,
        message: "Identity verification submitted for review",
        verification: {
          status: updatedUser.verificationStatus,
          legalName: updatedUser.identityVerification.legalName,
          documentType: updatedUser.identityVerification.documentType,
          documentLast4: updatedUser.identityVerification.documentLast4,
          submittedAt: updatedUser.identityVerification.submittedAt,
        },
      });
    } catch (error) {
      logger.error("Submit identity verification error:", error.message);
      return sendError(res, 500, "Unable to submit identity verification");
    }
  },

  listPendingVerifications: async (req, res) => {
    try {
      const organizationIds = await getAdminOrganizationIds(
        req.user,
        OrganizationModel
      );
      if (organizationIds && organizationIds.length === 0) {
        return sendError(
          res,
          403,
          "No organization is assigned to this administrator"
        );
      }

      const filter = {
        verificationStatus: "pending",
        "identityVerification.submittedAt": { $exists: true },
      };
      if (organizationIds) {
        filter.organization = { $in: organizationIds };
      }

      const users = await UserModel.find(filter)
        .select("name email organization verificationStatus +identityVerification")
        .sort({ "identityVerification.submittedAt": 1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: users.length,
        verifications: users.map((user) => ({
          id: user._id,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            organization: user.organization,
          },
          status: user.verificationStatus,
          legalName: user.identityVerification.legalName,
          documentType: user.identityVerification.documentType,
          documentLast4: user.identityVerification.documentLast4,
          submittedAt: user.identityVerification.submittedAt,
        })),
      });
    } catch (error) {
      logger.error("List pending identity verifications error:", error.message);
      return sendError(res, 500, "Unable to fetch identity verifications");
    }
  },

  reviewVerification: async (req, res) => {
    try {
      const { verificationId } = req.params;
      if (!isValidObjectId(verificationId)) {
        return sendError(res, 400, "Invalid verification ID");
      }

      const body = req.body;
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).some((field) => !allowedReviewFields.has(field))
      ) {
        return sendError(
          res,
          400,
          "Only status and rejectionReason are accepted"
        );
      }
      if (!["verified", "rejected"].includes(body.status)) {
        return sendError(res, 400, "Status must be verified or rejected");
      }

      const rejectionReason =
        typeof body.rejectionReason === "string"
          ? body.rejectionReason.trim()
          : "";
      if (
        body.status === "rejected" &&
        (rejectionReason.length < 5 || rejectionReason.length > 500)
      ) {
        return sendError(
          res,
          400,
          "A rejectionReason between 5 and 500 characters is required"
        );
      }
      if (body.status === "verified" && body.rejectionReason !== undefined) {
        return sendError(res, 400, "Do not include rejectionReason when approving");
      }

      const applicant = await UserModel.findById(verificationId)
        .select("organization verificationStatus +identityVerification")
        .lean();
      if (
        !applicant ||
        !applicant.identityVerification?.submittedAt ||
        applicant.verificationStatus !== "pending"
      ) {
        return sendError(res, 404, "Pending identity verification not found");
      }
      if (String(applicant._id) === String(req.user._id)) {
        return sendError(res, 403, "Administrators cannot review their own verification");
      }

      const canManage = await canManageOrganization(
        req.user,
        applicant.organization,
        OrganizationModel
      );
      if (!canManage) {
        return sendError(res, 403, "This user is outside your organization");
      }

      const reviewedAt = new Date();
      const updatedUser = await runAuditedAdminAction({
        mongoose: mongooseInstance,
        AuditLogModel,
        admin: req.user,
        organization: applicant.organization,
        action: "identityVerification.review",
        entityType: "identityVerification",
        entityId: verificationId,
        previousStatus: applicant.verificationStatus,
        newStatus: body.status,
        reason: body.status === "rejected" ? rejectionReason : "",
        operation: (session) =>
          UserModel.findOneAndUpdate(
            {
              _id: verificationId,
              organization: applicant.organization,
              verificationStatus: "pending",
              "identityVerification.submittedAt":
                applicant.identityVerification.submittedAt,
            },
            {
              $set: {
                verificationStatus: body.status,
                "identityVerification.rejectionReason":
                  body.status === "rejected" ? rejectionReason : null,
                "identityVerification.reviewedAt": reviewedAt,
                "identityVerification.reviewedBy": req.user._id,
              },
            },
            { new: true, runValidators: true, session }
          ).select("verificationStatus"),
      });

      await notifications.notifyAfterCommit([
        {
          recipient: updatedUser._id,
          type: `identity_verification_${body.status}`,
          title:
            body.status === "verified"
              ? "Identity verification approved"
              : "Identity verification rejected",
          message:
            body.status === "verified"
              ? "Your identity verification has been approved."
              : "Your identity verification was rejected. Review the reason in your profile.",
          eventKey: `identity-verification:${updatedUser._id}:${applicant.identityVerification.submittedAt.toISOString()}:${body.status}`,
        },
      ]);

      return res.status(200).json({
        success: true,
        message: `Identity verification ${body.status}`,
        verification: {
          id: updatedUser._id,
          status: updatedUser.verificationStatus,
          reviewedAt,
        },
      });
    } catch (error) {
      if (error.statusCode) return sendError(res, error.statusCode, error.message);
      logger.error("Review identity verification error:", error.message);
      return sendError(res, 500, "Unable to review identity verification");
    }
  },
});

const controller = createIdentityVerificationController();

export const getMyVerification = controller.getMyVerification;
export const submitVerification = controller.submitVerification;
export const listPendingVerifications = controller.listPendingVerifications;
export const reviewVerification = controller.reviewVerification;
