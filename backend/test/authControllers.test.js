import assert from "node:assert/strict";
import mongoose from "mongoose";
import test from "node:test";
import {
  createLoginUserController,
  createRegisterUserController,
} from "../src/controllers/auth.controller.js";

const response = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("registration rejects malformed, invalid, and mass-assigned fields before database access", async () => {
  let organizationLookups = 0;
  const register = createRegisterUserController({
    OrganizationModel: {
      findById: async () => {
        organizationLookups += 1;
        return null;
      },
    },
  });
  const invalidBodies = [
    undefined,
    [],
    { email: "person@example.com", role: "superAdmin" },
    {
      name: "Person",
      email: "not-an-email",
      phone: "123",
      password: "StrongPass1!",
      organization: new mongoose.Types.ObjectId().toString(),
    },
    {
      name: "Person",
      email: "person@example.com",
      phone: "invalid-phone",
      password: "StrongPass1!",
      organization: new mongoose.Types.ObjectId().toString(),
    },
    {
      name: "Person",
      email: "person@example.com",
      phone: "+1 555 123 4567",
      password: "StrongPass1!",
      organization: "not-an-object-id",
    },
  ];

  for (const body of invalidBodies) {
    const res = response();
    await register({ body }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(organizationLookups, 0);
});

test("registration creates a normalized account and never returns its OTP or password", async () => {
  const organizationId = new mongoose.Types.ObjectId();
  const createdUsers = [];
  const sentEmails = [];
  const register = createRegisterUserController({
    OrganizationModel: {
      findById: async (id) => {
        assert.equal(id, organizationId.toString());
        return {
          isActive: true,
          allowedDomains: ["example.com"],
          verifiedDomains: ["example.com"],
          domainVerificationStatus: "verified",
        };
      },
    },
    UserModel: {
      findOne: async () => null,
      create: async (user) => {
        createdUsers.push(user);
        return {
          _id: new mongoose.Types.ObjectId(),
          name: user.name,
          email: user.email,
          verificationStatus: "pending",
        };
      },
    },
    bcryptLibrary: { hash: async (value) => `hashed:${value}` },
    emailSender: async (...args) => sentEmails.push(args),
    otpGenerator: () => "123456",
    now: () => new Date("2026-11-26T00:00:00.000Z"),
  });
  const res = response();

  await register(
    {
      body: {
        name: "  Example User ",
        email: " USER@EXAMPLE.COM ",
        phone: "+1 555 123 4567",
        password: "StrongPass1!",
        organization: organizationId.toString(),
      },
    },
    res
  );

  assert.equal(res.statusCode, 201);
  assert.equal(createdUsers[0].name, "Example User");
  assert.equal(createdUsers[0].email, "user@example.com");
  assert.equal(createdUsers[0].password, "hashed:StrongPass1!");
  assert.equal(createdUsers[0].emailOtp, "123456");
  assert.deepEqual(sentEmails, [["user@example.com", "123456"]]);
  assert.equal(JSON.stringify(res.body).includes("123456"), false);
  assert.equal(JSON.stringify(res.body).includes("hashed:"), false);
});

test("institutional registration rejects personal and pending domains but accepts verified KIT domain", async () => {
  const organizationId = new mongoose.Types.ObjectId();
  const identityVerification = {
    legalName: "Example Person",
    documentType: "national_id",
    documentLast4: "A123",
  };
  const baseBody = {
    role: "passenger",
    name: "Example Person",
    phone: "555-0101",
    password: "StrongPass1!",
    organization: organizationId.toString(),
    identityVerification,
  };
  const registerWithOrganization = (organization) =>
    createRegisterUserController({
      OrganizationModel: {
        findById: async () => ({ _id: organizationId, ...organization }),
      },
      UserModel: {
        findOne: async () => null,
        create: async (user) => ({ _id: new mongoose.Types.ObjectId(), ...user }),
      },
      bcryptLibrary: { hash: async (value) => `hashed:${value}` },
      emailSender: async () => {},
      otpGenerator: () => "123456",
    });

  const pendingResponse = response();
  await registerWithOrganization({
    name: "Pending Institute",
    isActive: true,
    allowedDomains: [],
    verifiedDomains: [],
    domainVerificationStatus: "pending",
  })(
    {
      body: { ...baseBody, email: "student@pending.example" },
    },
    pendingResponse
  );
  assert.equal(pendingResponse.statusCode, 403);
  assert.match(pendingResponse.body.message, /pending verification/i);

  const personalResponse = response();
  await registerWithOrganization({
    name: "Verified Institute",
    isActive: true,
    allowedDomains: ["example.edu"],
    verifiedDomains: ["example.edu"],
    domainVerificationStatus: "verified",
  })(
    { body: { ...baseBody, email: "student@gmail.com" } },
    personalResponse
  );
  assert.equal(personalResponse.statusCode, 403);
  assert.match(personalResponse.body.message, /Personal email domains/i);

  let sentEmail;
  const kitRegister = createRegisterUserController({
    OrganizationModel: {
      findById: async () => ({
        _id: organizationId,
        name: "Kanpur Institute of Technology (KIT)",
        isActive: true,
        allowedDomains: ["kit.ac.in"],
        verifiedDomains: ["kit.ac.in"],
        domainVerificationStatus: "verified",
        approvalStatus: "approved",
      }),
    },
    UserModel: {
      findOne: async () => null,
      create: async (user) => ({ _id: new mongoose.Types.ObjectId(), ...user }),
    },
    bcryptLibrary: { hash: async (value) => `hashed:${value}` },
    emailSender: async (email) => { sentEmail = email; },
    otpGenerator: () => "123456",
  });
  const kitResponse = response();
  await kitRegister(
    { body: { ...baseBody, email: "student@kit.ac.in" } },
    kitResponse
  );
  assert.equal(kitResponse.statusCode, 201);
  assert.equal(sentEmail, "student@kit.ac.in");
});

test("public role registration reuses OTP while creating separate approval records", async () => {
  const organizationId = new mongoose.Types.ObjectId();
  const passengerId = new mongoose.Types.ObjectId();
  const driverId = new mongoose.Types.ObjectId();
  const organizationAccountId = new mongoose.Types.ObjectId();
  const createdUsers = [];
  const createdApplications = [];
  const createdOrganizations = [];
  const dependencies = {
    OrganizationModel: {
      findById: async () => ({
        _id: organizationId,
        isActive: true,
        approvalStatus: "approved",
        allowedDomains: ["example.edu"],
        verifiedDomains: ["example.edu"],
        domainVerificationStatus: "verified",
      }),
      create: async (organization) => {
        createdOrganizations.push(organization);
        return { _id: organizationAccountId, ...organization };
      },
    },
    UserModel: {
      findOne: async () => null,
      create: async (user) => {
        createdUsers.push(user);
        return { _id: createdUsers.length === 1 ? passengerId : driverId, ...user };
      },
    },
    DriverApplicationModel: {
      create: async (application) => {
        createdApplications.push(application);
        return application;
      },
    },
    bcryptLibrary: { hash: async (password) => `hashed:${password}` },
    emailSender: async () => {},
    otpGenerator: () => "123456",
    now: () => new Date("2026-11-26T00:00:00.000Z"),
  };
  const identityVerification = {
    legalName: "Example Person",
    documentType: "national_id",
    documentLast4: "A123",
  };

  const passengerResponse = response();
  await createRegisterUserController(dependencies)(
    {
      body: {
        role: "passenger",
        name: "Passenger",
        email: "passenger@example.edu",
        phone: "555-0101",
        password: "StrongPass1!",
        organization: organizationId.toString(),
        identityVerification,
      },
    },
    passengerResponse
  );
  assert.equal(passengerResponse.statusCode, 201);
  assert.equal(createdUsers[0].role, "passenger");
  assert.equal(createdUsers[0].verificationStatus, "pending");
  assert.equal(createdUsers[0].identityVerification.documentLast4, "A123");

  const driverResponse = response();
  await createRegisterUserController(dependencies)(
    {
      body: {
        role: "driver",
        name: "Driver",
        email: "driver@example.edu",
        phone: "555-0102",
        password: "StrongPass1!",
        organization: organizationId.toString(),
        identityVerification,
        licenseNumber: "LIC-1234",
        vehicleNumber: "CAR-123",
        vehicleType: "car",
      },
    },
    driverResponse
  );
  assert.equal(driverResponse.statusCode, 201);
  assert.equal(createdUsers[1].role, "driver");
  assert.equal(createdApplications[0].user, driverId);
  assert.equal(createdApplications[0].status, "pending");
  assert.equal(createdUsers[1].verificationStatus, "pending");

  const organizationResponse = response();
  await createRegisterUserController(dependencies)(
    {
      body: {
        role: "organization",
        name: "Contact Person",
        email: "contact@institution.edu",
        phone: "555-0103",
        password: "StrongPass1!",
        organizationName: "Example Institution",
        organizationType: "institution",
        address: "100 Example Avenue",
        registrationNumber: "REG-12345",
      },
    },
    organizationResponse
  );
  assert.equal(organizationResponse.statusCode, 201);
  assert.equal(createdOrganizations[0].approvalStatus, "pending");
  assert.deepEqual(createdOrganizations[0].allowedDomains, []);
  assert.deepEqual(createdOrganizations[0].verifiedDomains, []);
  assert.equal(createdOrganizations[0].domainVerificationStatus, "pending");
  assert.equal(createdUsers[2].role, "organization");
  assert.equal(createdUsers[2].organization, organizationAccountId);
  assert.equal(createdUsers[2].identityVerification, undefined);
});

test("login validates payloads, hides credential failures, and requires verified active accounts", async () => {
  const user = {
    _id: new mongoose.Types.ObjectId(),
    name: "Example User",
    email: "user@example.com",
    role: "user",
    authVersion: 2,
    isActive: true,
    isEmailVerified: true,
    verificationStatus: "pending",
    password: "password-hash",
  };
  let passwordValid = false;
  const login = createLoginUserController({
    UserModel: {
      findOne: (filter) => ({
        select: async () => (filter.email === user.email ? user : null),
      }),
    },
    bcryptLibrary: {
      compare: async () => passwordValid,
    },
    tokenGenerator: (userId, authVersion) => `${userId}:${authVersion}`,
  });

  const invalid = response();
  await login({ body: undefined }, invalid);
  assert.equal(invalid.statusCode, 400);

  const invalidCredentials = response();
  await login(
    { body: { email: " USER@example.com ", password: "incorrect" } },
    invalidCredentials
  );
  assert.equal(invalidCredentials.statusCode, 401);
  assert.equal(invalidCredentials.body.message, "Invalid email or password");

  passwordValid = true;
  const unverifiedUser = { ...user, isEmailVerified: false };
  const unverifiedLogin = createLoginUserController({
    UserModel: { findOne: () => ({ select: async () => unverifiedUser }) },
    bcryptLibrary: { compare: async () => true },
  });
  const unverified = response();
  await unverifiedLogin(
    { body: { email: user.email, password: "password" } },
    unverified
  );
  assert.equal(unverified.statusCode, 403);

  const successful = response();
  await login(
    { body: { email: " USER@example.com ", password: "correct" } },
    successful
  );
  assert.equal(successful.statusCode, 200);
  assert.equal(successful.body.token, `${user._id}:2`);
});
