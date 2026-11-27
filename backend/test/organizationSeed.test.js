import assert from "node:assert/strict";
import mongoose from "mongoose";
import test from "node:test";
import { UP_ORGANIZATIONS } from "../src/data/up-organizations.js";
import Organization from "../src/models/Organization.js";
import { seedOrganizations } from "../scripts/seedOrganizations.js";

test("UP organization catalog contains 65 valid unique name/city entries", async () => {
  assert.equal(UP_ORGANIZATIONS.length, 65);
  const keys = UP_ORGANIZATIONS.map(
    (organization) =>
      `${organization.name.toLowerCase()}|${organization.city.toLowerCase()}`
  );
  assert.equal(new Set(keys).size, 65);
  for (const organization of UP_ORGANIZATIONS) {
    assert.equal(organization.state, "Uttar Pradesh");
    assert.equal(organization.country, "India");
    assert.ok(["college", "university", "institute"].includes(organization.type));
    assert.equal(Organization.schema.path("city").instance, "String");
    const isKit =
      organization.name.startsWith("Kanpur Institute of Technology");
    await new Organization({
      ...organization,
      allowedDomains: isKit ? ["kit.ac.in"] : [],
      verifiedDomains: isKit ? ["kit.ac.in"] : [],
      domainVerificationStatus: isKit ? "verified" : "pending",
      approvalStatus: "approved",
      isActive: true,
    }).validate();
  }
});

test("seed is repeatable, preserves KIT domain and organization references", async () => {
  const kitId = new mongoose.Types.ObjectId();
  const kit = {
    _id: kitId,
    name: "Kanpur Institute of Technology (KIT)",
    allowedDomains: ["kit.ac.in"],
    verifiedDomains: ["kit.ac.in"],
    domainVerificationStatus: "verified",
  };
  const expectedKit = {
    name: "Kanpur Institute of Technology (KIT)",
    shortName: "KIT",
    type: "institute",
    city: "Kanpur",
    state: "Uttar Pradesh",
    country: "India",
  };
  const organizations = [kit];
  const existingUser = {
    _id: new mongoose.Types.ObjectId(),
    organization: kitId,
  };
  let inserted;
  const OrganizationModel = {
    find: () => ({
      select: () => ({
        lean: async () => organizations.map((organization) => ({ ...organization })),
      }),
    }),
    updateOne: async (filter, update) => {
      const target = organizations.find(
        (organization) => String(organization._id) === String(filter._id)
      );
      Object.assign(target, update.$set);
      if (update.$addToSet) {
        for (const [field, value] of Object.entries(update.$addToSet)) {
          target[field] ||= [];
          if (!target[field].includes(value)) target[field].push(value);
        }
      }
      return { matchedCount: 1 };
    },
    insertMany: async (records) => {
      inserted = records.map((record) => ({ _id: new mongoose.Types.ObjectId(), ...record }));
      organizations.push(...inserted);
      return inserted;
    },
  };

  const first = await seedOrganizations({
    OrganizationModel,
    organizations: UP_ORGANIZATIONS,
  });
  assert.equal(first.requested, 65);
  assert.equal(first.inserted, 64);
  assert.equal(first.updated, 1);
  assert.equal(first.alreadyPresent, 1);
  assert.deepEqual(kit.allowedDomains, ["kit.ac.in"]);
  assert.deepEqual(kit.verifiedDomains, ["kit.ac.in"]);
  assert.equal(kit.domainVerificationStatus, "verified");
  assert.equal(kit.city, expectedKit.city);
  assert.equal(kit.state, expectedKit.state);
  assert.equal(kit.country, expectedKit.country);
  assert.equal(existingUser.organization, kitId);

  const second = await seedOrganizations({ OrganizationModel });
  assert.equal(second.inserted, 0);
  assert.equal(second.updated, 0);
  assert.equal(second.alreadyPresent, 65);
  assert.equal(organizations.length, 65);
  assert.equal(
    inserted.filter((organization) => organization.allowedDomains.length).length,
    0
  );
  assert(
    inserted.every(
      (organization) => organization.domainVerificationStatus === "pending"
    )
  );
});

test("seed does not promote a merely configured KIT domain during metadata updates", async () => {
  const pendingKit = {
    _id: new mongoose.Types.ObjectId(),
    name: "Kanpur Institute of Technology (KIT)",
    shortName: "KIT",
    city: "Incorrect City",
    state: "Incorrect State",
    country: "Incorrect Country",
    allowedDomains: ["kit.ac.in"],
  };
  const OrganizationModel = {
    find: () => ({
      select: () => ({
        lean: async () => [{ ...pendingKit }],
      }),
    }),
    updateOne: async (_filter, update) => {
      Object.assign(pendingKit, update.$set);
      return { matchedCount: 1 };
    },
    insertMany: async () => [],
  };

  await seedOrganizations({
    OrganizationModel,
    organizations: [
      {
        name: "Kanpur Institute of Technology (KIT)",
        shortName: "KIT",
        type: "institute",
        city: "Kanpur",
        state: "Uttar Pradesh",
        country: "India",
      },
    ],
  });

  assert.equal(pendingKit.domainVerificationStatus, "pending");
  assert.deepEqual(pendingKit.allowedDomains, ["kit.ac.in"]);
  assert.equal(pendingKit.verifiedDomains, undefined);
  assert.equal(pendingKit.city, "Kanpur");
  assert.equal(pendingKit.state, "Uttar Pradesh");
  assert.equal(pendingKit.country, "India");
});
