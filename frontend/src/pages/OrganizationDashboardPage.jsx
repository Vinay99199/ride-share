import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../api/client";
import { organizationsApi } from "../api/organizations";
import { EmptyState, Notice, Panel, PhotoHero, Spinner, Status } from "../components/UI";
import { OrganizationLogo } from "../components/VisualAssets";

const OrganizationDashboardPage = () => {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await organizationsApi.mine();
      setOrganization(result.organization);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <PhotoHero
        image="campus"
        className="organization-photo-hero"
        eyebrow="ORGANIZATION WORKSPACE"
        title={organization?.name || "Organization verification"}
        description="Review your organization profile and verification status."
        note="Illustrative campus photography · not an official organization image"
      />
      {error && <Notice>{error}</Notice>}
      {loading ? <Spinner label="Loading organization information..." /> : !organization ? (
        <EmptyState
          illustration="campus"
          title="Organization details are unavailable"
          description="Contact AVONEX support if you believe this account should be linked to an organization."
        />
      ) : (
        <div className="organization-dashboard-grid">
          <Panel title="Organization overview">
            <div className="organization-brand-row">
              <OrganizationLogo
                name={organization.name}
                shortName={organization.shortName}
              />
              <div>
                <strong>{organization.name}</strong>
                <span>{[organization.city, organization.state].filter(Boolean).join(", ")}</span>
              </div>
            </div>
            <div className="organization-status-heading">
              <Status value={organization.approvalStatus} />
              <span>{organization.type}</span>
            </div>
            <div className="profile-facts">
              <div><span>Official email</span><b>{organization.officialEmail || "Not provided"}</b></div>
              <div><span>Contact person</span><b>{organization.contactPerson || "Not provided"}</b></div>
              <div><span>Contact number</span><b>{organization.contactPhone || "Not provided"}</b></div>
              <div><span>Address</span><b>{organization.address || "Not provided"}</b></div>
              <div><span>Website</span><b>{organization.website || "Not provided"}</b></div>
              <div><span>Registered community members</span><b>{organization.memberCount}</b></div>
            </div>
          </Panel>
          <Panel title="Verification and access">
            {organization.approvalStatus === "pending" && (
              <Notice type="info">
                Your organization registration is awaiting platform review. Organization management features remain unavailable until approval and an administrator assignment.
              </Notice>
            )}
            {organization.approvalStatus === "rejected" && (
              <Notice>
                Organization verification was rejected: {organization.approvalReason || "Contact AVONEX support for next steps."}
              </Notice>
            )}
            {organization.approvalStatus === "approved" && (
              <Notice type="success">
                Organization verification is approved. This account does not receive administrator permissions automatically; a SuperAdmin must explicitly assign an authorized organization administrator.
              </Notice>
            )}
            <p className="field-note">
              Verification, account email verification, and organization-admin permissions are separate controls.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
};

export default OrganizationDashboardPage;
