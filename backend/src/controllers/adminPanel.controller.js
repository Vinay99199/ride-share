import mongoose from "mongoose";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import DriverApplication from "../models/DriverApplication.js";
import Ride from "../models/Ride.js";
import Booking from "../models/Booking.js";
import Rating from "../models/Rating.js";
import Report from "../models/Report.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import { getAdminOrganizationIds } from "../services/adminAuthorization.service.js";
import { runAuditedAdminAction } from "../services/adminAudit.service.js";
import {
  getOrganizationDomainVerificationStatus,
  isPersonalEmailDomain,
  normalizeEmailDomain,
} from "../utils/organizationDomain.js";

const userFields =
  "name email phone role organization isEmailVerified verificationStatus rating ratingCount isActive createdAt updatedAt";
const allowedRoles = new Set([
  "user",
  "passenger",
  "driver",
  "organization",
  "organizationAdmin",
  "superAdmin",
]);
const applicationStatuses = new Set(["pending", "approved", "rejected"]);
const identityStatuses = new Set(["pending", "verified", "rejected"]);
const rideStatuses = new Set(["scheduled", "completed", "cancelled"]);
const bookingStatuses = new Set([
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
]);
const reportStatuses = new Set(["pending", "reviewed", "resolved", "rejected"]);
const organizationTypes = new Set([
  "company",
  "college",
  "university",
  "institute",
  "school",
  "institution",
  "other",
]);
const organizationApprovalStatuses = new Set(["pending", "approved", "rejected"]);
const allowedOrganizationFields = new Set([
  "name",
  "shortName",
  "type",
  "city",
  "state",
  "country",
  "address",
  "adminId",
  "isActive",
  "approvalStatus",
  "approvalReason",
  "reason",
]);
const organizationDomainPattern =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const respondError = (res, status, message) =>
  res.status(status).json({ success: false, message });

const parsePagination = (query) => {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return null;
  }
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDateRange = (query) => {
  const range = {};
  for (const [key, operator] of [["from", "$gte"], ["to", "$lte"]]) {
    if (query[key] === undefined) continue;
    const date = new Date(query[key]);
    if (Number.isNaN(date.getTime())) return null;
    range[operator] = date;
  }
  if (
    range.$gte &&
    range.$lte &&
    range.$gte.getTime() > range.$lte.getTime()
  ) {
    return null;
  }
  return range;
};

const safeOrganization = (organization) => ({
  _id: organization._id,
  name: organization.name,
  shortName: organization.shortName || null,
  type: organization.type,
  city: organization.city || null,
  state: organization.state || null,
  country: organization.country || null,
  allowedDomains: organization.allowedDomains || [],
  verifiedDomains: organization.verifiedDomains || [],
  domainVerificationStatus:
    getOrganizationDomainVerificationStatus(organization),
  domainVerifiedAt: organization.domainVerifiedAt || null,
  domainVerificationReason: organization.domainVerificationReason || null,
  adminId: organization.adminId || null,
  isActive: organization.isActive !== false,
  approvalStatus: organization.approvalStatus || "approved",
  approvalReason: organization.approvalReason || null,
  address: organization.address || null,
  website: organization.website || null,
  officialEmail: organization.officialEmail || null,
  contactPerson: organization.contactPerson || null,
  contactPhone: organization.contactPhone || null,
  registrationNumber: organization.registrationNumber || null,
  createdAt: organization.createdAt,
  updatedAt: organization.updatedAt,
});

export const createAdminPanelController = ({
  mongoose: mongooseInstance = mongoose,
  UserModel = User,
  OrganizationModel = Organization,
  DriverApplicationModel = DriverApplication,
  RideModel = Ride,
  BookingModel = Booking,
  RatingModel = Rating,
  ReportModel = Report,
  AuditLogModel = AdminAuditLog,
  logger = console,
} = {}) => {
  const getScope = async (req, res) => {
    const organizationIds = await getAdminOrganizationIds(
      req.user,
      OrganizationModel
    );
    if (organizationIds && organizationIds.length === 0) {
      respondError(
        res,
        403,
        "No organization is assigned to this administrator"
      );
      return null;
    }
    return organizationIds;
  };

  const getScopedUserIds = async (organizationIds) => {
    if (!organizationIds) return null;
    const users = await UserModel.find({
      organization: { $in: organizationIds },
    })
      .select("_id")
      .lean();
    return users.map((user) => user._id);
  };

  const userIsInScope = async (user, organizationIds) => {
    if (!organizationIds) return true;
    return Boolean(
      user?.organization &&
        organizationIds.some(
          (organizationId) =>
            String(organizationId) === String(user.organization)
        )
    );
  };

  const listDashboardStats = async (req, res) => {
    try {
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      const scopedUserIds = await getScopedUserIds(organizationIds);
      const userFilter = organizationIds
        ? { organization: { $in: organizationIds } }
        : {};
      const userIdFilter = scopedUserIds
        ? { user: { $in: scopedUserIds } }
        : {};
      const rideFilter = scopedUserIds
        ? { driver: { $in: scopedUserIds } }
        : {};
      const submittedVerificationFilter = {
        ...userFilter,
        "identityVerification.submittedAt": { $exists: true },
      };

      const [
        totalUsers,
        verifiedUsers,
        driverApplications,
        identityVerifications,
        organizations,
        rides,
        bookingCount,
        ratingSummary,
      ] = await Promise.all([
        UserModel.countDocuments(userFilter),
        UserModel.countDocuments({
          ...userFilter,
          verificationStatus: "verified",
        }),
        DriverApplicationModel.countDocuments(userIdFilter),
        UserModel.countDocuments(submittedVerificationFilter),
        organizationIds
          ? organizationIds.length
          : OrganizationModel.countDocuments({}),
        RideModel.countDocuments(rideFilter),
        scopedUserIds
          ? BookingModel.aggregate([
              {
                $lookup: {
                  from: "rides",
                  localField: "ride",
                  foreignField: "_id",
                  as: "rideRecord",
                },
              },
              { $unwind: "$rideRecord" },
              {
                $match: {
                  "rideRecord.driver": { $in: scopedUserIds },
                },
              },
              { $count: "count" },
            ]).then((result) => result[0]?.count || 0)
          : BookingModel.countDocuments({}),
        RatingModel.aggregate([
          ...(scopedUserIds
            ? [{ $match: { reviewee: { $in: scopedUserIds } } }]
            : []),
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              average: { $avg: "$rating" },
            },
          },
        ]),
      ]);

      return res.status(200).json({
        success: true,
        scope: req.user.role === "superAdmin" ? "platform" : "organization",
        stats: {
          totalUsers,
          verifiedUsers,
          driverApplications,
          identityVerifications,
          organizations,
          rides,
          bookings: bookingCount,
          ratings: ratingSummary[0]?.count || 0,
          averageRating: ratingSummary[0]?.average
            ? Number(ratingSummary[0].average.toFixed(2))
            : 0,
        },
      });
    } catch (error) {
      logger.error("Admin dashboard statistics error:", error.message);
      return respondError(res, 500, "Unable to fetch dashboard statistics");
    }
  };

  const listUsers = async (req, res) => {
    try {
      const pagination = parsePagination(req.query);
      if (!pagination) return respondError(res, 400, "Invalid pagination values");
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;

      const filter = {};
      if (organizationIds) filter.organization = { $in: organizationIds };
      if (req.query.organizationId !== undefined) {
        if (!mongooseInstance.isValidObjectId(req.query.organizationId)) {
          return respondError(res, 400, "Invalid organizationId");
        }
        if (
          organizationIds &&
          !organizationIds.some(
            (id) => String(id) === String(req.query.organizationId)
          )
        ) {
          return respondError(res, 403, "Organization is outside your scope");
        }
        filter.organization = req.query.organizationId;
      }

      if (req.query.role !== undefined) {
        if (!allowedRoles.has(req.query.role)) {
          return respondError(res, 400, "Invalid user role filter");
        }
        filter.role = req.query.role;
      }
      if (req.query.verificationStatus !== undefined) {
        if (!identityStatuses.has(req.query.verificationStatus)) {
          return respondError(res, 400, "Invalid verification status filter");
        }
        filter.verificationStatus = req.query.verificationStatus;
      }
      if (req.query.isActive !== undefined) {
        if (!["true", "false"].includes(req.query.isActive)) {
          return respondError(res, 400, "isActive must be true or false");
        }
        if (req.query.isActive === "true") {
          filter.$and = [{ $or: [{ isActive: true }, { isActive: { $exists: false } }] }];
        } else {
          filter.isActive = false;
        }
      }
      if (req.query.search !== undefined) {
        if (typeof req.query.search !== "string" || req.query.search.length > 100) {
          return respondError(res, 400, "search must be at most 100 characters");
        }
        const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
        filter.$or = [{ name: search }, { email: search }, { phone: search }];
      }

      const [users, total] = await Promise.all([
        UserModel.find(filter)
          .select(userFields)
          .populate("organization", "name type isActive")
          .sort({ createdAt: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        UserModel.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        users,
      });
    } catch (error) {
      logger.error("Admin list users error:", error.message);
      return respondError(res, 500, "Unable to fetch users");
    }
  };

  const getUser = async (req, res) => {
    try {
      if (!mongooseInstance.isValidObjectId(req.params.userId)) {
        return respondError(res, 400, "Invalid user ID");
      }
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;

      const user = await UserModel.findById(req.params.userId)
        .select(userFields)
        .populate("organization", "name type isActive")
        .lean();
      if (!user) return respondError(res, 404, "User not found");
      const organizationId = user.organization?._id || user.organization;
      if (
        organizationIds &&
        !organizationIds.some((id) => String(id) === String(organizationId))
      ) {
        return respondError(res, 403, "User is outside your organization scope");
      }
      return res.status(200).json({ success: true, user });
    } catch (error) {
      logger.error("Admin get user error:", error.message);
      return respondError(res, 500, "Unable to fetch user");
    }
  };

  const setUserActiveStatus = async (req, res) => {
    try {
      const { userId: targetId } = req.params;
      if (!mongooseInstance.isValidObjectId(targetId)) {
        return respondError(res, 400, "Invalid user ID");
      }
      const body = req.body;
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).some((key) => !["isActive", "reason"].includes(key))
      ) {
        return respondError(res, 400, "Only isActive and reason are accepted");
      }
      if (typeof body.isActive !== "boolean") {
        return respondError(res, 400, "isActive must be a boolean");
      }
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      if (reason.length < 5 || reason.length > 500) {
        return respondError(res, 400, "reason must be between 5 and 500 characters");
      }
      if (String(req.user._id) === String(targetId)) {
        return respondError(res, 403, "You cannot change your own account status");
      }

      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      const target = await UserModel.findById(targetId)
        .select("organization role isActive")
        .lean();
      if (!target) return respondError(res, 404, "User not found");
      if (!(await userIsInScope(target, organizationIds))) {
        return respondError(res, 403, "User is outside your organization scope");
      }
      if (
        req.user.role === "organizationAdmin" &&
        !["user", "passenger", "driver"].includes(target.role)
      ) {
        return respondError(
          res,
          403,
          "Organization administrators can only manage public member accounts"
        );
      }
      if (target.isActive === body.isActive) {
        return respondError(res, 409, "Account already has that active status");
      }
      const activeFilter =
        target.isActive === undefined
          ? { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
          : { isActive: target.isActive };
      if (!body.isActive) {
        const [scheduledRide, activeBooking] = await Promise.all([
          RideModel.exists({
            driver: targetId,
            status: "scheduled",
          }),
          BookingModel.aggregate([
            {
              $match: {
                passenger: new mongoose.Types.ObjectId(targetId),
                status: { $in: ["pending", "confirmed"] },
                $or: [
                  { isActive: true },
                  { isActive: { $exists: false } },
                ],
              },
            },
            {
              $lookup: {
                from: RideModel.collection.name,
                localField: "ride",
                foreignField: "_id",
                as: "ride",
              },
            },
            { $unwind: "$ride" },
            { $match: { "ride.status": "scheduled" } },
            { $limit: 1 },
          ]),
        ]);
        if (scheduledRide || activeBooking.length) {
          return respondError(
            res,
            409,
            "Resolve scheduled rides and active booking requests before deactivating this account"
          );
        }
      }

      const updated = await runAuditedAdminAction({
        mongoose: mongooseInstance,
        AuditLogModel,
        admin: req.user,
        organization: target.organization,
        action: body.isActive ? "user.activate" : "user.deactivate",
        entityType: "user",
        entityId: targetId,
        previousStatus: target.isActive === false ? "inactive" : "active",
        newStatus: body.isActive ? "active" : "inactive",
        reason,
        fieldsChanged: ["isActive"],
        operation: (session) =>
          UserModel.findOneAndUpdate(
            {
              _id: targetId,
              organization: target.organization,
              ...activeFilter,
            },
            { $set: { isActive: body.isActive } },
            { new: true, runValidators: true, session }
          )
            .select(userFields)
            .populate("organization", "name type isActive")
            .lean(),
      });

      return res.status(200).json({
        success: true,
        message: `User account ${body.isActive ? "activated" : "deactivated"}`,
        user: updated,
      });
    } catch (error) {
      if (error.statusCode) return respondError(res, error.statusCode, error.message);
      logger.error("Admin update user status error:", error.message);
      return respondError(res, 500, "Unable to update user status");
    }
  };

  const setUserRole = async (req, res) => {
    try {
      if (req.user?.role !== "superAdmin") {
        return respondError(res, 403, "SuperAdmin permission required");
      }
      const { userId: targetId } = req.params;
      if (!mongooseInstance.isValidObjectId(targetId)) {
        return respondError(res, 400, "Invalid user ID");
      }
      const body = req.body;
      const assignableRoles = new Set([
        "passenger",
        "driver",
        "organizationAdmin",
        "superAdmin",
      ]);
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).some((key) => !["role", "reason"].includes(key)) ||
        !assignableRoles.has(body.role)
      ) {
        return respondError(res, 400, "A valid role is required");
      }
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      if (reason.length < 5 || reason.length > 500) {
        return respondError(res, 400, "reason must be between 5 and 500 characters");
      }
      if (String(req.user._id) === String(targetId)) {
        return respondError(res, 403, "You cannot change your own role");
      }
      const target = await UserModel.findById(targetId)
        .select("role organization")
        .lean();
      if (!target) return respondError(res, 404, "User not found");
      if (target.role === "organization" && body.role === "organizationAdmin") {
        return respondError(
          res,
          400,
          "Organization accounts cannot be converted into administrator accounts"
        );
      }
      if (target.role === body.role) {
        return respondError(res, 409, "Account already has that role");
      }
      if (body.role === "driver") {
        const application = await DriverApplicationModel.findOne({
          user: targetId,
        }).select("_id");
        if (!application) {
          return respondError(
            res,
            409,
            "A driver application is required before assigning the driver role"
          );
        }
      }

      const updated = await runAuditedAdminAction({
        mongoose: mongooseInstance,
        AuditLogModel,
        admin: req.user,
        organization: target.organization,
        action: "user.role.change",
        entityType: "user",
        entityId: targetId,
        previousStatus: target.role,
        newStatus: body.role,
        reason,
        fieldsChanged: ["role"],
        operation: (session) =>
          UserModel.findOneAndUpdate(
            { _id: targetId, role: target.role },
            { $set: { role: body.role } },
            { new: true, runValidators: true, session }
          )
            .select(userFields)
            .populate("organization", "name type isActive")
            .lean(),
      });
      return res.status(200).json({
        success: true,
        message: "Account role updated through the audited administrator workflow",
        user: updated,
      });
    } catch (error) {
      if (error.statusCode) return respondError(res, error.statusCode, error.message);
      logger.error("Admin update user role error:", error.message);
      return respondError(res, 500, "Unable to update user role");
    }
  };

  const listOrganizations = async (req, res) => {
    try {
      const pagination = parsePagination(req.query);
      if (!pagination) return respondError(res, 400, "Invalid pagination values");
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;

      const filter = organizationIds ? { _id: { $in: organizationIds } } : {};
      if (req.query.isActive !== undefined) {
        if (!["true", "false"].includes(req.query.isActive)) {
          return respondError(res, 400, "isActive must be true or false");
        }
        if (req.query.isActive === "true") {
          filter.$and = [{ $or: [{ isActive: true }, { isActive: { $exists: false } }] }];
        } else {
          filter.isActive = false;
        }
      }
      if (req.query.search !== undefined) {
        if (typeof req.query.search !== "string" || req.query.search.length > 100) {
          return respondError(res, 400, "search must be at most 100 characters");
        }
        const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
        filter.$or = [
          { name: search },
          { shortName: search },
          { city: search },
          { allowedDomains: search },
        ];
      }

      const [organizations, total] = await Promise.all([
        OrganizationModel.find(filter)
          .select(
            "name shortName type city state country allowedDomains verifiedDomains domainVerificationStatus domainVerifiedAt domainVerifiedBy domainVerificationReason adminId isActive approvalStatus approvalReason address website officialEmail contactPerson contactPhone registrationNumber createdAt updatedAt"
          )
          .sort({ name: 1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        OrganizationModel.countDocuments(filter),
      ]);
      return res.status(200).json({
        success: true,
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        organizations: organizations.map(safeOrganization),
      });
    } catch (error) {
      logger.error("Admin list organizations error:", error.message);
      return respondError(res, 500, "Unable to fetch organizations");
    }
  };

  const getOrganization = async (req, res) => {
    try {
      if (!mongooseInstance.isValidObjectId(req.params.organizationId)) {
        return respondError(res, 400, "Invalid organization ID");
      }
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      if (
        organizationIds &&
        !organizationIds.some((id) => String(id) === req.params.organizationId)
      ) {
        return respondError(res, 403, "Organization is outside your scope");
      }
      const organization = await OrganizationModel.findById(
        req.params.organizationId
      )
        .select(
          "name shortName type city state country allowedDomains verifiedDomains domainVerificationStatus domainVerifiedAt domainVerifiedBy domainVerificationReason adminId isActive approvalStatus approvalReason address website officialEmail contactPerson contactPhone registrationNumber createdAt updatedAt"
        )
        .lean();
      if (!organization) return respondError(res, 404, "Organization not found");
      return res.status(200).json({
        success: true,
        organization: safeOrganization(organization),
      });
    } catch (error) {
      logger.error("Admin get organization error:", error.message);
      return respondError(res, 500, "Unable to fetch organization");
    }
  };

  const validateOrganizationBody = async (body, { partial = false } = {}) => {
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length === 0 ||
      Object.keys(body).some((field) => !allowedOrganizationFields.has(field))
    ) {
      return { error: "Organization fields are missing or unexpected" };
    }
    const value = {};
    if (Object.hasOwn(body, "reason")) {
      if (
        typeof body.reason !== "string" ||
        body.reason.trim().length < 5 ||
        body.reason.trim().length > 500
      ) {
        return { error: "reason must be between 5 and 500 characters" };
      }
      value.reason = body.reason.trim();
    }
    if (!partial || Object.hasOwn(body, "name")) {
      if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 120) {
        return { error: "name must be between 2 and 120 characters" };
      }
      value.name = body.name.trim();
    }
    if (!partial || Object.hasOwn(body, "type")) {
      if (!organizationTypes.has(body.type)) {
        return {
          error:
            "type must be company, college, university, institute, school, institution, or other",
        };
      }
      value.type = body.type;
    }
    for (const [field, maxLength] of [
      ["shortName", 40],
      ["city", 100],
      ["state", 100],
      ["country", 100],
      ["address", 500],
    ]) {
      if (Object.hasOwn(body, field)) {
        if (
          typeof body[field] !== "string" ||
          body[field].trim().length > maxLength
        ) {
          return {
            error: `${field} must be a string of at most ${maxLength} characters`,
          };
        }
        value[field] = body[field].trim();
      }
    }
    if (Object.hasOwn(body, "isActive")) {
      if (typeof body.isActive !== "boolean") {
        return { error: "isActive must be a boolean" };
      }
      value.isActive = body.isActive;
    }
    if (Object.hasOwn(body, "approvalStatus")) {
      if (!organizationApprovalStatuses.has(body.approvalStatus)) {
        return { error: "approvalStatus must be pending, approved, or rejected" };
      }
      value.approvalStatus = body.approvalStatus;
    }
    if (Object.hasOwn(body, "approvalReason")) {
      if (
        typeof body.approvalReason !== "string" ||
        body.approvalReason.trim().length > 500
      ) {
        return { error: "approvalReason must be at most 500 characters" };
      }
      value.approvalReason = body.approvalReason.trim();
    }
    if (
      Object.hasOwn(body, "approvalStatus") &&
      body.approvalStatus === "rejected" &&
      (!value.approvalReason || value.approvalReason.length < 5)
    ) {
      return { error: "A 5-500 character approvalReason is required to reject" };
    }
    if (Object.hasOwn(body, "adminId")) {
      if (body.adminId !== null && !mongooseInstance.isValidObjectId(body.adminId)) {
        return { error: "adminId must be a valid user ID or null" };
      }
      value.adminIdInput = body.adminId;
    }
    return { value };
  };

  const validateOrganizationAdmin = async (adminId) => {
    if (!adminId) return { valid: true };
    const organizationAdmin = await UserModel.findById(adminId)
      .select("role isActive")
      .lean();
    if (
      !organizationAdmin ||
      organizationAdmin.role !== "organizationAdmin" ||
      organizationAdmin.isActive === false
    ) {
      return {
        valid: false,
        message: "adminId must belong to an active organizationAdmin",
      };
    }
    return { valid: true };
  };

  const createOrganization = async (req, res) => {
    try {
      if (req.user.role !== "superAdmin") {
        return respondError(res, 403, "SuperAdmin permission required");
      }
      const { error, value } = await validateOrganizationBody(req.body);
      if (error) return respondError(res, 400, error);
      const adminId = req.body.adminId || null;
      const adminValidation = await validateOrganizationAdmin(adminId);
      if (!adminValidation.valid) {
        return respondError(res, 400, adminValidation.message);
      }
      const organizationId = new mongooseInstance.Types.ObjectId();
      const created = await runAuditedAdminAction({
        mongoose: mongooseInstance,
        AuditLogModel,
        admin: req.user,
        organization: organizationId,
        action: "organization.create",
        entityType: "organization",
        entityId: organizationId,
        previousStatus: null,
        newStatus: value.isActive === false ? "inactive" : "active",
        reason: value.reason,
        fieldsChanged: Object.keys(value).filter(
          (field) => field !== "reason" && field !== "adminIdInput"
        ),
        operation: async (session) => {
          const [organization] = await OrganizationModel.create(
            [
              {
                _id: organizationId,
                allowedDomains: [],
                verifiedDomains: [],
                domainVerificationStatus: "pending",
                ...Object.fromEntries(
                  Object.entries(value).filter(
                    ([field]) =>
                      field !== "adminIdInput" && field !== "reason"
                  )
                ),
                ...(adminId ? { adminId } : {}),
              },
            ],
            { session }
          );
          return organization;
        },
      });
      return res.status(201).json({
        success: true,
        message: "Organization created",
        organization: safeOrganization(created),
      });
    } catch (error) {
      if (error.statusCode) return respondError(res, error.statusCode, error.message);
      logger.error("SuperAdmin create organization error:", error.message);
      return respondError(res, 500, "Unable to create organization");
    }
  };

  const updateOrganization = async (req, res) => {
    try {
      if (req.user.role !== "superAdmin") {
        return respondError(res, 403, "SuperAdmin permission required");
      }
      if (!mongooseInstance.isValidObjectId(req.params.organizationId)) {
        return respondError(res, 400, "Invalid organization ID");
      }
      const { error, value } = await validateOrganizationBody(req.body, {
        partial: true,
      });
      if (error) return respondError(res, 400, error);
      if (!Object.keys(value).some((field) => field !== "reason")) {
        return respondError(res, 400, "Provide at least one organization field to update");
      }
      const organization = await OrganizationModel.findById(
        req.params.organizationId
      ).lean();
      if (!organization) return respondError(res, 404, "Organization not found");
      const nextAdminId = Object.hasOwn(req.body, "adminId")
        ? req.body.adminId
        : organization.adminId;
      const adminValidation = await validateOrganizationAdmin(nextAdminId);
      if (!adminValidation.valid) {
        return respondError(res, 400, adminValidation.message);
      }
      const updates = { ...value };
      const requestedAdminId = updates.adminIdInput;
      const reason = updates.reason;
      delete updates.adminIdInput;
      delete updates.reason;
      const fieldsChanged = Object.keys(updates);
      if (Object.hasOwn(req.body, "adminId")) fieldsChanged.push("adminId");

      const updated = await runAuditedAdminAction({
        mongoose: mongooseInstance,
        AuditLogModel,
        admin: req.user,
        organization: organization._id,
        action: "organization.update",
        entityType: "organization",
        entityId: organization._id,
        previousStatus: organization.isActive === false ? "inactive" : "active",
        newStatus:
          (updates.isActive ?? organization.isActive) === false
            ? "inactive"
            : "active",
        reason,
        fieldsChanged,
        operation: async (session) => {
          const update = { $set: { ...updates } };
          if (Object.hasOwn(req.body, "adminId")) {
            if (requestedAdminId === null) update.$unset = { adminId: 1 };
            else update.$set.adminId = requestedAdminId;
          }
          return OrganizationModel.findOneAndUpdate(
            {
              _id: organization._id,
              ...(organization.isActive === undefined
                ? { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
                : { isActive: organization.isActive }),
            },
            update,
            { new: true, runValidators: true, session }
          ).lean();
        },
      });
      return res.status(200).json({
        success: true,
        message: "Organization updated",
        organization: safeOrganization(updated),
      });
    } catch (error) {
      if (error.statusCode) return respondError(res, error.statusCode, error.message);
      logger.error("SuperAdmin update organization error:", error.message);
      return respondError(res, 500, "Unable to update organization");
    }
  };

  const verifyOrganizationDomain = async (req, res) => {
    try {
      if (req.user.role !== "superAdmin") {
        return respondError(res, 403, "SuperAdmin permission required");
      }
      if (!mongooseInstance.isValidObjectId(req.params.organizationId)) {
        return respondError(res, 400, "Invalid organization ID");
      }

      const body = req.body;
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).some((field) => !["domain", "reason"].includes(field))
      ) {
        return respondError(res, 400, "Provide only domain and verification reason");
      }
      const domain = normalizeEmailDomain(body.domain);
      if (!organizationDomainPattern.test(domain)) {
        return respondError(res, 400, "A valid institutional email domain is required");
      }
      if (isPersonalEmailDomain(domain)) {
        return respondError(
          res,
          400,
          "Personal email providers cannot be approved as institutional domains"
        );
      }
      if (
        typeof body.reason !== "string" ||
        body.reason.trim().length < 10 ||
        body.reason.trim().length > 500
      ) {
        return respondError(
          res,
          400,
          "Verification reason must describe the official evidence reviewed (10-500 characters)"
        );
      }

      const organization = await OrganizationModel.findById(
        req.params.organizationId
      ).lean();
      if (!organization) return respondError(res, 404, "Organization not found");

      const escapedDomain = escapeRegex(domain);
      const conflictingOrganization = await OrganizationModel.findOne({
        _id: { $ne: organization._id },
        $or: [
          { allowedDomains: { $regex: `^${escapedDomain}$`, $options: "i" } },
          { verifiedDomains: { $regex: `^${escapedDomain}$`, $options: "i" } },
        ],
      })
        .select("_id name")
        .lean();
      if (conflictingOrganization) {
        return respondError(
          res,
          409,
          "This domain is already associated with another organization and requires manual resolution"
        );
      }

      const alreadyVerified = (organization.verifiedDomains || []).some(
        (item) => normalizeEmailDomain(item) === domain
      );
      if (alreadyVerified) {
        return respondError(res, 409, "This domain is already verified");
      }

      const verifiedAt = new Date();
      const updated = await runAuditedAdminAction({
        mongoose: mongooseInstance,
        AuditLogModel,
        admin: req.user,
        organization: organization._id,
        action: "organization.domain.verify",
        entityType: "organization",
        entityId: organization._id,
        previousStatus:
          getOrganizationDomainVerificationStatus(organization),
        newStatus: "verified",
        reason: body.reason.trim(),
        fieldsChanged: [
          "allowedDomains",
          "verifiedDomains",
          "domainVerificationStatus",
          "domainVerifiedAt",
          "domainVerifiedBy",
        ],
        operation: (session) =>
          OrganizationModel.findOneAndUpdate(
            { _id: organization._id },
            {
              $addToSet: {
                allowedDomains: domain,
                verifiedDomains: domain,
              },
              $set: {
                domainVerificationStatus: "verified",
                domainVerifiedAt: verifiedAt,
                domainVerifiedBy: req.user._id,
                domainVerificationReason: body.reason.trim(),
              },
            },
            { new: true, runValidators: true, session }
          ).lean(),
      });

      return res.status(200).json({
        success: true,
        message: "Institutional email domain verified and approved",
        organization: safeOrganization(updated),
      });
    } catch (error) {
      if (error.statusCode) return respondError(res, error.statusCode, error.message);
      logger.error("SuperAdmin verify organization domain error:", error.message);
      return respondError(res, 500, "Unable to verify organization domain");
    }
  };

  const listDriverApplications = async (req, res) => {
    try {
      const pagination = parsePagination(req.query);
      if (!pagination) return respondError(res, 400, "Invalid pagination values");
      const status = req.query.status || "pending";
      if (!applicationStatuses.has(status)) {
        return respondError(res, 400, "Invalid driver application status");
      }
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      const scopedUserIds = await getScopedUserIds(organizationIds);
      const filter = { status };
      if (scopedUserIds) filter.user = { $in: scopedUserIds };
      const [applications, total] = await Promise.all([
        DriverApplicationModel.find(filter)
          .populate("user", "name email phone organization")
          .sort({ createdAt: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        DriverApplicationModel.countDocuments(filter),
      ]);
      return res.status(200).json({
        success: true,
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        applications,
      });
    } catch (error) {
      logger.error("Admin list driver applications error:", error.message);
      return respondError(res, 500, "Unable to fetch driver applications");
    }
  };

  const listIdentityVerifications = async (req, res) => {
    try {
      const pagination = parsePagination(req.query);
      if (!pagination) return respondError(res, 400, "Invalid pagination values");
      const status = req.query.status || "pending";
      if (!identityStatuses.has(status)) {
        return respondError(res, 400, "Invalid identity status");
      }
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      const filter = {
        verificationStatus: status,
        "identityVerification.submittedAt": { $exists: true },
      };
      if (organizationIds) filter.organization = { $in: organizationIds };
      const [users, total] = await Promise.all([
        UserModel.find(filter)
          .select("name email organization verificationStatus +identityVerification")
          .populate("organization", "name")
          .sort({ "identityVerification.submittedAt": -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        UserModel.countDocuments(filter),
      ]);
      return res.status(200).json({
        success: true,
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        verifications: users.map((user) => ({
          id: user._id,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            organization: user.organization,
          },
          status: user.verificationStatus,
          legalName: user.identityVerification?.legalName || null,
          documentType: user.identityVerification?.documentType || null,
          documentLast4: user.identityVerification?.documentLast4 || null,
          rejectionReason:
            user.identityVerification?.rejectionReason || null,
          submittedAt: user.identityVerification?.submittedAt || null,
          reviewedAt: user.identityVerification?.reviewedAt || null,
        })),
      });
    } catch (error) {
      logger.error("Admin list identity verifications error:", error.message);
      return respondError(res, 500, "Unable to fetch identity verifications");
    }
  };

  const listRides = async (req, res) => {
    try {
      const pagination = parsePagination(req.query);
      if (!pagination) return respondError(res, 400, "Invalid pagination values");
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      const scopedUserIds = await getScopedUserIds(organizationIds);
      const filter = {};
      if (scopedUserIds) filter.driver = { $in: scopedUserIds };
      if (req.query.status !== undefined) {
        if (!rideStatuses.has(req.query.status)) {
          return respondError(res, 400, "Invalid ride status");
        }
        filter.status = req.query.status;
      }
      const dateRange = parseDateRange(req.query);
      if (!dateRange) return respondError(res, 400, "Invalid date range");
      if (Object.keys(dateRange).length) filter.departureTime = dateRange;
      const [rides, total] = await Promise.all([
        RideModel.find(filter)
          .populate({
            path: "driver",
            select: "name email organization isActive",
            populate: { path: "organization", select: "name" },
          })
          .sort({ departureTime: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        RideModel.countDocuments(filter),
      ]);
      return res.status(200).json({
        success: true,
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        rides,
      });
    } catch (error) {
      logger.error("Admin list rides error:", error.message);
      return respondError(res, 500, "Unable to fetch rides");
    }
  };

  const listBookings = async (req, res) => {
    try {
      const pagination = parsePagination(req.query);
      if (!pagination) return respondError(res, 400, "Invalid pagination values");
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      const scopedUserIds = await getScopedUserIds(organizationIds);
      const rideFilter = scopedUserIds
        ? { driver: { $in: scopedUserIds } }
        : {};
      const rides = await RideModel.find(rideFilter).select("_id").lean();
      const rideIds = rides.map((ride) => ride._id);
      const filter = { ride: { $in: rideIds } };
      if (scopedUserIds) filter.passenger = { $in: scopedUserIds };
      if (req.query.status !== undefined) {
        if (!bookingStatuses.has(req.query.status)) {
          return respondError(res, 400, "Invalid booking status");
        }
        filter.status = req.query.status;
      }
      const [bookings, total] = await Promise.all([
        BookingModel.find(filter)
          .select("+isActive")
          .populate({
            path: "passenger",
            select: "name email organization isActive",
            populate: { path: "organization", select: "name" },
          })
          .populate({
            path: "ride",
            select:
              "driver pickupLocation dropLocation pickupLocationName pickupAddress dropLocationName dropAddress departureTime totalSeats availableSeats pricePerSeat vehicleType status",
            populate: {
              path: "driver",
              select: "name email organization",
              populate: { path: "organization", select: "name" },
            },
          })
          .sort({ createdAt: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        BookingModel.countDocuments(filter),
      ]);
      return res.status(200).json({
        success: true,
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        bookings,
      });
    } catch (error) {
      logger.error("Admin list bookings error:", error.message);
      return respondError(res, 500, "Unable to fetch bookings");
    }
  };

  const listRatings = async (req, res) => {
    try {
      const pagination = parsePagination(req.query);
      if (!pagination) return respondError(res, 400, "Invalid pagination values");
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      const scopedUserIds = await getScopedUserIds(organizationIds);
      const filter = scopedUserIds
        ? { reviewee: { $in: scopedUserIds } }
        : {};
      if (
        req.query.rating !== undefined &&
        !["1", "2", "3", "4", "5"].includes(req.query.rating)
      ) {
        return respondError(res, 400, "rating must be an integer from 1 to 5");
      }
      if (req.query.rating !== undefined) filter.rating = Number(req.query.rating);
      const [ratings, total, summary] = await Promise.all([
        RatingModel.find(filter)
          .populate("reviewer", "name")
          .populate("reviewee", "name organization")
          .populate("ride", "departureTime status")
          .sort({ createdAt: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        RatingModel.countDocuments(filter),
        RatingModel.aggregate([
          ...(scopedUserIds ? [{ $match: { reviewee: { $in: scopedUserIds } } }] : []),
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              average: { $avg: "$rating" },
            },
          },
        ]),
      ]);
      return res.status(200).json({
        success: true,
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        ratings,
        summary: {
          count: summary[0]?.count || 0,
          average: summary[0]?.average
            ? Number(summary[0].average.toFixed(2))
            : 0,
        },
      });
    } catch (error) {
      logger.error("Admin list ratings error:", error.message);
      return respondError(res, 500, "Unable to fetch platform ratings");
    }
  };

  const listReports = async (req, res) => {
    try {
      const pagination = parsePagination(req.query);
      if (!pagination) return respondError(res, 400, "Invalid pagination values");
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      const scopedUserIds = await getScopedUserIds(organizationIds);
      const rideFilter = scopedUserIds
        ? { driver: { $in: scopedUserIds } }
        : {};
      const rideRecords = await RideModel.find(rideFilter).select("_id").lean();
      const rideIds = rideRecords.map((ride) => ride._id);
      const bookingFilter = { ride: { $in: rideIds } };
      if (scopedUserIds) bookingFilter.passenger = { $in: scopedUserIds };
      const bookingRecords = await BookingModel.find(bookingFilter)
        .select("_id")
        .lean();
      const filter = { booking: { $in: bookingRecords.map(({ _id }) => _id) } };
      if (req.query.status !== undefined) {
        if (!reportStatuses.has(req.query.status)) {
          return respondError(res, 400, "Invalid report status");
        }
        filter.status = req.query.status;
      }
      const [reports, total] = await Promise.all([
        ReportModel.find(filter)
          .populate("user", "name organization")
          .populate({
            path: "booking",
            select: "seatsBooked totalPrice status passenger ride createdAt",
            populate: [
              { path: "passenger", select: "name organization" },
              {
                path: "ride",
                select: "driver pickupLocation dropLocation pickupLocationName pickupAddress dropLocationName dropAddress departureTime status",
                populate: { path: "driver", select: "name organization" },
              },
            ],
          })
          .sort({ createdAt: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        ReportModel.countDocuments(filter),
      ]);
      return res.status(200).json({
        success: true,
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        reports,
      });
    } catch (error) {
      logger.error("Admin list reports error:", error.message);
      return respondError(res, 500, "Unable to fetch reports");
    }
  };

  const reviewReport = async (req, res) => {
    try {
      const { reportId } = req.params;
      if (!mongooseInstance.isValidObjectId(reportId)) {
        return respondError(res, 400, "Invalid report ID");
      }
      const body = req.body;
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).some(
          (field) => !["status", "reason"].includes(field)
        )
      ) {
        return respondError(res, 400, "Only status and reason are accepted");
      }
      if (!reportStatuses.has(body.status) || body.status === "pending") {
        return respondError(
          res,
          400,
          "status must be reviewed, resolved, or rejected"
        );
      }
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      if (reason.length < 5 || reason.length > 500) {
        return respondError(res, 400, "reason must be between 5 and 500 characters");
      }
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      const scopedUserIds = await getScopedUserIds(organizationIds);
      const rideFilter = scopedUserIds
        ? { driver: { $in: scopedUserIds } }
        : {};
      const rides = await RideModel.find(rideFilter).select("_id").lean();
      const bookingFilter = { ride: { $in: rides.map((ride) => ride._id) } };
      if (scopedUserIds) bookingFilter.passenger = { $in: scopedUserIds };
      const bookings = await BookingModel.find(bookingFilter).select("_id").lean();
      const reportFilter = {
        _id: reportId,
        booking: { $in: bookings.map((booking) => booking._id) },
      };
      const report = await ReportModel.findOne(reportFilter).lean();
      if (!report) return respondError(res, 404, "Report not found in your scope");
      const reporter = await UserModel.findById(report.user)
        .select("organization")
        .lean();
      if (!reporter) return respondError(res, 404, "Report owner not found");
      const updated = await runAuditedAdminAction({
        mongoose: mongooseInstance,
        AuditLogModel,
        admin: req.user,
        organization: reporter.organization,
        action: "report.review",
        entityType: "report",
        entityId: report._id,
        previousStatus: report.status,
        newStatus: body.status,
        reason,
        operation: (session) =>
          ReportModel.findOneAndUpdate(
            { _id: report._id, status: report.status },
            {
              $set: {
                status: body.status,
                reviewReason: reason,
                reviewedBy: req.user._id,
                reviewedAt: new Date(),
              },
            },
            { new: true, runValidators: true, session }
          ),
      });
      return res.status(200).json({
        success: true,
        message: "Report reviewed",
        report: updated,
      });
    } catch (error) {
      if (error.statusCode) return respondError(res, error.statusCode, error.message);
      logger.error("Admin review report error:", error.message);
      return respondError(res, 500, "Unable to review report");
    }
  };

  const getAnalytics = async (req, res) => {
    try {
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      const scopedUserIds = await getScopedUserIds(organizationIds);
      const start = new Date();
      start.setUTCDate(1);
      start.setUTCMonth(start.getUTCMonth() - 11);
      const userFilter = { createdAt: { $gte: start } };
      const rideFilter = { createdAt: { $gte: start } };
      if (organizationIds) userFilter.organization = { $in: organizationIds };
      if (scopedUserIds) {
        rideFilter.driver = { $in: scopedUserIds };
      }

      const [registrations, rides, bookings, organizationUsers] =
        await Promise.all([
          UserModel.aggregate([
            { $match: userFilter },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
          ]),
          RideModel.aggregate([
            { $match: rideFilter },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  status: "$status",
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
          ]),
          BookingModel.aggregate([
            { $match: { createdAt: { $gte: start } } },
            {
              $lookup: {
                from: "rides",
                localField: "ride",
                foreignField: "_id",
                as: "rideRecord",
              },
            },
            { $unwind: "$rideRecord" },
            ...(scopedUserIds
              ? [{ $match: { "rideRecord.driver": { $in: scopedUserIds } } }]
              : []),
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  status: "$status",
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
          ]),
          OrganizationModel.aggregate([
            ...(organizationIds
              ? [{ $match: { _id: { $in: organizationIds } } }]
              : []),
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "organization",
                as: "members",
              },
            },
            {
              $lookup: {
                from: "rides",
                let: { organizationUsers: "$members._id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $in: ["$driver", "$$organizationUsers"] },
                    },
                  },
                ],
                as: "organizationRides",
              },
            },
            {
              $lookup: {
                from: "bookings",
                let: { organizationRideIds: "$organizationRides._id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $in: ["$ride", "$$organizationRideIds"] },
                    },
                  },
                ],
                as: "organizationBookings",
              },
            },
            {
              $project: {
                name: 1,
                isActive: 1,
                users: { $size: "$members" },
                rides: { $size: "$organizationRides" },
                bookings: { $size: "$organizationBookings" },
              },
            },
            { $sort: { name: 1 } },
          ]),
        ]);

      return res.status(200).json({
        success: true,
        period: { from: start, to: new Date() },
        registrationTrends: registrations,
        rideTrends: rides,
        bookingTrends: bookings,
        organizationActivity: organizationUsers,
      });
    } catch (error) {
      logger.error("Admin analytics error:", error.message);
      return respondError(res, 500, "Unable to fetch platform analytics");
    }
  };

  const listAuditLogs = async (req, res) => {
    try {
      const pagination = parsePagination(req.query);
      if (!pagination) return respondError(res, 400, "Invalid pagination values");
      const organizationIds = await getScope(req, res);
      if (organizationIds === null && req.user.role !== "superAdmin") return;
      const filter = organizationIds
        ? { organization: { $in: organizationIds } }
        : {};
      if (req.query.entityType !== undefined) {
        const entityTypes = new Set([
          "user",
          "organization",
          "driverApplication",
          "identityVerification",
          "report",
        ]);
        if (!entityTypes.has(req.query.entityType)) {
          return respondError(res, 400, "Invalid entityType");
        }
        filter.entityType = req.query.entityType;
      }
      const [logs, total] = await Promise.all([
        AuditLogModel.find(filter)
          .populate("admin", "name email role")
          .populate("organization", "name")
          .sort({ createdAt: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        AuditLogModel.countDocuments(filter),
      ]);
      return res.status(200).json({
        success: true,
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        auditLogs: logs,
      });
    } catch (error) {
      logger.error("Admin audit log list error:", error.message);
      return respondError(res, 500, "Unable to fetch audit logs");
    }
  };

  return {
    listDashboardStats,
    listUsers,
    getUser,
    setUserActiveStatus,
    setUserRole,
    listOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    verifyOrganizationDomain,
    listDriverApplications,
    listIdentityVerifications,
    listRides,
    listBookings,
    listRatings,
    listReports,
    reviewReport,
    getAnalytics,
    listAuditLogs,
  };
};

const controller = createAdminPanelController();

export const listDashboardStats = controller.listDashboardStats;
export const listUsers = controller.listUsers;
export const getUser = controller.getUser;
export const setUserActiveStatus = controller.setUserActiveStatus;
export const setUserRole = controller.setUserRole;
export const listOrganizations = controller.listOrganizations;
export const getOrganization = controller.getOrganization;
export const createOrganization = controller.createOrganization;
export const updateOrganization = controller.updateOrganization;
export const verifyOrganizationDomain = controller.verifyOrganizationDomain;
export const listDriverApplications = controller.listDriverApplications;
export const listIdentityVerifications = controller.listIdentityVerifications;
export const listRides = controller.listRides;
export const listBookings = controller.listBookings;
export const listRatings = controller.listRatings;
export const listReports = controller.listReports;
export const reviewReport = controller.reviewReport;
export const getAnalytics = controller.getAnalytics;
export const listAuditLogs = controller.listAuditLogs;
