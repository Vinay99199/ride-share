import "dotenv/config";
import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import Organization from "../src/models/Organization.js";
import { UP_ORGANIZATIONS } from "../src/data/up-organizations.js";

const normalize = (value) =>
  String(value ?? "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const recordKey = (name, city) => `${normalize(name)}|${normalize(city)}`;
export const seedOrganizations = async ({
  OrganizationModel = Organization,
  organizations = UP_ORGANIZATIONS,
} = {}) => {
  const existing = await OrganizationModel.find({})
    .select(
      "name shortName city state country allowedDomains verifiedDomains domainVerificationStatus"
    )
    .lean();
  const existingByKey = new Map();
  const existingByName = new Map();
  const existingByShortName = new Map();

  for (const organization of existing) {
    const key = recordKey(organization.name, organization.city);
    existingByKey.set(key, organization);
    for (const [name, index] of [
      [organization.name, existingByName],
      [organization.shortName, existingByShortName],
    ]) {
      if (!name) continue;
      const normalizedName = normalize(name);
      const matches = index.get(normalizedName) || [];
      matches.push(organization);
      index.set(normalizedName, matches);
    }
  }

  const report = {
    requested: organizations.length,
    inserted: 0,
    updated: 0,
    alreadyPresent: 0,
    duplicateRecordsSkipped: 0,
    ambiguousMatchesSkipped: 0,
  };
  const seen = new Set();
  const additions = [];

  for (const record of organizations) {
    const key = recordKey(record.name, record.city);
    if (seen.has(key)) {
      report.duplicateRecordsSkipped += 1;
      continue;
    }
    seen.add(key);

    const nameMatches = existingByName.get(normalize(record.name)) || [];
    const shortNameMatches =
      nameMatches.length === 0
        ? existingByShortName.get(normalize(record.name)) || []
        : [];
    const candidates = nameMatches.length > 0 ? nameMatches : shortNameMatches;
    const matchingCity = candidates.filter(
      (candidate) => normalize(candidate.city) === normalize(record.city)
    );
    const existingRecord =
      existingByKey.get(key) ||
      (matchingCity.length === 1 ? matchingCity[0] : null) ||
      (candidates.length === 1 ? candidates[0] : null);

    if (!existingRecord && candidates.length > 1) {
      report.ambiguousMatchesSkipped += 1;
      continue;
    }

    if (!existingRecord) {
      additions.push({
        ...record,
        allowedDomains: [],
        verifiedDomains: [],
        domainVerificationStatus: "pending",
        approvalStatus: "approved",
        isActive: true,
      });
      continue;
    }

    report.alreadyPresent += 1;
    const metadataUpdates = {};
    for (const field of ["city", "state", "country"]) {
      if (
        record[field] &&
        String(existingRecord[field] ?? "").trim() !== String(record[field]).trim()
      ) {
        metadataUpdates[field] = record[field];
      }
    }
    if (!existingRecord.shortName && record.shortName) {
      metadataUpdates.shortName = record.shortName;
    }

    if (!existingRecord.domainVerificationStatus) {
      const verifiedDomains = Array.isArray(existingRecord.verifiedDomains)
        ? existingRecord.verifiedDomains.map((domain) => String(domain).toLowerCase())
        : [];
      metadataUpdates.domainVerificationStatus =
        verifiedDomains.length > 0 ? "verified" : "pending";
    }

    if (Object.keys(metadataUpdates).length) {
      const update = {};
      update.$set = metadataUpdates;
      await OrganizationModel.updateOne(
        { _id: existingRecord._id },
        update,
        { runValidators: true }
      );
      report.updated += 1;
    }
  }

  if (additions.length) {
    await OrganizationModel.insertMany(additions, { ordered: true });
    report.inserted = additions.length;
  }

  return report;
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be configured before seeding organizations");
  }
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const report = await seedOrganizations();
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error("Organization seed failed:", error.message);
    process.exitCode = 1;
  });
}
