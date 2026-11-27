
import express from "express";
import protect from "../middleware/auth.middleware.js";
import admin from "../middleware/admin.middleware.js";
import {
  getPendingDriverApplications,
  reviewDriverApplication,
} from "../controllers/admin.controller.js";
import {
  listPendingVerifications,
  reviewVerification,
} from "../controllers/identityVerification.controller.js";
import {
  createOrganization,
  getOrganization,
  getUser,
  getAnalytics,
  listAuditLogs,
  listBookings,
  listDashboardStats,
  listDriverApplications,
  listIdentityVerifications,
  listOrganizations,
  listRatings,
  listReports,
  listRides,
  listUsers,
  reviewReport,
  setUserActiveStatus,
  setUserRole,
  updateOrganization,
  verifyOrganizationDomain,
} from "../controllers/adminPanel.controller.js";
import requireSuperAdmin from "../middleware/superAdmin.middleware.js";

const router = express.Router();

router.get("/dashboard/stats", protect, admin, listDashboardStats);
router.get("/analytics", protect, admin, getAnalytics);

router.get("/users", protect, admin, listUsers);
router.get("/users/:userId", protect, admin, getUser);
router.patch("/users/:userId/status", protect, admin, setUserActiveStatus);
router.patch(
  "/users/:userId/role",
  protect,
  admin,
  requireSuperAdmin,
  setUserRole
);

router.get("/organizations", protect, admin, listOrganizations);
router.post(
  "/organizations",
  protect,
  admin,
  requireSuperAdmin,
  createOrganization
);
router.get("/organizations/:organizationId", protect, admin, getOrganization);
router.patch(
  "/organizations/:organizationId",
  protect,
  admin,
  requireSuperAdmin,
  updateOrganization
);
router.patch(
  "/organizations/:organizationId/domain-verification",
  protect,
  admin,
  requireSuperAdmin,
  verifyOrganizationDomain
);

router.get("/driver-applications", protect, admin, listDriverApplications);
router.get(
  "/identity-verifications",
  protect,
  admin,
  listIdentityVerifications
);
router.get("/rides", protect, admin, listRides);
router.get("/bookings", protect, admin, listBookings);
router.get("/reports", protect, admin, listReports);
router.patch("/reports/:reportId", protect, admin, reviewReport);
router.get("/ratings", protect, admin, listRatings);
router.get("/audit-logs", protect, admin, listAuditLogs);

router.get(
  "/driver-applications/pending",
  protect,
  admin,
  getPendingDriverApplications
);

router.patch(
  "/driver-applications/:applicationId/review",
  protect,
  admin,
  reviewDriverApplication
);

router.get(
  "/identity-verifications/pending",
  protect,
  admin,
  listPendingVerifications
);

router.patch(
  "/identity-verifications/:verificationId/review",
  protect,
  admin,
  reviewVerification
);

export default router;
