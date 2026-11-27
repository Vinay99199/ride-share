import assert from "node:assert/strict";
import { test } from "node:test";
import { createAdminPanelController } from "../src/controllers/adminPanel.controller.js";
import { createOrganizationController } from "../src/controllers/organization.controller.js";
import { UP_ORGANIZATIONS } from "../src/data/up-organizations.js";
import {
  getOrganizationDomainVerificationStatus,
  isOrganizationEmailDomainVerified,
} from "../src/utils/organizationDomain.js";

const organizationId = "65a1234567890abcdef12348";
const adminId = "65a1234567890abcdef12345";

const query = (value) => ({
  select() { return this; },
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

const makeController = ({
  organization = {
    _id: organizationId,
    name: "Example University",
    type: "university",
    allowedDomains: [],
    verifiedDomains: [],
    domainVerificationStatus: "pending",
    isActive: true,
  },
  conflictingOrganization = null,
  onUpdate = () => {},
  onAudit = () => {},
} = {}) =>
  createAdminPanelController({
    mongoose: {
      isValidObjectId: () => true,
      startSession: async () => ({
        withTransaction: async (operation) => operation(),
        endSession: async () => {},
      }),
    },
    OrganizationModel: {
      findById: () => query(organization),
      findOne: (filter) => {
        assert.equal(filter._id.$ne, organization._id);
        return query(conflictingOrganization);
      },
      findOneAndUpdate: (_filter, update, options) => {
        onUpdate(update, options);
        return query({
          ...organization,
          allowedDomains: ["example.ac.in"],
          verifiedDomains: ["example.ac.in"],
          domainVerificationStatus: "verified",
        });
      },
    },
    AuditLogModel: {
      create: async (entries, options) => {
        onAudit(entries, options);
        return entries;
      },
    },
    logger: { error() {} },
  });

test("SuperAdmin domain approval records the domain in the audited transaction", async () => {
  let update;
  let audit;
  const controller = makeController({
    onUpdate: (value, options) => { update = { value, options }; },
    onAudit: (entries, options) => { audit = { entries, options }; },
  });
  const res = response();
  await controller.verifyOrganizationDomain(
    {
      user: { _id: adminId, role: "superAdmin" },
      params: { organizationId },
      body: {
        domain: "Example.AC.IN",
        reason: "Matched to the institution's official website contact domain.",
      },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(update.value.$addToSet, {
    allowedDomains: "example.ac.in",
    verifiedDomains: "example.ac.in",
  });
  assert.equal(update.value.$set.domainVerificationStatus, "verified");
  assert.ok(update.options.session);
  assert.equal(audit.entries[0].action, "organization.domain.verify");
  assert.equal(audit.entries[0].reason, "Matched to the institution's official website contact domain.");
  assert.ok(audit.options.session);
});

test("domain approval rejects public email providers and domains assigned elsewhere", async () => {
  const controller = makeController({
    conflictingOrganization: { _id: "65a1234567890abcdef12349" },
  });

  const personalProviderResponse = response();
  await controller.verifyOrganizationDomain(
    {
      user: { _id: adminId, role: "superAdmin" },
      params: { organizationId },
      body: { domain: "gmail.com", reason: "Official source reviewed and confirmed." },
    },
    personalProviderResponse
  );
  assert.equal(personalProviderResponse.statusCode, 400);

  const conflictResponse = response();
  await controller.verifyOrganizationDomain(
    {
      user: { _id: adminId, role: "superAdmin" },
      params: { organizationId },
      body: { domain: "example.ac.in", reason: "Official source reviewed and confirmed." },
    },
    conflictResponse
  );
  assert.equal(conflictResponse.statusCode, 409);
});

test("pending domain status cannot be bypassed by a stale verified-domain entry", () => {
  assert.equal(
    isOrganizationEmailDomainVerified(
      {
        domainVerificationStatus: "pending",
        verifiedDomains: ["example.ac.in"],
      },
      "example.ac.in"
    ),
    false
  );
});

test("configured but unverified KIT domain is not reported or accepted as verified", () => {
  const organization = {
    name: "Kanpur Institute of Technology (KIT)",
    allowedDomains: ["kit.ac.in"],
    verifiedDomains: [],
    domainVerificationStatus: "pending",
  };
  assert.equal(getOrganizationDomainVerificationStatus(organization), "pending");
  assert.equal(
    isOrganizationEmailDomainVerified(organization, "kit.ac.in"),
    false
  );
  assert.equal(
    getOrganizationDomainVerificationStatus({
      name: organization.name,
      allowedDomains: organization.allowedDomains,
      verifiedDomains: [],
    }),
    "unavailable"
  );
});

test("public organization search matches city and returns domain status without allowlists", async () => {
  let observedFilter;
  const controller = createOrganizationController({
    OrganizationModel: {
      find: (filter) => {
        observedFilter = filter;
        return query([
          {
            _id: organizationId,
            name: "Example University",
            shortName: "Example",
            type: "university",
            city: "Kanpur",
            state: "Uttar Pradesh",
            country: "India",
            allowedDomains: [],
            verifiedDomains: [],
            domainVerificationStatus: "pending",
            isActive: true,
            approvalStatus: "approved",
          },
        ]);
      },
      countDocuments: async () => 1,
    },
    UserModel: { aggregate: async () => [] },
    logger: { error() {} },
  });
  const res = response();
  await controller.listOrganizations({ query: { q: "Kanpur", limit: "100" } }, res);

  assert.equal(res.statusCode, 200);
  assert(observedFilter.$and[0].$or.some(
    (clause) => clause.city?.$regex === "Kanpur"
  ));
  assert.equal(res.body.organizations[0].city, "Kanpur");
  assert.equal(res.body.organizations[0].domainVerificationStatus, "pending");
  assert.equal(Object.hasOwn(res.body.organizations[0], "allowedDomains"), false);
});

test("public organization API returns locations and actual domain status for all 65 records", async () => {
  const expectedByName = new Map(
    UP_ORGANIZATIONS.map((organization) => [organization.name, organization])
  );
  const records = UP_ORGANIZATIONS.map((organization) => ({
    _id: organization.name,
    ...organization,
    allowedDomains: organization.name.startsWith("Kanpur Institute of Technology")
      ? ["kit.ac.in"]
      : [],
    verifiedDomains: organization.name.startsWith("Kanpur Institute of Technology")
      ? ["kit.ac.in"]
      : [],
    domainVerificationStatus: organization.name.startsWith(
      "Kanpur Institute of Technology"
    )
      ? "verified"
      : "pending",
    approvalStatus: "approved",
    isActive: true,
  }));
  const controller = createOrganizationController({
    OrganizationModel: {
      find: () => query(records),
      countDocuments: async () => records.length,
    },
    UserModel: { aggregate: async () => [] },
    logger: { error() {} },
  });
  const res = response();
  await controller.listOrganizations({ query: { limit: "100" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.total, 65);
  assert.equal(res.body.organizations.length, 65);
  for (const organization of res.body.organizations) {
    const expected = expectedByName.get(organization.name);
    assert.ok(expected);
    assert.equal(organization.city, expected.city);
    assert.equal(organization.state, "Uttar Pradesh");
    assert.equal(organization.country, "India");
    assert.equal(Object.hasOwn(organization, "allowedDomains"), false);
  }
  assert.equal(
    res.body.organizations.filter(
      (organization) => organization.domainVerificationStatus === "pending"
    ).length,
    64
  );
  assert.equal(
    res.body.organizations.find((organization) =>
      organization.name.startsWith("Kanpur Institute of Technology")
    ).domainVerificationStatus,
    "verified"
  );
});
