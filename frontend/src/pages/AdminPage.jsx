import { useEffect, useState } from "react";
import { adminApi } from "../api/admin";
import { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Button,
  EmptyState,
  Notice,
  PageHeading,
  Panel,
  Spinner,
  Status,
  formatDate,
} from "../components/UI";
import { UserAvatar } from "../components/VisualAssets";

const AdminPage = () => {
  const { user } = useAuth();
  const platformWide = user?.role === "superAdmin";
  const [applications, setApplications] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [driverReasons, setDriverReasons] = useState({});
  const [identityReasons, setIdentityReasons] = useState({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    const [driverApplications, identityVerifications] = await Promise.all([
      adminApi.pendingApplications(),
      adminApi.pendingVerifications(),
    ]);
    setApplications(driverApplications);
    setVerifications(identityVerifications);
  };

  useEffect(() => {
    let active = true;
    load()
      .catch((requestError) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const reviewApplication = async (applicationId, status) => {
    const rejectionReason = driverReasons[applicationId]?.trim();
    if (status === "rejected" && (!rejectionReason || rejectionReason.length > 500)) {
      setError("Enter a rejection reason of up to 500 characters.");
      return;
    }

    setWorkingId(applicationId);
    setError("");
    setSuccess("");
    try {
      const result = await adminApi.reviewApplication(applicationId, {
        status,
        ...(status === "rejected" ? { rejectionReason } : {}),
      });
      setSuccess(result.message);
      setApplications((items) => items.filter((item) => item._id !== applicationId));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setWorkingId("");
    }
  };

  const reviewIdentity = async (verificationId, status) => {
    const rejectionReason = identityReasons[verificationId]?.trim();
    if (status === "rejected" && (!rejectionReason || rejectionReason.length > 500)) {
      setError("Enter a rejection reason between 5 and 500 characters.");
      return;
    }

    setWorkingId(verificationId);
    setError("");
    setSuccess("");
    try {
      const result = await adminApi.reviewVerification(verificationId, {
        status,
        ...(status === "rejected" ? { rejectionReason } : {}),
      });
      setSuccess(result.message);
      setVerifications((items) => items.filter((item) => item.id !== verificationId));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setWorkingId("");
    }
  };

  return (
    <div className="page">
      <PageHeading
        eyebrow="AUTHORIZED ADMINISTRATION"
        title="Review center"
        description={`${platformWide ? "Platform-wide" : "Organization-scoped"} administration · signed in as ${user?.role}.`}
        illustration="verification"
      />
      {error && <Notice>{error}</Notice>}
      {success && <Notice type="success">{success}</Notice>}
      {loading ? <Spinner label="Loading authorized review queues..." /> : (
        <div className="admin-review-grid">
          <Panel
            title="Driver applications"
            action={<span className="count-pill">{applications.length}</span>}
          >
            {applications.length ? (
              <div className="admin-application-list">
                {applications.map((application) => (
                  <article className="admin-application" id="driver-applications" key={application._id}>
                    <div className="admin-app-user">
                      <UserAvatar name={application.user?.name} />
                      <strong>{application.user?.name || "Applicant"}</strong>
                      <span>{application.user?.email}</span>
                      <span>{application.user?.phone}</span>
                      <span className="muted">
                        Organization: {String(application.user?.organization?._id || application.user?.organization || "Not assigned")}
                      </span>
                    </div>
                    <div className="admin-app-details">
                      <div><span>LICENSE</span><b>{application.licenseNumber}</b></div>
                      <div><span>VEHICLE</span><b>{application.vehicleNumber} · {application.vehicleType}</b></div>
                      <div><span>SUBMITTED</span><b>{formatDate(application.createdAt)}</b></div>
                      <Status value={application.status} />
                      <label className="field admin-reason">
                        <span>Rejection feedback (required to reject)</span>
                        <textarea
                          rows="2"
                          maxLength="500"
                          value={driverReasons[application._id] || ""}
                          onChange={(event) => setDriverReasons((current) => ({
                            ...current,
                            [application._id]: event.target.value,
                          }))}
                        />
                      </label>
                    </div>
                    <div className="inline-actions">
                      <Button
                        type="button"
                        className="button-small"
                        disabled={workingId === application._id}
                        onClick={() => reviewApplication(application._id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="button-small"
                        disabled={workingId === application._id}
                        onClick={() => reviewApplication(application._id, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                illustration="rides"
                title="No pending driver applications"
                description={platformWide
                  ? "There are no applications awaiting review across the platform."
                  : "There are no applications in your authorized organization scope."}
              />
            )}
          </Panel>

          <Panel
            title="Identity verification"
            action={<span className="count-pill">{verifications.length}</span>}
          >
            {verifications.length ? (
              <div className="admin-application-list">
                {verifications.map((verification) => (
                  <article className="admin-application identity-review" id="identity-verification" key={verification.id}>
                    <div className="admin-app-user">
                      <UserAvatar name={verification.user.name} />
                      <strong>{verification.user.name}</strong>
                      <span>{verification.user.email}</span>
                      <span className="muted">
                        Organization: {String(verification.user.organization || "Not assigned")}
                      </span>
                    </div>
                    <div className="admin-app-details">
                      <div><span>LEGAL NAME</span><b>{verification.legalName}</b></div>
                      <div><span>DOCUMENT</span><b>{verification.documentType.replaceAll("_", " ")} · ****{verification.documentLast4}</b></div>
                      <div><span>SUBMITTED</span><b>{formatDate(verification.submittedAt)}</b></div>
                      <Status value={verification.status} />
                      <label className="field admin-reason">
                        <span>Rejection reason (required to reject)</span>
                        <textarea
                          rows="2"
                          minLength="5"
                          maxLength="500"
                          value={identityReasons[verification.id] || ""}
                          onChange={(event) => setIdentityReasons((current) => ({
                            ...current,
                            [verification.id]: event.target.value,
                          }))}
                        />
                      </label>
                    </div>
                    <div className="inline-actions">
                      <Button
                        type="button"
                        className="button-small"
                        disabled={workingId === verification.id}
                        onClick={() => reviewIdentity(verification.id, "verified")}
                      >
                        Verify
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="button-small"
                        disabled={workingId === verification.id}
                        onClick={() => reviewIdentity(verification.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                illustration="verification"
                title="No pending identity checks"
                description={platformWide
                  ? "There are no identity submissions awaiting review across the platform."
                  : "There are no identity submissions in your authorized organization scope."}
              />
            )}
            <Notice type="info">
              Identity review uses only the submitted legal name, document type, and last four characters. No document image or full ID number is stored or displayed.
            </Notice>
          </Panel>
        </div>
      )}
      <p className="field-note">
        Admin routes verify the current user role on the backend. Organization admins can review only records belonging to organizations whose adminId matches their account; SuperAdmin may review platform-wide.
      </p>
    </div>
  );
};

export default AdminPage;
