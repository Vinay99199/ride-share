import mongoose from "mongoose";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import { getOrganizationDomainVerificationStatus } from "../utils/organizationDomain.js";

const organizationTypes = new Set([
  "company",
  "college",
  "university",
  "institute",
  "school",
  "institution",
  "other",
]);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const safeOrganization = (organization, memberCount) => ({
  _id: organization._id,
  name: organization.name,
  shortName: organization.shortName || null,
  type: organization.type,
  city: organization.city || null,
  state: organization.state || null,
  country: organization.country || null,
  domainVerificationStatus:
    getOrganizationDomainVerificationStatus(organization),
  isActive: organization.isActive !== false,
  approvalStatus: organization.approvalStatus || "approved",
  approvalReason: organization.approvalReason || null,
  memberCount,
});

export const createOrganizationController = ({
  OrganizationModel = Organization,
  UserModel = User,
  mongooseInstance = mongoose,
  logger = console,
} = {}) => {
  const memberCountsFor = async (organizations) => {
    if (!organizations.length) return new Map();
    const counts = await UserModel.aggregate([
      {
        $match: {
          organization: { $in: organizations.map((organization) => organization._id) },
        },
      },
      { $group: { _id: "$organization", count: { $sum: 1 } } },
    ]);
    return new Map(counts.map((item) => [String(item._id), item.count]));
  };

  const listOrganizations = async (req, res) => {
    const allowed = new Set(["page", "limit", "q", "type"]);
    if (Object.keys(req.query ?? {}).some((key) => !allowed.has(key))) {
      return res.status(400).json({
        success: false,
        message: "Unexpected organization filter",
      });
    }

    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      query.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid page, limit, or organization search",
      });
    }
    if (req.query.type !== undefined && !organizationTypes.has(req.query.type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization type",
      });
    }

    const filter = {
      isActive: { $ne: false },
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: { $exists: false } },
      ],
    };
    if (req.query.type) filter.type = req.query.type;
    if (query) {
      filter.$and = [
        {
          $or: [
            { name: { $regex: escapeRegExp(query), $options: "i" } },
            { shortName: { $regex: escapeRegExp(query), $options: "i" } },
            { city: { $regex: escapeRegExp(query), $options: "i" } },
          ],
        },
      ];
    }

    try {
      const [organizations, total] = await Promise.all([
        OrganizationModel.find(filter)
          .select(
            "name shortName type city state country isActive approvalStatus domainVerificationStatus verifiedDomains allowedDomains"
          )
          .sort({ name: 1, _id: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        OrganizationModel.countDocuments(filter),
      ]);
      const memberCounts = await memberCountsFor(organizations);
      return res.status(200).json({
        success: true,
        count: organizations.length,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        organizations: organizations.map((organization) =>
          safeOrganization(
            organization,
            memberCounts.get(String(organization._id)) ?? 0
          )
        ),
      });
    } catch (error) {
      logger.error("List organizations error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch organizations",
      });
    }
  };

  const getOrganization = async (req, res) => {
    const { organizationId } = req.params;
    if (!mongooseInstance.isValidObjectId(organizationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID",
      });
    }
    try {
      const organization = await OrganizationModel.findById(organizationId)
        .select(
          "name shortName type city state country isActive approvalStatus domainVerificationStatus verifiedDomains allowedDomains"
        )
        .lean();
      if (
        !organization ||
        organization.isActive === false ||
        (organization.approvalStatus &&
          organization.approvalStatus !== "approved")
      ) {
        return res.status(404).json({
          success: false,
          message: "Organization not found",
        });
      }
      const memberCounts = await memberCountsFor([organization]);
      return res.status(200).json({
        success: true,
        organization: safeOrganization(
          organization,
          memberCounts.get(String(organization._id)) ?? 0
        ),
      });
    } catch (error) {
      logger.error("Get organization error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch organization",
      });
    }
  };

  const getMyOrganization = async (req, res) => {
    try {
      let organizations;
      if (req.user.role === "organizationAdmin") {
        organizations = await OrganizationModel.find({ adminId: req.user._id })
          .select(
            "name shortName type city state country allowedDomains verifiedDomains domainVerificationStatus domainVerifiedAt domainVerificationReason isActive approvalStatus approvalReason address website officialEmail contactPerson contactPhone"
          )
          .lean();
      } else if (
        req.user.organization &&
        mongooseInstance.isValidObjectId(req.user.organization)
      ) {
        const organization = await OrganizationModel.findById(
          req.user.organization
        )
          .select(
            "name shortName type city state country allowedDomains verifiedDomains domainVerificationStatus domainVerifiedAt domainVerificationReason isActive approvalStatus approvalReason address website officialEmail contactPerson contactPhone"
          )
          .lean();
        organizations = organization ? [organization] : [];
      } else {
        organizations = [];
      }

      if (!organizations.length) {
        return res.status(200).json({
          success: true,
          organization: null,
          organizations: [],
        });
      }

      const memberCounts = await memberCountsFor(organizations);
      const result = organizations.map((organization) => ({
        ...safeOrganization(
          organization,
          memberCounts.get(String(organization._id)) ?? 0
        ),
        allowedDomains: organization.allowedDomains ?? [],
        verifiedDomains: organization.verifiedDomains ?? [],
        domainVerifiedAt: organization.domainVerifiedAt || null,
        domainVerificationReason:
          organization.domainVerificationReason || null,
        address: organization.address || null,
        website: organization.website || null,
        officialEmail: organization.officialEmail || null,
        contactPerson: organization.contactPerson || null,
        contactPhone: organization.contactPhone || null,
        registrationNumber: organization.registrationNumber || null,
      }));
      return res.status(200).json({
        success: true,
        organization: result.length === 1 ? result[0] : null,
        organizations: result,
      });
    } catch (error) {
      logger.error("Get user's organization error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch your organization",
      });
    }
  };

  return { listOrganizations, getOrganization, getMyOrganization };
};

const controller = createOrganizationController();

export const listOrganizations = controller.listOrganizations;
export const getOrganization = controller.getOrganization;
export const getMyOrganization = controller.getMyOrganization;
