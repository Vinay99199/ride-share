const personalEmailDomains = new Set([
  "aol.com",
  "fastmail.com",
  "gmx.com",
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "mac.com",
  "mail.com",
  "me.com",
  "msn.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "rocketmail.com",
  "yahoo.co.in",
  "yahoo.com",
  "yandex.com",
  "ymail.com",
  "zoho.com",
]);

export const normalizeEmailDomain = (domain) =>
  typeof domain === "string" ? domain.trim().toLowerCase() : "";

export const isPersonalEmailDomain = (domain) =>
  personalEmailDomains.has(normalizeEmailDomain(domain));

export const isOrganizationEmailDomainVerified = (organization, domain) => {
  if (
    organization.domainVerificationStatus &&
    organization.domainVerificationStatus !== "verified"
  ) {
    return false;
  }

  const normalizedDomain = normalizeEmailDomain(domain);
  const verifiedDomains = Array.isArray(organization.verifiedDomains)
    ? organization.verifiedDomains.map(normalizeEmailDomain)
    : [];
  return verifiedDomains.includes(normalizedDomain);
};

export const getOrganizationDomainVerificationStatus = (organization) => {
  const status = organization.domainVerificationStatus;
  if (status === "pending" || status === "rejected") return status;

  const verifiedDomains = Array.isArray(organization.verifiedDomains)
    ? organization.verifiedDomains.filter(
        (domain) => typeof domain === "string" && domain.trim()
      )
    : [];
  if (verifiedDomains.length > 0) return "verified";
  return "unavailable";
};
