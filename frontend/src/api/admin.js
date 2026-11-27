import { api } from "./client";

export const adminApi = {
  dashboard: () =>
    api.get("/admin/dashboard/stats").then(({ data }) => data),
  users: (params = {}) =>
    api.get("/admin/users", { params }).then(({ data }) => data),
  user: (userId) =>
    api.get(`/admin/users/${userId}`).then(({ data }) => data.user),
  setUserActive: (userId, body) =>
    api.patch(`/admin/users/${userId}/status`, body).then(({ data }) => data),
  setUserRole: (userId, body) =>
    api.patch(`/admin/users/${userId}/role`, body).then(({ data }) => data),
  organizations: (params = {}) =>
    api.get("/admin/organizations", { params }).then(({ data }) => data),
  createOrganization: (body) =>
    api.post("/admin/organizations", body).then(({ data }) => data),
  updateOrganization: (organizationId, body) =>
    api
      .patch(`/admin/organizations/${organizationId}`, body)
      .then(({ data }) => data),
  verifyOrganizationDomain: (organizationId, body) =>
    api
      .patch(
        `/admin/organizations/${organizationId}/domain-verification`,
        body
      )
      .then(({ data }) => data),
  rides: (params = {}) =>
    api.get("/admin/rides", { params }).then(({ data }) => data),
  bookings: (params = {}) =>
    api.get("/admin/bookings", { params }).then(({ data }) => data),
  ratings: (params = {}) =>
    api.get("/admin/ratings", { params }).then(({ data }) => data),
  reports: (params = {}) =>
    api.get("/admin/reports", { params }).then(({ data }) => data),
  reviewReport: (reportId, body) =>
    api.patch(`/admin/reports/${reportId}`, body).then(({ data }) => data),
  analytics: () =>
    api.get("/admin/analytics").then(({ data }) => data),
  auditLogs: (params = {}) =>
    api.get("/admin/audit-logs", { params }).then(({ data }) => data),
  driverApplications: (params = {}) =>
    api.get("/admin/driver-applications", { params }).then(({ data }) => data),
  identityVerifications: (params = {}) =>
    api
      .get("/admin/identity-verifications", { params })
      .then(({ data }) => data),
  pendingApplications: () =>
    api
      .get("/admin/driver-applications/pending")
      .then(({ data }) => data.applications),
  reviewApplication: (applicationId, status) =>
    api
      .patch(`/admin/driver-applications/${applicationId}/review`, status)
      .then(({ data }) => data),
  pendingVerifications: () =>
    api
      .get("/admin/identity-verifications/pending")
      .then(({ data }) => data.verifications),
  reviewVerification: (verificationId, body) =>
    api
      .patch(`/admin/identity-verifications/${verificationId}/review`, body)
      .then(({ data }) => data),
};
