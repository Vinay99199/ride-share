import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { driverApplicationsApi } from "../api/driverApplications";
import { errorMessage } from "../api/client";
import {
  Button,
  Field,
  Notice,
  PageHeading,
  Panel,
  SelectField,
  Spinner,
  Status,
  formatDate,
} from "../components/UI";
import { VehicleVisual } from "../components/VisualAssets";
import { useAuth } from "../context/AuthContext";

const DriverApplicationPage = () => {
  const {
    user,
    driverApplication,
    driverApplicationLoading,
    driverApplicationError,
    refreshDriverApplication,
  } = useAuth();
  const [form, setForm] = useState({
    licenseNumber: "",
    vehicleNumber: "",
    vehicleType: "car",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!driverApplication && !driverApplicationLoading) {
      refreshDriverApplication();
    }
  }, [driverApplication, driverApplicationLoading, refreshDriverApplication]);

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await driverApplicationsApi.apply(form);
      await refreshDriverApplication();
      setForm({ licenseNumber: "", vehicleNumber: "", vehicleType: "car" });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const canApply =
    ((!driverApplication && !driverApplicationError) ||
      driverApplication?.status === "rejected") &&
    (user?.role === "driver" ||
      (user?.role === "user" && driverApplication?.status === "rejected"));

  return (
    <div className="page">
      <PageHeading
        eyebrow="DRIVER COMMUNITY"
        title="Driver application"
        description="Driver approval is separate from identity verification and does not change your passenger access."
        illustration="verification"
      />
      {driverApplicationError && (
        <Notice>
          {driverApplicationError}{" "}
          <button className="text-button" type="button" onClick={refreshDriverApplication}>
            Refresh status
          </button>
        </Notice>
      )}
      {error && <Notice>{error}</Notice>}
      {driverApplicationLoading ? (
        <Spinner label="Checking your application status..." />
      ) : (
        <div className="content-grid application-grid">
          <Panel title="Your driver application">
            {!driverApplication ? (
              <Notice type="info">
                You have not submitted a driver application.
                {user?.role === "user"
                  ? " Create a separate Driver account to request driver access."
                  : ""}
              </Notice>
            ) : (
              <div className="application-status-card">
                <div className="application-status-heading">
                  <Status value={driverApplication.status} />
                  <span>Submitted {formatDate(driverApplication.createdAt)}</span>
                </div>
                <div className="profile-facts">
                  <div><span>License number</span><b>{driverApplication.licenseNumber || "Not available"}</b></div>
                  <div><span>Vehicle registration</span><b>{driverApplication.vehicleNumber}</b></div>
                  <div><span>Vehicle type</span><b>{driverApplication.vehicleType}</b></div>
                  <div><span>Last updated</span><b>{formatDate(driverApplication.updatedAt)}</b></div>
                </div>
                {driverApplication.rejectionReason && (
                  <Notice>
                    Application feedback: {driverApplication.rejectionReason}
                  </Notice>
                )}
                {driverApplication.status === "approved" && (
                  <Notice type="success">
                    Driver tools are enabled for this account.{" "}
                    <Link className="text-link" to="/rides/create">Create a ride</Link>
                  </Notice>
                )}
                {driverApplication.status === "pending" && (
                  <Notice type="info">Your application is awaiting administrator review.</Notice>
                )}
              </div>
            )}
            {canApply && (
              <form className="form-stack driver-application-form" onSubmit={submit}>
                <h3>{driverApplication ? "Resubmit application" : "Apply to become a driver"}</h3>
                <Field
                  label="Driver license number"
                  required
                  autoComplete="off"
                  minLength="2"
                  maxLength="120"
                  value={form.licenseNumber}
                  onChange={update("licenseNumber")}
                />
                <Field
                  label="Vehicle registration number"
                  required
                  autoComplete="off"
                  minLength="2"
                  maxLength="30"
                  value={form.vehicleNumber}
                  onChange={update("vehicleNumber")}
                />
                <SelectField label="Vehicle type" value={form.vehicleType} onChange={update("vehicleType")}>
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                </SelectField>
                <Button type="submit" disabled={busy}>
                  {busy ? "Submitting..." : "Submit application"}
                </Button>
              </form>
            )}
          </Panel>
          <Panel title="Review process">
            <VehicleVisual
              type={driverApplication?.vehicleType || form.vehicleType}
              className="application-vehicle-visual"
            />
            <div className="application-steps">
              <div><span>01</span><p><b>Submit details</b><small>Your application is scoped to your account and organization.</small></p></div>
              <div><span>02</span><p><b>Administrator review</b><small>Approval or rejection is sent as a notification.</small></p></div>
              <div><span>03</span><p><b>Offer rides</b><small>Only an approved application enables driver endpoints.</small></p></div>
            </div>
            <Notice type="info">
              Resubmission is available only after rejection. Passenger features remain available regardless of driver-application status.
            </Notice>
          </Panel>
        </div>
      )}
    </div>
  );
};

export default DriverApplicationPage;
