import { useEffect, useState } from "react";
import { identityVerificationApi } from "../api/identityVerification";
import { errorMessage } from "../api/client";
import {
  Button,
  Field,
  Notice,
  Panel,
  SelectField,
  Spinner,
  Status,
  formatDate,
} from "./UI";

const initialForm = {
  legalName: "",
  documentType: "passport",
  documentLast4: "",
};

const IdentityVerificationPanel = () => {
  const [verification, setVerification] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      setVerification(await identityVerificationApi.mine());
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await identityVerificationApi.submit({
        legalName: form.legalName.trim(),
        documentType: form.documentType,
        documentLast4: form.documentLast4.trim(),
      });
      setVerification(result.verification);
      setSuccess(result.message);
      setForm(initialForm);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = ["not_submitted", "rejected"].includes(verification?.status);

  return (
    <Panel title="Identity verification">
      {error && <Notice>{error}</Notice>}
      {success && <Notice type="success">{success}</Notice>}
      {loading ? <Spinner label="Loading identity verification..." /> : (
        <>
          <div className="identity-status">
            <Status value={verification?.status || "not_submitted"} />
            {verification?.submittedAt && (
              <span>Submitted {formatDate(verification.submittedAt)}</span>
            )}
          </div>
          {verification?.status === "pending" && (
            <Notice type="info">
              Your information is pending administrator review.{" "}
              <button className="text-button" type="button" onClick={load}>
                Refresh status
              </button>
            </Notice>
          )}
          {verification?.status === "verified" && (
            <Notice type="success">Your identity verification is approved.</Notice>
          )}
          {verification?.status === "rejected" && (
            <Notice>
              Verification was rejected: {verification.rejectionReason || "Please review your information and resubmit."}
            </Notice>
          )}
          {verification?.documentType && (
            <p className="field-note">
              Submitted as {verification.documentType.replaceAll("_", " ")} · ending in ****{verification.documentLast4}
            </p>
          )}
          {verification?.reviewedAt && (
            <p className="field-note">Last reviewed {formatDate(verification.reviewedAt)}</p>
          )}
          {canSubmit && (
            <form className="form-stack identity-verification-form" onSubmit={submit}>
              <h3>{verification.status === "rejected" ? "Resubmit details" : "Submit your details"}</h3>
              <Field
                label="Legal name"
                required
                minLength="2"
                maxLength="120"
                autoComplete="name"
                value={form.legalName}
                onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))}
              />
              <SelectField
                label="Identity document type"
                value={form.documentType}
                onChange={(event) => setForm((current) => ({ ...current, documentType: event.target.value }))}
              >
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="driver_license">Driver license</option>
              </SelectField>
              <Field
                label="Last four characters only"
                required
                minLength="4"
                maxLength="4"
                pattern="[A-Za-z0-9]{4}"
                autoComplete="off"
                value={form.documentLast4}
                onChange={(event) => setForm((current) => ({ ...current, documentLast4: event.target.value }))}
              />
              <Notice type="info">
                This app has no secure document-upload service. Do not enter a full ID number or upload a document; only the last four characters are stored for manual review.
              </Notice>
              <Button type="submit" disabled={busy}>
                {busy ? "Submitting..." : "Submit for review"}
              </Button>
            </form>
          )}
          {!canSubmit && verification?.status !== "pending" && verification?.status !== "verified" && (
            <Button type="button" variant="outline" onClick={load}>Refresh status</Button>
          )}
        </>
      )}
    </Panel>
  );
};

export default IdentityVerificationPanel;
