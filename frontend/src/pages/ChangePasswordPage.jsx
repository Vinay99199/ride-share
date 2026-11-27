import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/auth";
import { errorMessage } from "../api/client";
import { Button, Notice, PageHeading, Panel } from "../components/UI";
import { useAuth } from "../context/AuthContext";

const passwordRules = [
  { label: "At least 8 characters", test: (value) => value.length >= 8 },
  { label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "One number", test: (value) => /\d/.test(value) },
  { label: "One supported symbol (@$!%*?&)", test: (value) => /[@$!%*?&]/.test(value) },
];
const strongPassword =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const PasswordField = ({ label, value, onChange, autoComplete, visible, onToggle, ...inputProps }) => {
  const inputId = useId();
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <span className="password-input-wrap">
        <input
          {...inputProps}
          id={inputId}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
        />
        <button
          className="password-visibility-toggle"
          type="button"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={onToggle}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </span>
    </div>
  );
};

const ChangePasswordPage = () => {
  const { installSession } = useAuth();
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visible, setVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const checks = useMemo(
    () => passwordRules.map((rule) => ({ ...rule, valid: rule.test(values.newPassword) })),
    [values.newPassword]
  );
  const passwordValid = strongPassword.test(values.newPassword);
  const confirmationValid =
    values.confirmPassword.length > 0 &&
    values.confirmPassword === values.newPassword;

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setError("");
    setSuccess("");
  };
  const toggle = (field) =>
    setVisible((current) => ({ ...current, [field]: !current[field] }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!passwordValid) {
      setError("Choose a password that meets all the listed requirements.");
      return;
    }
    if (!confirmationValid) {
      setError("The password confirmation does not match.");
      return;
    }

    setBusy(true);
    try {
      const result = await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      installSession(result, { skipValidation: true });
      setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess(result.message);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <PageHeading
        eyebrow="SECURITY"
        title="Change password"
        description="Verify your current password before saving a new one."
        action={<Link className="button button-outline" to="/settings">All settings</Link>}
      />
      <Panel className="change-password-panel">
        <p className="field-note">Changing your password signs out other active sessions. Passwords are sent only to the authenticated password-change endpoint and are not saved in browser storage.</p>
        {error && <Notice>{error}</Notice>}
        {success && <Notice type="success">{success}</Notice>}
        <form className="form-stack" onSubmit={submit}>
          <PasswordField
            label="Current password"
            autoComplete="current-password"
            required
            value={values.currentPassword}
            onChange={update("currentPassword")}
            visible={visible.currentPassword}
            onToggle={() => toggle("currentPassword")}
          />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            required
            minLength={8}
            value={values.newPassword}
            onChange={update("newPassword")}
            visible={visible.newPassword}
            onToggle={() => toggle("newPassword")}
          />
          <ul className="password-requirements" aria-label="New password requirements">
            {checks.map((check) => (
              <li className={check.valid ? "valid" : ""} key={check.label}>
                <span aria-hidden="true">{check.valid ? "✓" : "•"}</span>
                {check.label}
              </li>
            ))}
          </ul>
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            required
            value={values.confirmPassword}
            onChange={update("confirmPassword")}
            visible={visible.confirmPassword}
            onToggle={() => toggle("confirmPassword")}
            aria-invalid={values.confirmPassword.length > 0 && !confirmationValid}
          />
          {values.confirmPassword.length > 0 && (
            <p className={`password-match ${confirmationValid ? "valid" : ""}`} role="status">
              {confirmationValid ? "Passwords match." : "Passwords do not match."}
            </p>
          )}
          <Button type="submit" disabled={busy || !values.currentPassword || !passwordValid || !confirmationValid}>
            {busy ? "Updating password..." : "Save new password"}
          </Button>
        </form>
      </Panel>
    </div>
  );
};

export default ChangePasswordPage;
