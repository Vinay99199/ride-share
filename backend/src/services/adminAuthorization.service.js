import Organization from "../models/Organization.js";

export const getAdminOrganizationIds = async (
  user,
  OrganizationModel = Organization
) => {
  if (user?.role === "superAdmin") return null;

  const organizations = await OrganizationModel.find({
    adminId: user?._id,
  })
    .select("_id approvalStatus")
    .lean();

  return organizations
    .filter(
      (organization) =>
        !organization.approvalStatus ||
        organization.approvalStatus === "approved"
    )
    .map((organization) => organization._id);
};

export const canManageOrganization = async (
  user,
  organizationId,
  OrganizationModel = Organization
) => {
  if (user?.role === "superAdmin") return true;
  if (!organizationId) return false;

  return Boolean(
    await OrganizationModel.exists({
      _id: organizationId,
      adminId: user?._id,
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: { $exists: false } },
      ],
    })
  );
};
