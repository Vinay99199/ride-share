import assert from "node:assert/strict";
import { test } from "node:test";
import { createAdminController } from "../src/controllers/admin.controller.js";
import {
  createDriverApplicationController,
} from "../src/controllers/driverApplication.controller.js";
import {
  createIdentityVerificationController,
} from "../src/controllers/identityVerification.controller.js";
import admin from "../src/middleware/admin.middleware.js";
import {
  createRequireApprovedDriver,
} from "../src/middleware/driver.middleware.js";
import requireDriverAccount from "../src/middleware/driverAccount.middleware.js";
import {
  canManageOrganization,
  getAdminOrganizationIds,
} from "../src/services/adminAuthorization.service.js";

const userId = "65a1234567890abcdef12345";
const secondUserId = "65a1234567890abcdef67890";
const organizationId = "65a1234567890abcdef11111";
const otherOrganizationId = "65a1234567890abcdef22222";
const applicationId = "65a1234567890abcdef33333";
const submittedAt = new Date("2026-01-01T10:00:00.000Z");
const noNotifications = { notifyAfterCommit: async () => {} };

const query = (value) => ({
  select() { return this; },
  sort() { return this; },
  populate() { return this; },
  lean() { return this; },
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject);
  },
});

const auditDependencies = () => ({
  mongoose: {
    startSession: async () => ({
      withTransaction: async (operation) => operation(),
      endSession: async () => {},
    }),
  },
  AuditLogModel: { create: async () => [] },
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

const organizationModel = (ownedIds = []) => ({
  find: (filter) => {
    assert.ok(filter.adminId);
    return {
      select() { return this; },
      lean: async () => ownedIds.map((_id) => ({ _id })),
    };
  },
  exists: async (filter) =>
    String(filter.adminId) === userId &&
    ownedIds.some((id) => String(id) === String(filter._id)),
});

test("admin middleware accepts only organization and super administrators", () => {
  const denied = response();
  admin({ user: { role: "user" } }, denied, () => assert.fail("must deny"));
  assert.equal(denied.statusCode, 403);

  for (const role of ["organizationAdmin", "superAdmin"]) {
    const res = response();
    let continued = false;
    admin({ user: { role } }, res, () => { continued = true; });
    assert.equal(continued, true);
  }
});

test("driver API middleware requires an approved application without adding a user role", async () => {
  for (const [application, expectedStatus] of [[null, 403], [{ status: "approved" }, 200]]) {
    const guard = createRequireApprovedDriver({
      DriverApplicationModel: {
        findOne: (filter) => {
          assert.equal(String(filter.user), userId);
          assert.equal(filter.status, "approved");
          return Promise.resolve(application);
        },
      },
      logger: { error() {} },
    });
    const res = response();
    let continued = false;
    await guard(
      { user: { _id: userId, role: "user" } },
      res,
      () => { continued = true; }
    );
    assert.equal(res.statusCode, expectedStatus);
    assert.equal(continued, expectedStatus === 200);
  }

  const guard = createRequireApprovedDriver({
    DriverApplicationModel: {
      findOne: () => assert.fail("administrator driver lookup must not run"),
    },
    logger: { error() {} },
  });
  const res = response();
  await guard(
    { user: { _id: userId, role: "organizationAdmin" } },
    res,
    () => assert.fail("administrators must not use driver features")
  );
  assert.equal(res.statusCode, 403);
});

test("driver application endpoints reject public passenger and organization accounts", () => {
  for (const role of ["passenger", "organization", "organizationAdmin"]) {
    const res = response();
    requireDriverAccount({ user: { role } }, res, () =>
      assert.fail(`${role} must not access driver application endpoints`)
    );
    assert.equal(res.statusCode, 403);
  }
  let continued = false;
  requireDriverAccount({ user: { role: "driver" } }, response(), () => {
    continued = true;
  });
  assert.equal(continued, true);
});

test("driver application status is scoped to the logged-in user and masks license numbers", async () => {
  for (const status of ["pending", "approved", "rejected"]) {
    const record = {
      _id: applicationId,
      user: userId,
      licenseNumber: "LICENSE-ABC1234",
      vehicleNumber: "CAR-123",
      vehicleType: "car",
      status,
      rejectionReason: status === "rejected" ? "Please resubmit." : null,
      createdAt: submittedAt,
      updatedAt: submittedAt,
    };
    const controller = createDriverApplicationController({
      DriverApplicationModel: {
        findOne: (filter) => {
          assert.deepEqual(filter, { user: userId });
          return query(record);
        },
      },
      logger: { error() {} },
    });
    const res = response();
    await controller.getMyDriverApplication({ user: { _id: userId } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.application.status, status);
    assert.equal(res.body.application.licenseNumber, "****1234");
    assert.equal(res.body.application.userId, userId);
    assert.equal(Object.hasOwn(res.body.application, "password"), false);
  }

  const controller = createDriverApplicationController({
    DriverApplicationModel: { findOne: () => query(null) },
    logger: { error() {} },
  });
  const res = response();
  await controller.getMyDriverApplication({ user: { _id: userId } }, res);
  assert.equal(res.body.application, null);
});

test("driver applications can be resubmitted only after rejection", async () => {
  for (const [status, expectedStatus, expectedCreates] of [
    [null, 201, 1],
    ["pending", 409, 0],
    ["approved", 409, 0],
    ["rejected", 201, 1],
  ]) {
    let creates = 0;
    const controller = createDriverApplicationController({
      DriverApplicationModel: {
        findOne: () =>
          query(status ? { status } : null),
        create: async (application) => {
          creates += 1;
          return {
            _id: applicationId,
            ...application,
            createdAt: submittedAt,
          };
        },
      },
      logger: { error() {} },
    });
    const res = response();
    await controller.applyForDriver(
      {
        user: { _id: userId, role: "driver" },
        body: {
          licenseNumber: "LICENSE-1234",
          vehicleNumber: "CAR-123",
          vehicleType: "car",
        },
      },
      res
    );
    assert.equal(res.statusCode, expectedStatus);
    assert.equal(creates, expectedCreates);
  }
});

test("legacy passenger accounts without an existing application cannot apply as drivers", async () => {
  let creates = 0;
  const controller = createDriverApplicationController({
    DriverApplicationModel: {
      findOne: () => query(null),
      create: async () => {
        creates += 1;
      },
    },
    logger: { error() {} },
  });
  const res = response();
  await controller.applyForDriver(
    {
      user: { _id: userId, role: "user" },
      body: {
        licenseNumber: "LICENSE-1234",
        vehicleNumber: "CAR-123",
        vehicleType: "car",
      },
    },
    res
  );
  assert.equal(res.statusCode, 403);
  assert.equal(creates, 0);
});

test("identity submission accepts minimal metadata and never accepts a client status", async () => {
  const user = {
    _id: userId,
    verificationStatus: "pending",
    organization: organizationId,
  };
  const updates = [];
  const controller = createIdentityVerificationController({
    notifications: noNotifications,
    UserModel: {
      findById: () => query(user),
      findOneAndUpdate: (filter, update) => {
        updates.push({ filter, update });
        user.verificationStatus = update.$set.verificationStatus;
        user.identityVerification = {
          legalName: update.$set["identityVerification.legalName"],
          documentType: update.$set["identityVerification.documentType"],
          documentLast4: update.$set["identityVerification.documentLast4"],
          submittedAt: update.$set["identityVerification.submittedAt"],
        };
        return query(user);
      },
      find() { return query([]); },
    },
    OrganizationModel: organizationModel([organizationId]),
    logger: { error() {} },
  });

  const unsafe = response();
  await controller.submitVerification(
    {
      user: { _id: userId },
      body: {
        legalName: "Example Person",
        documentType: "passport",
        documentLast4: "1234",
        verificationStatus: "verified",
      },
    },
    unsafe
  );
  assert.equal(unsafe.statusCode, 400);
  assert.equal(updates.length, 0);

  const invalid = response();
  await controller.submitVerification(
    {
      user: { _id: userId },
      body: {
        legalName: "Example Person",
        documentType: "passport",
        documentLast4: "full-document-number",
      },
    },
    invalid
  );
  assert.equal(invalid.statusCode, 400);

  const res = response();
  await controller.submitVerification(
    {
      user: { _id: userId },
      body: {
        legalName: "Example Person",
        documentType: "passport",
        documentLast4: "A123",
      },
    },
    res
  );
  assert.equal(res.statusCode, 201);
  assert.equal(user.verificationStatus, "pending");
  assert.equal(updates[0].filter._id, userId);
  assert.equal(res.body.verification.documentLast4, "A123");
});

test("identity reads distinguish not submitted and prevent own or cross-organization review", async () => {
  const applicant = {
    _id: secondUserId,
    organization: otherOrganizationId,
    verificationStatus: "pending",
    identityVerification: {
      legalName: "Example Person",
      documentType: "national_id",
      documentLast4: "1234",
      submittedAt,
    },
  };
  let updateCount = 0;
  const UserModel = {
    findById: () => query(applicant),
    findOneAndUpdate: () => {
      updateCount += 1;
      return query({ ...applicant, verificationStatus: "verified" });
    },
    find: () => query([]),
  };
  const orgModel = organizationModel([organizationId]);
  const controller = createIdentityVerificationController({
    ...auditDependencies(),
    notifications: noNotifications,
    UserModel,
    OrganizationModel: orgModel,
    logger: { error() {} },
  });

  const ownStatus = createIdentityVerificationController({
    notifications: noNotifications,
    UserModel: {
      findById: () => query({ _id: userId, verificationStatus: "pending" }),
    },
    logger: { error() {} },
  });
  const statusResponse = response();
  await ownStatus.getMyVerification({ user: { _id: userId } }, statusResponse);
  assert.equal(statusResponse.body.verification.status, "not_submitted");
  assert.equal(statusResponse.body.verification.documentLast4, null);

  const outsideOrg = response();
  await controller.reviewVerification(
    {
      user: { _id: userId, role: "organizationAdmin" },
      params: { verificationId: secondUserId },
      body: { status: "verified" },
    },
    outsideOrg
  );
  assert.equal(outsideOrg.statusCode, 403);
  assert.equal(updateCount, 0);

  const ownReview = response();
  await controller.reviewVerification(
    {
      user: { _id: secondUserId, role: "superAdmin" },
      params: { verificationId: secondUserId },
      body: { status: "verified" },
    },
    ownReview
  );
  assert.equal(ownReview.statusCode, 403);
  assert.equal(updateCount, 0);
});

test("superadmin review works platform-wide while organization admins remain scoped", async () => {
  assert.deepEqual(
    await getAdminOrganizationIds(
      { _id: userId, role: "organizationAdmin" },
      organizationModel([organizationId])
    ),
    [organizationId]
  );
  assert.equal(
    await getAdminOrganizationIds({ _id: userId, role: "superAdmin" }),
    null
  );
  assert.equal(
    await canManageOrganization(
      { _id: userId, role: "organizationAdmin" },
      otherOrganizationId,
      organizationModel([organizationId])
    ),
    false
  );

  const applicant = {
    _id: secondUserId,
    organization: otherOrganizationId,
    verificationStatus: "pending",
    identityVerification: { submittedAt },
  };
  const controller = createIdentityVerificationController({
    ...auditDependencies(),
    notifications: noNotifications,
    UserModel: {
      findById: () => query(applicant),
      findOneAndUpdate: (_filter, update) =>
        query({
          _id: secondUserId,
          verificationStatus: update.$set.verificationStatus,
        }),
    },
    OrganizationModel: {
      exists: async () => {
        assert.fail("SuperAdmin should not require an organization link");
      },
    },
    logger: { error() {} },
  });
  const res = response();
  await controller.reviewVerification(
    {
      user: { _id: userId, role: "superAdmin" },
      params: { verificationId: secondUserId },
      body: { status: "verified" },
    },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.verification.status, "verified");
});

test("identity rejection records a reason without changing driver application status", async () => {
  const applicant = {
    _id: secondUserId,
    organization: otherOrganizationId,
    verificationStatus: "pending",
    identityVerification: { submittedAt },
  };
  const driverApplication = { status: "approved" };
  let update;
  const controller = createIdentityVerificationController({
    ...auditDependencies(),
    notifications: noNotifications,
    UserModel: {
      findById: () => query(applicant),
      findOneAndUpdate: (_filter, updateData) => {
        update = updateData.$set;
        applicant.verificationStatus = update.verificationStatus;
        return query({
          _id: secondUserId,
          verificationStatus: update.verificationStatus,
        });
      },
    },
    logger: { error() {} },
  });
  const res = response();
  await controller.reviewVerification(
    {
      user: { _id: userId, role: "superAdmin" },
      params: { verificationId: secondUserId },
      body: {
        status: "rejected",
        rejectionReason: "Please submit clearer details.",
      },
    },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(update["identityVerification.rejectionReason"], "Please submit clearer details.");
  assert.equal(update.verificationStatus, "rejected");
  assert.equal(driverApplication.status, "approved");
});

test("organization admins cannot review driver applications outside their organization", async () => {
  const application = { _id: applicationId, user: secondUserId, status: "pending" };
  let changed = false;
  const controller = createAdminController({
    ...auditDependencies(),
    DriverApplicationModel: {
      findById: async () => application,
      findOneAndUpdate: async () => {
        changed = true;
        return { ...application, status: "approved" };
      },
      find: () => query([]),
    },
    UserModel: {
      findById: () => ({
        select() { return this; },
        lean: async () => ({ organization: otherOrganizationId }),
      }),
      find: () => query([]),
    },
    OrganizationModel: organizationModel([organizationId]),
    notificationService: { notifyAfterCommit: async () => {} },
    logger: { error() {} },
  });
  const res = response();
  await controller.reviewDriverApplication(
    {
      user: { _id: userId, role: "organizationAdmin" },
      params: { applicationId },
      body: { status: "approved" },
    },
    res
  );
  assert.equal(res.statusCode, 403);
  assert.equal(changed, false);
});

test("approved driver application review does not modify identity verification", async () => {
  const applicant = {
    organization: otherOrganizationId,
    verificationStatus: "rejected",
  };
  let applicationUpdate;
  const controller = createAdminController({
    ...auditDependencies(),
    DriverApplicationModel: {
      findById: async () => ({
        _id: applicationId,
        user: secondUserId,
        status: "pending",
      }),
      findOneAndUpdate: async (_filter, update) => {
        applicationUpdate = update.$set;
        return {
          _id: applicationId,
          user: secondUserId,
          status: update.$set.status,
        };
      },
    },
    UserModel: {
      findById: () => ({
        select() { return this; },
        lean: async () => applicant,
      }),
    },
    OrganizationModel: {
      exists: async () => true,
    },
    notificationService: { notifyAfterCommit: async () => {} },
    logger: { error() {} },
  });
  const res = response();
  await controller.reviewDriverApplication(
    {
      user: { _id: userId, role: "superAdmin" },
      params: { applicationId },
      body: { status: "approved" },
    },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(applicationUpdate.status, "approved");
  assert.equal(applicant.verificationStatus, "rejected");
  assert.equal(Object.keys(applicationUpdate).some((key) => key.includes("verification")), false);
});
