import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth";
import { errorMessage } from "../api/client";
import { organizationsApi } from "../api/organizations";
import { useAuth } from "../context/AuthContext";
import { Button, Field, Notice, SelectField } from "../components/UI";
import LocationPicker from "../components/LocationPicker";
import { Illustration, PhotoImage } from "../components/VisualAssets";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

const AuthShell = ({
  eyebrow,
  title,
  caption,
  children,
  footnote,
  photo = "carpool",
}) => (
  <main className="auth-page">
    <div className="auth-story">
      <Link to="/login" className="brand brand-light">
        <span className="brand-mark">A</span>
        <span>AVONEX<small>SMART MOBILITY</small></span>
      </Link>
      <div className="auth-story-copy">
        <span className="eyebrow eyebrow-light">MOVE WITH YOUR COMMUNITY</span>
        <h1>Good journeys<br />are shared.</h1>
        <p>Find a seat, meet your people, and make every trip count.</p>
        <div className="auth-route-decoration"><i /><i /><i /></div>
      </div>
      {photo ? (
        <PhotoImage
          kind={photo}
          className="auth-hero-photo"
          priority
          decorative
        />
      ) : (
        <Illustration
          kind="mobility"
          className="auth-hero-illustration"
          priority
          decorative
        />
      )}
      <span className="auth-story-foot">Designed for the journeys that bring us together.</span>
    </div>
    <section className="auth-panel">
      <div className="auth-language-switcher"><LanguageSwitcher /></div>
      <div className="auth-card">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p className="auth-caption">{caption}</p>
        {children}
        {footnote && <div className="auth-footnote">{footnote}</div>}
      </div>
    </section>
  </main>
);

export const LoginPage = () => {
  const { t } = useTranslation();
  const { login, logoutWarning, clearLogoutWarning, authNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form);
      navigate(location.state?.from || "/", { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow={t("auth.welcomeBack")}
      title={t("auth.signIn")}
      caption="Your next shared journey is just around the corner."
      footnote={<>{t("auth.newToCommunity")} <Link to="/register">{t("auth.createAccount")}</Link></>}
    >
      <form className="form-stack" onSubmit={submit}>
        <Notice type="info" onClose={clearLogoutWarning}>{logoutWarning}</Notice>
        <Notice type="info">{authNotice}</Notice>
        <Notice>{error}</Notice>
        <Field
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <Field
          label={t("auth.password")}
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <Button type="submit" disabled={busy}>
          {busy ? t("auth.signingIn") : t("auth.signIn")} <span aria-hidden="true">→</span>
        </Button>
      </form>
    </AuthShell>
  );
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    organization: "",
    legalName: "",
    documentType: "passport",
    documentLast4: "",
    licenseNumber: "",
    vehicleNumber: "",
    vehicleType: "car",
    organizationName: "",
    organizationType: "college",
    address: "",
    website: "",
    registrationNumber: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [organizationsError, setOrganizationsError] = useState("");

  useEffect(() => {
    let active = true;
    organizationsApi.list({ limit: 100 })
      .then((result) => {
        if (active) setOrganizations(result.organizations || []);
      })
      .catch((requestError) => {
        if (active) setOrganizationsError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setOrganizationsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const organizationLabel = (organization) => {
    const shortName =
      organization.shortName &&
      !organization.name.toLowerCase().includes(organization.shortName.toLowerCase())
        ? ` (${organization.shortName})`
        : "";
    const city =
      typeof organization.city === "string" && organization.city.trim()
        ? organization.city.trim()
        : "City not listed";
    const domainStatus = {
      verified: "institutional email verified",
      pending: "email domain pending",
      rejected: "email domain rejected",
    }[organization.domainVerificationStatus] || "domain status unavailable";
    return `${organization.name}${shortName} · ${city} · ${domainStatus}`;
  };
  const selectedOrganization = organizations.find(
    (organization) => organization._id === form.organization
  );

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {
        role: selectedRole,
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        ...(selectedRole === "organization"
          ? {
              organizationName: form.organizationName,
              organizationType: form.organizationType,
              address: form.address,
              website: form.website,
              registrationNumber: form.registrationNumber,
            }
          : {
              organization: form.organization,
              identityVerification: {
                legalName: form.legalName,
                documentType: form.documentType,
                documentLast4: form.documentLast4,
              },
            }),
        ...(selectedRole === "driver"
          ? {
              licenseNumber: form.licenseNumber,
              vehicleNumber: form.vehicleNumber,
              vehicleType: form.vehicleType,
            }
          : {}),
      };
      const result = await authApi.register(body);
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, {
        state: { message: result.message, role: selectedRole },
      });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="JOIN THE NETWORK"
      photo={!selectedRole
        ? "carpool"
        : selectedRole === "passenger"
          ? "passenger"
          : selectedRole === "driver"
            ? "driver"
            : "campusLife"}
      title={selectedRole ? "Create your account" : "Choose how you’ll use AVONEX"}
      caption={selectedRole
        ? "Your role and verification workflow are kept separate from account approval."
        : "Select the account type that best fits your community travel needs."}
      footnote={<>Already registered? <Link to="/login">Sign in</Link></>}
    >
      {!selectedRole ? (
        <div className="role-card-grid" aria-label="Select an account type">
          {[
            ["passenger", "Passenger", "Find and book shared rides in your community."],
            ["driver", "Driver", "Offer seats after your driver application is approved."],
            ["organization", "Organization", "Register a college, university, company, or institution."],
          ].map(([role, title, description]) => (
            <button
              className="role-card"
              type="button"
              key={role}
              onClick={() => setSelectedRole(role)}
            >
              <span className="role-card-mark" aria-hidden="true">
                {role === "passenger" ? "P" : role === "driver" ? "D" : "O"}
              </span>
              <strong>{title}</strong>
              <span>{description}</span>
              <b aria-hidden="true">→</b>
            </button>
          ))}
          <p className="field-note">
            Admin and SuperAdmin access can only be assigned through an authorized, audited process.
          </p>
        </div>
      ) : (
      <form className="form-stack" onSubmit={submit}>
        <button className="text-button" type="button" onClick={() => setSelectedRole("")}>
          ← Choose a different account type
        </button>
        <span className="selected-role-label">
          {selectedRole === "organization"
            ? "Organization account"
            : selectedRole === "driver"
              ? "Driver account"
              : "Passenger account"}
        </span>
        <Notice>{error}</Notice>
        <Field
          label={selectedRole === "organization" ? "Contact person name" : "Full name"}
          autoComplete="name"
          required
          maxLength={120}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <div className="form-row">
          <Field label="Email address" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Field label="Phone number" type="tel" autoComplete="tel" required minLength={3} maxLength={30} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}"
          title="Use 8+ characters with uppercase, lowercase, a number, and one of @$!%*?&."
          hint="8+ characters, upper and lower case, a number and a symbol."
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {selectedRole === "organization" ? (
          <>
            <Field label="Organization name" required minLength={2} maxLength={120} value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} />
            <SelectField label="Organization type" required value={form.organizationType} onChange={(e) => setForm({ ...form, organizationType: e.target.value })}>
              <option value="college">College</option>
              <option value="university">University</option>
              <option value="institute">Institute</option>
              <option value="company">Company</option>
              <option value="institution">Institution</option>
              <option value="other">Other</option>
            </SelectField>
            <LocationPicker
              label="Organization address"
              required
              initialQuery={form.address}
              onChange={(location) =>
                setForm((current) => ({
                  ...current,
                  address: location?.address || "",
                }))
              }
            />
            <Field label="Website (optional)" type="url" maxLength={2048} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Field label="Organization registration / verification number" required minLength={2} maxLength={120} value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
            <Notice type="info">
              Organization accounts require platform approval. Registration does not grant organization-admin permissions.
            </Notice>
          </>
        ) : (
          <>
            {organizationsError && <Notice>{`Organizations could not be loaded: ${organizationsError}`}</Notice>}
            {organizations.length === 0 && !organizationsLoading && !organizationsError && (
              <Notice type="info">No active organizations are currently listed.</Notice>
            )}
            <Field
              label="Organization"
              required
              list="organization-options"
              autoComplete="off"
              value={organizationSearch}
              disabled={organizationsLoading || organizations.length === 0}
              onChange={(event) => {
                const searchValue = event.target.value;
                const match = organizations.find(
                  (organization) => organizationLabel(organization) === searchValue
                );
                setOrganizationSearch(searchValue);
                setForm((current) => ({
                  ...current,
                  organization: match?._id || "",
                }));
              }}
              hint={organizationsLoading
                ? "Loading organizations..."
                : organizations.length
                  ? "Search by institution or city and select a result. Only a verified institutional email domain can register."
                  : "Organization options are unavailable."}
            />
            <datalist id="organization-options">
              {organizations.map((organization) => (
                <option
                  key={organization._id}
                  value={organizationLabel(organization)}
                />
              ))}
            </datalist>
            {selectedOrganization?.domainVerificationStatus === "pending" && (
              <Notice type="info">
                This organization is listed, but its official email domain is pending verification. Registration will be available after a SuperAdmin approves an institutional domain.
              </Notice>
            )}
            {selectedOrganization?.domainVerificationStatus === "rejected" && (
              <Notice type="info">
                This organization's institutional email domain was not approved.
              </Notice>
            )}
            {selectedOrganization &&
              !["verified", "pending", "rejected"].includes(
                selectedOrganization.domainVerificationStatus
              ) && (
                <Notice type="info">
                  This organization's email-domain verification status is unavailable. Please try again later.
                </Notice>
              )}
            <Field label="Legal name for identity verification" required minLength={2} maxLength={120} value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
            <div className="form-row">
              <SelectField label="Identity document type" required value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })}>
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="driver_license">Driving licence</option>
              </SelectField>
              <Field label="Last four characters only" required minLength={4} maxLength={4} pattern="[A-Za-z0-9]{4}" value={form.documentLast4} onChange={(e) => setForm({ ...form, documentLast4: e.target.value })} />
            </div>
            <Notice type="info">
              Identity review is separate from email verification and driver approval. Do not submit a full ID number or document image.
            </Notice>
            {selectedRole === "driver" && (
              <>
                <Field label="Driving licence number" required minLength={2} maxLength={120} autoComplete="off" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
                <div className="form-row">
                  <Field label="Vehicle registration number" required minLength={2} maxLength={30} value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
                  <SelectField label="Vehicle type" required value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                  </SelectField>
                </div>
                <Notice type="info">Your driver application starts as pending. Ride-management access is enabled only after approval.</Notice>
              </>
            )}
          </>
        )}
        <Button
          type="submit"
          disabled={
            busy ||
            (selectedRole !== "organization" &&
              (organizationsLoading ||
                organizations.length === 0 ||
                !form.organization))
          }
        >
          {busy ? "Creating account..." : "Create account"} <span aria-hidden="true">→</span>
        </Button>
      </form>
      )}
    </AuthShell>
  );
};

export const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get("email") || "");
  const [otp, setOtp] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await authApi.verifyEmail({ email, otp });
      setNotice(result.message);
      window.setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await authApi.resendOtp({ email });
      setNotice(result.message);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="ONE LAST STEP"
      title="Verify your email"
      caption="Enter the six-digit code sent to your inbox. It expires after ten minutes."
      footnote={<>Already verified? <Link to="/login">Sign in</Link></>}
      photo={null}
    >
      <form className="form-stack" onSubmit={verify}>
        <Notice>{error}</Notice>
        <Notice type="success">{notice}</Notice>
        <Field label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          label="Email verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <Button type="submit" disabled={busy || otp.length !== 6}>
          {busy ? "Verifying..." : "Verify email"}
        </Button>
        <button className="text-button centered" type="button" disabled={busy || !email} onClick={resend}>
          Resend code
        </button>
      </form>
    </AuthShell>
  );
};
