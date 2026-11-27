import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { test } from "node:test";
import {
  changePassword,
  confirmEmailChange,
  createEmailChangeOtpHash,
  requestEmailChange,
  updateProfile,
} from "../src/controllers/auth.controller.js";
import { createLogoutController } from "../src/controllers/session.controller.js";
import { createOrganizationController } from "../src/controllers/organization.controller.js";
import { createMyRidesController } from "../src/controllers/ride.controller.js";
import { createAuthMiddleware } from "../src/middleware/auth.middleware.js";
import { createSessionService, hashToken } from "../src/services/session.service.js";
import { getAdminOrganizationIds } from "../src/services/adminAuthorization.service.js";

const userId = "65a1234567890abcdef12345";
const secondUserId = "65a1234567890abcdef67890";
const organizationId = "65a1234567890abcdef11111";
const rideId = "65a1234567890abcdef22222";
const secret = "phase5-test-secret";

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

const query = (value) => ({
  select() { return this; },
  sort() { return this; },
  skip() { return this; },
  limit() { return this; },
  populate() { return this; },
  lean() { return Promise.resolve(value); },
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject);
  },
});

const notificationSink = {
  notifyAfterCommit: async () => {},
};

test("My Rides scopes queries to the authenticated driver and returns bounded filtered pages", async () => {
  const firstRideId = "65a1234567890abcdef22221";
  const secondRideId = "65a1234567890abcdef22222";
  const records = [
    {
      _id: firstRideId,
      driver: userId,
      status: "scheduled",
      departureTime: new Date("2026-12-01T10:00:00.000Z"),
      createdAt: new Date("2026-11-20T10:00:00.000Z"),
      toObject() { return { _id: this._id, driver: userId, status: this.status }; },
    },
    {
      _id: secondRideId,
      driver: userId,
      status: "scheduled",
      departureTime: new Date("2026-12-02T10:00:00.000Z"),
      createdAt: new Date("2026-11-21T10:00:00.000Z"),
      toObject() { return { _id: this._id, driver: userId, status: this.status }; },
    },
  ];
  const filters = [];
  const RideModel = {
    find(filter) {
      filters.push(filter);
      if (filter.startedAt) {
        return query([]);
      }
      const selected = records.filter((ride) => {
        if (String(ride.driver) !== String(filter.driver)) return false;
        if (filter.status && ride.status !== filter.status) return false;
        if (
          filter.departureTime?.$gte &&
          ride.departureTime < filter.departureTime.$gte
        ) return false;
        if (
          filter.departureTime?.$lt &&
          ride.departureTime >= filter.departureTime.$lt
        ) return false;
        return true;
      });
      let result = [...selected];
      return {
        populate() { return this; },
        sort(sortBy) {
          const [[field, direction]] = Object.entries(sortBy);
          result.sort((left, right) =>
            (left[field] > right[field] ? 1 : left[field] < right[field] ? -1 : 0) *
            direction
          );
          return this;
        },
        skip(count) { result = result.slice(count); return this; },
        limit(count) { result = result.slice(0, count); return this; },
        then(resolve, reject) {
          return Promise.resolve(result).then(resolve, reject);
        },
      };
    },
    countDocuments: async (filter) => records.filter((ride) =>
      String(ride.driver) === String(filter.driver) &&
      ride.status === filter.status
    ).length,
    aggregate: async (pipeline) => {
      assert.equal(String(pipeline[0].$match.driver), userId);
      return [{
        total: 4,
        scheduled: 2,
        cancelled: 1,
        completed: 1,
        active: 1,
        upcoming: 1,
      }];
    },
  };
  const BookingModel = {
    aggregate: async (pipeline) => {
      assert.deepEqual(pipeline[0].$match.status, { $in: ["pending", "confirmed"] });
      return [{
        _id: { ride: secondRideId, status: "confirmed" },
        count: 1,
      }];
    },
  };
  const controller = createMyRidesController({
    RideModel,
    BookingModel,
    logger: { error() {} },
  });
  const res = response();
  await controller(
    {
      user: { _id: userId },
      query: {
        page: "2",
        limit: "1",
        status: "scheduled",
        departureFrom: "2026-12-01",
        departureTo: "2026-12-31",
        sort: "departure_asc",
      },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.total, 2);
  assert.equal(res.body.page, 2);
  assert.equal(res.body.totalPages, 2);
  assert.equal(res.body.rides.length, 1);
  assert.equal(res.body.rides[0]._id, secondRideId);
  assert.deepEqual(res.body.rides[0].bookingSummary, {
    pending: 0,
    confirmed: 1,
    total: 1,
  });
  assert.equal(res.body.summary.total, 4);
  assert.equal(res.body.summary.active, 1);
  assert.ok(filters.every((filter) => String(filter.driver) === userId));
  assert.equal(filters[0].departureTime.$gte.toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(filters[0].departureTime.$lt.toISOString(), "2027-01-01T00:00:00.000Z");
});

test("My Rides rejects client-selected drivers, invalid statuses, dates and pagination", async () => {
  const controller = createMyRidesController({
    RideModel: {},
    BookingModel: {},
    logger: { error() {} },
  });
  for (const queryParams of [
    { driverId: secondUserId },
    { status: "unknown" },
    { page: "0" },
    { limit: "101" },
    { departureFrom: "2026-02-30" },
  ]) {
    const res = response();
    await controller({ user: { _id: userId }, query: queryParams }, res);
    assert.equal(res.statusCode, 400);
  }
});

test("organization discovery exposes only active public fields and paginates", async () => {
  const organizations = [
    {
      _id: organizationId,
      name: "Example College",
      type: "college",
      allowedDomains: ["example.edu"],
      adminId: secondUserId,
      isActive: true,
    },
  ];
  let observedFilter;
  const controller = createOrganizationController({
    OrganizationModel: {
      find(filter) {
        observedFilter = filter;
        return query(organizations);
      },
      countDocuments: async () => 1,
    },
    UserModel: {
      aggregate: async () => [{ _id: organizationId, count: 12 }],
    },
    logger: { error() {} },
  });
  const res = response();
  await controller.listOrganizations({ query: { page: "1", limit: "10" } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(observedFilter.isActive, { $ne: false });
  assert.deepEqual(observedFilter.$or, [
    { approvalStatus: "approved" },
    { approvalStatus: { $exists: false } },
  ]);
  assert.equal(res.body.organizations[0].name, "Example College");
  assert.equal(res.body.organizations[0].memberCount, 12);
  assert.equal(Object.hasOwn(res.body.organizations[0], "allowedDomains"), false);
  assert.equal(Object.hasOwn(res.body.organizations[0], "adminId"), false);
});

test("organization self lookup derives scope from the authenticated account", async () => {
  let requestedOrganization;
  const controller = createOrganizationController({
    OrganizationModel: {
      findById(id) {
        requestedOrganization = id;
        return query({
          _id: organizationId,
          name: "Example College",
          type: "college",
          allowedDomains: ["example.edu"],
          isActive: true,
        });
      },
    },
    UserModel: {
      aggregate: async () => [{ _id: organizationId, count: 12 }],
    },
    logger: { error() {} },
  });
  const res = response();
  await controller.getMyOrganization(
    { user: { _id: userId, role: "user", organization: organizationId } },
    res
  );
  assert.equal(String(requestedOrganization), organizationId);
  assert.equal(res.body.organization.allowedDomains[0], "example.edu");
  assert.equal(res.body.organization.memberCount, 12);
});

test("organization admins see only organizations assigned to their account", async () => {
  let filter;
  const controller = createOrganizationController({
    OrganizationModel: {
      find(value) {
        filter = value;
        return query([]);
      },
    },
    UserModel: { aggregate: async () => [] },
    logger: { error() {} },
  });
  const res = response();
  await controller.getMyOrganization(
    { user: { _id: userId, role: "organizationAdmin", organization: secondUserId } },
    res
  );
  assert.deepEqual(filter, { adminId: userId });
  assert.equal(res.body.organization, null);
});

test("pending and rejected organizations do not grant organization-admin scope", async () => {
  const activeOrganization = "65a1234567890abcdef11112";
  const organizationIds = await getAdminOrganizationIds(
    { _id: userId, role: "organizationAdmin" },
    {
      find(filter) {
        assert.deepEqual(filter, { adminId: userId });
        return query([
          { _id: organizationId, approvalStatus: "pending" },
          { _id: activeOrganization, approvalStatus: "approved" },
          { _id: secondUserId, approvalStatus: "rejected" },
          { _id: rideId },
        ]);
      },
    }
  );
  assert.deepEqual(organizationIds, [activeOrganization, rideId]);
});

test("profile updates allow only validated public fields", async () => {
  let update;
  const controllerUser = {
    _id: userId,
    name: "Example User",
    email: "example@example.edu",
    phone: "+1 555 0100",
    role: "user",
    organization: organizationId,
  };
  const UserModel = {
    findByIdAndUpdate: (_id, updateDocument) => {
      update = updateDocument;
      return {
        select: async () => controllerUser,
      };
    },
  };
  let res = response();
  await updateProfile(
    {
      user: { _id: userId },
      body: {
        name: " Updated Name ",
        phone: "+1 555 0101",
        homeLocation: { type: "Point", coordinates: [77.6, 12.9] },
        homeLocationName: "Bengaluru",
        homeAddress: "Bengaluru, Karnataka, India",
      },
    },
    res,
    { UserModel }
  );
  assert.equal(res.statusCode, 200);
  assert.deepEqual(update.$set, {
    name: "Updated Name",
    phone: "+1 555 0101",
    homeLocation: { type: "Point", coordinates: [77.6, 12.9] },
    homeLocationName: "Bengaluru",
    homeAddress: "Bengaluru, Karnataka, India",
  });
  assert.equal(Object.hasOwn(res.body.user, "password"), false);

  res = response();
  await updateProfile(
    { user: { _id: userId }, body: { role: "superAdmin" } },
    res,
    { UserModel }
  );
  assert.equal(res.statusCode, 400);

  res = response();
  await updateProfile(
    {
      user: { _id: userId },
      body: { homeLocation: { type: "Point", coordinates: [999, 12] } },
    },
    res,
    { UserModel }
  );
  assert.equal(res.statusCode, 400);
});

test("password changes verify the current password and invalidate prior sessions", async () => {
  let update;
  const events = [];
  const UserModel = {
    findById: () => ({
      select: async () => ({
        _id: userId,
        password: "correct-current",
        authVersion: 0,
      }),
    }),
    findOneAndUpdate: (_filter, updateDocument) => {
      update = updateDocument;
      return Promise.resolve({
        _id: userId,
        name: "Example User",
        email: "example@example.edu",
        phone: "555-0100",
        role: "user",
      });
    },
  };
  const dependencies = {
    UserModel,
    bcryptLibrary: {
      compare: async (plain, hash) => plain === hash,
      hash: async (plain) => `hashed:${plain}`,
    },
    tokenGenerator: (id, version) => `token:${id}:${version}`,
    notifications: {
      notifyAfterCommit: async (items) => events.push(...items),
    },
    disconnectSockets: async (id) => assert.equal(String(id), userId),
  };

  let res = response();
  await changePassword(
    {
      user: { _id: userId },
      body: {
        currentPassword: "wrong",
        newPassword: "NewPassword1!",
      },
    },
    res,
    dependencies
  );
  assert.equal(res.statusCode, 401);

  res = response();
  await changePassword(
    {
      user: { _id: userId },
      body: {
        currentPassword: "correct-current",
        newPassword: "NewPassword1!",
      },
    },
    res,
    dependencies
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.token, `token:${userId}:1`);
  assert.equal(update.$set.password, "hashed:NewPassword1!");
  assert.equal(update.$set.authVersion, 1);
  assert.equal(events[0].type, "account_security");
});

test("email change keeps the old address until an organization-domain OTP is verified", async () => {
  let sentOtp;
  let persistedUpdate;
  const pendingUser = {
    _id: userId,
    email: "old@example.edu",
    organization: organizationId,
    authVersion: 0,
    pendingEmail: undefined,
    pendingEmailOtpHash: undefined,
    pendingEmailOtpExpiresAt: undefined,
    save: async () => {},
  };
  const UserModel = {
    exists: async () => null,
    findById: () => ({
      select: async () => pendingUser,
    }),
    findOneAndUpdate: (_filter, updateDocument) => {
      persistedUpdate = updateDocument;
      return Promise.resolve({
        _id: userId,
        email: updateDocument.$set.email,
        name: "Example User",
        phone: "555-0100",
        role: "user",
        organization: organizationId,
      });
    },
  };
  const OrganizationModel = {
    findById: () => ({
      select() { return this; },
      lean: async () => ({
        allowedDomains: ["example.edu"],
        verifiedDomains: ["example.edu"],
        domainVerificationStatus: "verified",
        isActive: true,
      }),
    }),
  };
  const request = await requestEmailChange(
    {
      user: { _id: userId, email: pendingUser.email, organization: organizationId },
      body: { email: "new@example.edu" },
    },
    response(),
    {
      UserModel,
      OrganizationModel,
      emailSender: async (_email, otp) => { sentOtp = otp; },
      secret,
    }
  );
  assert.equal(request.statusCode, 200);
  assert.equal(pendingUser.email, "old@example.edu");
  assert.equal(pendingUser.pendingEmail, "new@example.edu");
  assert.notEqual(pendingUser.pendingEmailOtpHash, sentOtp);
  assert.equal(Object.hasOwn(request.body, "otp"), false);

  const dependencies = {
    UserModel,
    tokenGenerator: (_id, version) => `new-session:${version}`,
    notifications: notificationSink,
    disconnectSockets: async () => {},
    secret,
  };
  let res = response();
  await confirmEmailChange(
    { user: { _id: userId }, body: { otp: "000000" } },
    res,
    dependencies
  );
  assert.equal(res.statusCode, 400);

  res = response();
  await confirmEmailChange(
    { user: { _id: userId }, body: { otp: sentOtp } },
    res,
    dependencies
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.email, "new@example.edu");
  assert.equal(res.body.token, "new-session:1");
  assert.equal(persistedUpdate.$set.isEmailVerified, true);
  assert.equal(persistedUpdate.$set.authVersion, 1);
});

test("token revocation stores only a hash, expires automatically, and is idempotent", async () => {
  const entries = new Map();
  const now = new Date("2026-11-26T00:00:00.000Z");
  const sessions = createSessionService({
    now: () => now,
    RevokedTokenModel: {
      findOne: async (filter) => {
        const entry = entries.get(filter.tokenHash);
        return entry && entry.expiresAt > filter.expiresAt.$gt ? entry : null;
      },
      updateOne: async (filter, update) => {
        if (!entries.has(filter.tokenHash)) {
          entries.set(filter.tokenHash, update.$setOnInsert);
        }
      },
    },
  });
  const token = "opaque.jwt.value";
  const expiresAt = new Date("2026-11-27T00:00:00.000Z");
  await sessions.revoke(token, expiresAt);
  await sessions.revoke(token, expiresAt);
  assert.equal(entries.size, 1);
  assert.equal(entries.has(token), false);
  assert.equal(entries.has(hashToken(token)), true);
  assert.equal(await sessions.isRevoked(token), true);
  assert.equal(
    await sessions.isRevoked("another.jwt.value"),
    false
  );
  await assert.rejects(
    () => sessions.revoke("expired.jwt.value", now),
    /future token expiry/
  );
});

test("logout is repeatable and disconnects the session socket room", async () => {
  const calls = [];
  const revoked = new Map();
  const sessions = createSessionService({
    RevokedTokenModel: {
      findOne: async (filter) => {
        const entry = revoked.get(filter.tokenHash);
        return entry && entry.expiresAt > filter.expiresAt.$gt ? entry : null;
      },
      updateOne: async (filter, update) => {
        if (!revoked.has(filter.tokenHash)) {
          revoked.set(filter.tokenHash, update.$setOnInsert);
        }
      },
    },
  });
  const token = jwt.sign({ id: userId, authVersion: 0 }, secret, {
    expiresIn: "5m",
  });
  const expiresAt = new Date(jwt.decode(token).exp * 1000);
  const logout = createLogoutController({
    sessions,
    disconnectSockets: async (tokenHash) => calls.push({ tokenHash }),
  });
  for (let index = 0; index < 2; index += 1) {
    const res = response();
    await logout(
      {
        authToken: token,
        authTokenExpiresAt: expiresAt,
      },
      res
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
  }
  assert.equal(calls.length, 2);
  assert.equal(calls[0].tokenHash, hashToken(token));
  assert.equal(calls[1].tokenHash, hashToken(token));

  const middleware = createAuthMiddleware({
    secret,
    sessions,
    UserModel: {
      findById: () => ({
        select: async () => ({
          _id: userId,
          isActive: true,
          authVersion: 0,
          set() {},
        }),
      }),
    },
    logger: { error() {} },
    isDatabaseReady: () => true,
  });
  const protectedResponse = response();
  await middleware(
    { headers: { authorization: `Bearer ${token}` } },
    protectedResponse,
    () => assert.fail("revoked tokens must not reach protected APIs")
  );
  assert.equal(protectedResponse.statusCode, 401);
});

test("protected middleware rejects revoked, expired and version-stale access tokens", async () => {
  const revokedTokens = new Set();
  const sessions = {
    isRevoked: async (token) => revokedTokens.has(token),
  };
  const user = {
    _id: userId,
    role: "user",
    isActive: true,
    authVersion: 1,
    set(key, value) { if (value === undefined) delete this[key]; },
  };
  const middleware = createAuthMiddleware({
    secret,
    sessions,
    UserModel: {
      findById: () => ({
        select: async () => ({ ...user, set: user.set }),
      }),
    },
    logger: { error() {} },
    isDatabaseReady: () => true,
  });
  const invoke = async (token) => {
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = response();
    let continued = false;
    await middleware(req, res, () => { continued = true; });
    return { req, res, continued };
  };

  const validToken = jwt.sign({ id: userId, authVersion: 1 }, secret, {
    expiresIn: "5m",
  });
  const valid = await invoke(validToken);
  assert.equal(valid.continued, true);
  assert.equal(Object.hasOwn(valid.req.user, "authVersion"), false);

  revokedTokens.add(validToken);
  const revoked = await invoke(validToken);
  assert.equal(revoked.res.statusCode, 401);
  assert.equal(revoked.continued, false);

  const staleToken = jwt.sign({ id: userId, authVersion: 0 }, secret, {
    expiresIn: "5m",
  });
  assert.equal((await invoke(staleToken)).res.statusCode, 401);

  const expiredToken = jwt.sign({ id: userId, authVersion: 1 }, secret, {
    expiresIn: -1,
  });
  assert.equal((await invoke(expiredToken)).res.statusCode, 401);
  assert.equal((await invoke("not.a.jwt")).res.statusCode, 401);
});

test("protected middleware returns 503 without querying when MongoDB is disconnected", async () => {
  let userLookupAttempted = false;
  const token = jwt.sign({ id: userId, authVersion: 1 }, secret, {
    expiresIn: "5m",
  });
  const middleware = createAuthMiddleware({
    secret,
    isDatabaseReady: () => false,
    UserModel: {
      findById() {
        userLookupAttempted = true;
        throw new Error("User lookup should not run");
      },
    },
  });
  const res = response();

  await middleware(
    { headers: { authorization: `Bearer ${token}` } },
    res,
    () => assert.fail("requests must stop before database lookups")
  );

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.message, "Authentication database is temporarily unavailable");
  assert.equal(userLookupAttempted, false);
});
