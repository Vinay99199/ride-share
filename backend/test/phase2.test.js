import assert from "node:assert/strict";
import { test } from "node:test";
import { createAdminPanelController } from "../src/controllers/adminPanel.controller.js";
import { createReportController } from "../src/controllers/report.controller.js";
import requireSuperAdmin from "../src/middleware/superAdmin.middleware.js";

const userId = "65a1234567890abcdef12345";
const passengerId = "65a1234567890abcdef12346";
const driverId = "65a1234567890abcdef12347";
const organizationId = "65a1234567890abcdef12348";
const outsideOrganizationId = "65a1234567890abcdef12349";
const bookingId = "65a1234567890abcdef12350";
const reportId = "65a1234567890abcdef12351";

const query = (value) => ({
  select() { return this; },
  populate() { return this; },
  sort() { return this; },
  skip() { return this; },
  limit() { return this; },
  lean() { return this; },
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject);
  },
});

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const auditedDependencies = (onCreate = () => {}) => ({
  mongoose: {
    isValidObjectId: () => true,
    startSession: async () => ({
      withTransaction: async (operation) => operation(),
      endSession: async () => {},
    }),
  },
  AuditLogModel: {
    create: async (documents, options) => {
      onCreate(documents, options);
      return documents;
    },
  },
});

const scopedOrganizationModel = () => ({
  find: (filter) => {
    assert.deepEqual(filter, { adminId: userId });
    return query([{ _id: organizationId }]);
  },
});

test("admin user search is constrained to the administrator's organization", async () => {
  let observedFilter;
  const controller = createAdminPanelController({
    OrganizationModel: scopedOrganizationModel(),
    UserModel: {
      find: (filter) => {
        observedFilter = filter;
        return query([]);
      },
      countDocuments: async () => 0,
    },
      logger: { error() {} },
  });
  const res = response();
  await controller.listUsers(
    {
      user: { _id: userId, role: "organizationAdmin" },
      query: { search: "person@example.com", isActive: "true" },
    },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.deepEqual(observedFilter.organization, { $in: [organizationId] });
  assert.ok(observedFilter.$and);
  assert.ok(observedFilter.$or);
});

test("organization admins cannot use a user filter to escape their organization", async () => {
  const controller = createAdminPanelController({
    OrganizationModel: scopedOrganizationModel(),
    UserModel: {
      find: () => assert.fail("out-of-scope user query must not run"),
      countDocuments: () => assert.fail("out-of-scope count must not run"),
    },
    mongoose: { isValidObjectId: () => true },
    logger: { error() {} },
  });
  const res = response();
  await controller.listUsers(
    {
      user: { _id: userId, role: "organizationAdmin" },
      query: { organizationId: outsideOrganizationId },
    },
    res
  );
  assert.equal(res.statusCode, 403);
});

test("dashboard statistics are calculated from the scoped data models", async () => {
  const controller = createAdminPanelController({
    UserModel: {
      countDocuments: async (filter) =>
        filter.verificationStatus === "verified" ? 2 : 8,
    },
    OrganizationModel: { countDocuments: async () => 3 },
    DriverApplicationModel: { countDocuments: async () => 5 },
    RideModel: { countDocuments: async () => 13 },
    BookingModel: { countDocuments: async () => 21 },
    RatingModel: {
      aggregate: async () => [{ count: 7, average: 4.25 }],
    },
    logger: { error() {} },
  });
  const res = response();
  await controller.listDashboardStats(
    { user: { _id: userId, role: "superAdmin" } },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.stats, {
    totalUsers: 8,
    verifiedUsers: 2,
    driverApplications: 5,
    identityVerifications: 8,
    organizations: 3,
    rides: 13,
    bookings: 21,
    ratings: 7,
    averageRating: 4.25,
  });
});

test("account status changes are audited in the same transaction", async () => {
  let auditEntries;
  let updateOptions;
  const target = {
    _id: passengerId,
    organization: organizationId,
    role: "user",
    isActive: true,
  };
  const controller = createAdminPanelController({
    ...auditedDependencies((entries, options) => {
      auditEntries = entries;
      assert.ok(options.session);
    }),
    OrganizationModel: scopedOrganizationModel(),
    UserModel: {
      findById: () => query(target),
      findOneAndUpdate: (_filter, _update, options) => {
        updateOptions = options;
        return query({ ...target, isActive: false });
      },
    },
    RideModel: {
      exists: async () => null,
      collection: { name: "rides" },
    },
    BookingModel: { aggregate: async () => [] },
    logger: { error() {} },
  });
  const res = response();
  await controller.setUserActiveStatus(
    {
      user: { _id: userId, role: "organizationAdmin" },
      params: { userId: passengerId },
      body: { isActive: false, reason: "Repeated safety complaints" },
    },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.ok(updateOptions.session);
  assert.equal(auditEntries[0].action, "user.deactivate");
  assert.equal(String(auditEntries[0].organization), organizationId);
  assert.equal(auditEntries[0].reason, "Repeated safety complaints");
});

test("account deactivation is blocked while the user has a scheduled driver ride", async () => {
  const controller = createAdminPanelController({
    ...auditedDependencies(),
    OrganizationModel: scopedOrganizationModel(),
    UserModel: {
      findById: () => query({
        _id: passengerId,
        organization: organizationId,
        role: "user",
        isActive: true,
      }),
      findOneAndUpdate: () => assert.fail("account must not be deactivated"),
    },
    RideModel: {
      exists: async () => ({ _id: bookingId }),
      collection: { name: "rides" },
    },
    BookingModel: { aggregate: async () => [] },
    logger: { error() {} },
  });
  const res = response();
  await controller.setUserActiveStatus(
    {
      user: { _id: userId, role: "organizationAdmin" },
      params: { userId: passengerId },
      body: { isActive: false, reason: "Account review requested" },
    },
    res
  );
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /scheduled rides/);
});

test("SuperAdmin role changes are validated, scoped to the target, and audited", async () => {
  let auditEntries;
  let roleUpdate;
  const target = {
    _id: passengerId,
    role: "passenger",
    organization: organizationId,
  };
  const controller = createAdminPanelController({
    ...auditedDependencies((entries) => { auditEntries = entries; }),
    UserModel: {
      findById: () => query(target),
      findOneAndUpdate: (filter, update, options) => {
        roleUpdate = { filter, update, options };
        return query({ ...target, role: update.$set.role });
      },
    },
    logger: { error() {} },
  });
  const res = response();
  await controller.setUserRole(
    {
      user: { _id: userId, role: "superAdmin" },
      params: { userId: passengerId },
      body: { role: "organizationAdmin", reason: "Assigning local organization oversight" },
    },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.deepEqual(roleUpdate.filter, { _id: passengerId, role: "passenger" });
  assert.equal(roleUpdate.update.$set.role, "organizationAdmin");
  assert.equal(auditEntries[0].action, "user.role.change");
  assert.equal(auditEntries[0].previousStatus, "passenger");
  assert.equal(auditEntries[0].newStatus, "organizationAdmin");

  const selfChange = response();
  await controller.setUserRole(
    {
      user: { _id: userId, role: "superAdmin" },
      params: { userId },
      body: { role: "passenger", reason: "Invalid self role change" },
    },
    selfChange
  );
  assert.equal(selfChange.statusCode, 403);
});

test("SuperAdmin can unassign an organization administrator", async () => {
  const organization = {
    _id: organizationId,
    name: "Example College",
    type: "college",
    allowedDomains: ["example.edu"],
    adminId: userId,
    isActive: true,
  };
  let update;
  const controller = createAdminPanelController({
    ...auditedDependencies(),
    mongoose: {
      isValidObjectId: () => true,
      startSession: async () => ({
        withTransaction: async (operation) => operation(),
        endSession: async () => {},
      }),
    },
    OrganizationModel: {
      findById: () => query(organization),
      findOneAndUpdate: (_filter, updateData, options) => {
        update = { updateData, options };
        return query({ ...organization, adminId: undefined });
      },
    },
    logger: { error() {} },
  });
  const res = response();
  await controller.updateOrganization(
    {
      user: { _id: userId, role: "superAdmin" },
      params: { organizationId },
      body: { adminId: null },
    },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.deepEqual(update.updateData.$unset, { adminId: 1 });
  assert.ok(update.options.session);
});

test("superadmin middleware denies organization administrators", () => {
  const res = response();
  let continued = false;
  requireSuperAdmin(
    { user: { role: "organizationAdmin" } },
    res,
    () => { continued = true; }
  );
  assert.equal(res.statusCode, 403);
  assert.equal(continued, false);
});

test("report submission is limited to ride participants", async () => {
  let created;
  const booking = { _id: bookingId, ride: reportId, passenger: passengerId };
  const controller = createReportController({
    isValidObjectId: () => true,
    BookingModel: { findById: () => query(booking) },
    RideModel: { findById: () => query({ driver: driverId }) },
    ReportModel: {
      create: async (data) => {
        created = data;
        return { _id: reportId, status: "pending", createdAt: new Date(), ...data };
      },
    },
    logger: { error() {} },
  });
  const denied = response();
  await controller(
    {
      user: { _id: userId },
      body: {
        bookingId,
        type: "safety",
        description: "Unsafe behavior during this ride.",
      },
    },
    denied
  );
  assert.equal(denied.statusCode, 403);
  assert.equal(created, undefined);

  const allowed = response();
  await controller(
    {
      user: { _id: passengerId },
      body: {
        bookingId,
        type: "safety",
        description: "Unsafe behavior during this ride.",
      },
    },
    allowed
  );
  assert.equal(allowed.statusCode, 201);
  assert.equal(String(created.user), passengerId);
  assert.equal(created.description, "Unsafe behavior during this ride.");
});
