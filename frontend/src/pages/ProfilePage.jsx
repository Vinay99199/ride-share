import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/auth";
import { errorMessage } from "../api/client";
import { organizationsApi } from "../api/organizations";
import { ratingsApi } from "../api/ratings";
import { usersApi } from "../api/users";
import LocationPicker from "../components/LocationPicker";
import ReviewCard from "../components/ReviewCard";
import IdentityVerificationPanel from "../components/IdentityVerificationPanel";
import {
  Button,
  EmptyState,
  Field,
  Notice,
  PageHeading,
  Panel,
  Spinner,
  Stars,
  Status,
} from "../components/UI";
import { OrganizationLogo, UserAvatar } from "../components/VisualAssets";
import { useAuth, userId } from "../context/AuthContext";

const ProfilePage = () => {
  const { user, installSession, updateUser } = useAuth();
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    homeLocation: null,
  });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);

  useEffect(() => {
    const coordinates = user?.homeLocation?.coordinates;
    setProfileForm({
      name: user?.name || "",
      phone: user?.phone || "",
      homeLocation:
        Array.isArray(coordinates) && coordinates.length === 2
          ? {
              coordinates,
              name: user?.homeLocationName || "",
              address: user?.homeAddress || "",
            }
          : null,
    });
  }, [
    user?._id,
    user?.name,
    user?.phone,
    user?.homeLocation,
    user?.homeLocationName,
    user?.homeAddress,
  ]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    Promise.allSettled([
      ratingsApi.forUser(userId(user)),
      organizationsApi.mine(),
      authApi.emailChangeStatus(),
    ])
      .then(([ratingsResult, organizationResult, emailResult]) => {
        if (!active) return;
        const failures = [];
        if (ratingsResult.status === "fulfilled") {
          setSummary({ ...user, ...ratingsResult.value });
          setReviews(ratingsResult.value.reviews || []);
        } else {
          failures.push(errorMessage(ratingsResult.reason));
        }
        if (organizationResult.status === "fulfilled") {
          setOrganizations(
            organizationResult.value.organizations ||
              (organizationResult.value.organization
                ? [organizationResult.value.organization]
                : [])
          );
        } else {
          failures.push(errorMessage(organizationResult.reason));
        }
        if (emailResult.status === "fulfilled") {
          setPendingEmail(emailResult.value.pendingEmail);
        } else {
          failures.push(errorMessage(emailResult.reason));
        }
        if (failures.length) setLoadError(failures.join(" "));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    const coordinates = profileForm.homeLocation?.coordinates;
    const homeLocation = coordinates
      ? { type: "Point", coordinates }
      : null;

    setProfileSaving(true);
    try {
      const updatedUser = await usersApi.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        homeLocation,
        homeLocationName: profileForm.homeLocation?.name || "",
        homeAddress: profileForm.homeLocation?.address || "",
      });
      updateUser(updatedUser);
      setProfileSuccess("Profile details updated.");
    } catch (requestError) {
      setProfileError(errorMessage(requestError));
    } finally {
      setProfileSaving(false);
    }
  };

  const requestEmailOtp = async (event) => {
    event.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    setEmailBusy(true);
    try {
      const result = await authApi.requestEmailChange({ email: newEmail });
      setPendingEmail(result.pendingEmail);
      setEmailOtp("");
      setEmailSuccess(result.message);
    } catch (requestError) {
      setEmailError(errorMessage(requestError));
    } finally {
      setEmailBusy(false);
    }
  };

  const confirmEmailOtp = async (event) => {
    event.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    setEmailBusy(true);
    try {
      const result = await authApi.confirmEmailChange({ otp: emailOtp });
      installSession(result, { skipValidation: true });
      setPendingEmail(null);
      setNewEmail("");
      setEmailOtp("");
      setEmailSuccess(result.message);
    } catch (requestError) {
      setEmailError(errorMessage(requestError));
    } finally {
      setEmailBusy(false);
    }
  };

  const ratingAverage = summary?.ratingAverage ?? user?.rating ?? 0;
  const reviewCount = summary?.reviewCount ?? user?.ratingCount ?? 0;

  return (
    <div className="page">
      <PageHeading
        eyebrow="ACCOUNT"
        title="Your profile"
        description="Manage your account details, security and community reputation."
        action={<Link className="button button-outline" to="/settings">Settings</Link>}
      />
      {loadError && <Notice>{loadError}</Notice>}
      {loading ? <Spinner label="Loading your profile..." /> : (
        <div className="profile-workspace">
          <div className="content-grid profile-grid">
            <Panel className="profile-card">
              <div className="profile-identity">
                <UserAvatar name={user?.name} size="large" />
                <div><h2>{user?.name}</h2><p>{user?.email}</p></div>
              </div>
              <div className="profile-rating">
                <Stars value={ratingAverage} />
                <span>{reviewCount} received reviews</span>
              </div>
              <div className="profile-facts">
                <div><span>Account role</span><b>{user?.role || "user"}</b></div>
                <div><span>Email verification</span><Status value={user?.isEmailVerified ? "verified" : "pending"} /></div>
                <div><span>Identity verification</span><Status value={user?.verificationStatus || "pending"} /></div>
              </div>
              <form className="form-stack profile-edit-form" onSubmit={saveProfile}>
                <h3>Profile details</h3>
                {profileError && <Notice>{profileError}</Notice>}
                {profileSuccess && <Notice type="success">{profileSuccess}</Notice>}
                <Field
                  label="Full name"
                  autoComplete="name"
                  required
                  maxLength={120}
                  value={profileForm.name}
                  onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                />
                <Field
                  label="Phone number"
                  type="tel"
                  autoComplete="tel"
                  required
                  minLength={3}
                  maxLength={30}
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
                />
                <LocationPicker
                  label="Home location"
                  value={profileForm.homeLocation}
                  onChange={(homeLocation) =>
                    setProfileForm((current) => ({ ...current, homeLocation }))
                  }
                />
                <Button type="submit" disabled={profileSaving}>
                  {profileSaving ? "Saving..." : "Save profile"}
                </Button>
              </form>
            </Panel>

            <Panel title="Organization">
              {organizations.length ? (
                <div className="organization-profile-list">
                  {organizations.map((organization) => (
                    <div className="organization-profile" key={organization._id}>
                      <div className="organization-profile-heading">
                        <OrganizationLogo
                          name={organization.name}
                          shortName={organization.shortName}
                        />
                        <strong>{organization.name}</strong>
                      </div>
                      <div className="profile-facts">
                        <div><span>Name</span><b>{organization.name}</b></div>
                        <div><span>Type</span><b>{organization.type}</b></div>
                        <div><span>Status</span><Status value={organization.isActive ? "active" : "inactive"} /></div>
                        <div><span>Members</span><b>{organization.memberCount ?? 0}</b></div>
                        <div><span>Allowed email domains</span><b>{organization.allowedDomains?.join(", ") || "Not available"}</b></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState illustration="campus" title="No organization details" description="This account is not associated with an organization record." />
              )}
            </Panel>
          </div>

          <Panel title="Account services" className="account-services-panel">
            <p className="field-note">These services will appear when their authenticated backend integrations are available. No local or placeholder financial data is stored.</p>
            <div className="account-service-list">
              <div className="account-service-row">
                <div>
                  <strong>Saved places and favourites</strong>
                  <p>Saved-address and favourite-location persistence is not configured.</p>
                </div>
                <Status value="unavailable" />
              </div>
              <div className="account-service-row">
                <div>
                  <strong>Wallet and payment methods</strong>
                  <p>No wallet ledger or payment gateway is connected. AVONEX will not accept or simulate payments here.</p>
                </div>
                <Status value="unavailable" />
              </div>
              <div className="account-service-row">
                <div>
                  <strong>Offers and promo codes</strong>
                  <p>There is no offers service to verify eligibility, discounts, or validity.</p>
                </div>
                <Status value="unavailable" />
              </div>
            </div>
          </Panel>

          <div className="content-grid profile-settings-grid">
            <Panel title="Change email address">
              <p className="field-note">A code is sent to the new address. Your current email remains active until that code is verified.</p>
              {emailError && <Notice>{emailError}</Notice>}
              {emailSuccess && <Notice type="success">{emailSuccess}</Notice>}
              {pendingEmail ? (
                <form className="form-stack" onSubmit={confirmEmailOtp}>
                  <p className="muted">Verification is pending for <b>{pendingEmail}</b>.</p>
                  <Field
                    label="Email verification code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    value={emailOtp}
                    onChange={(event) => setEmailOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                  <Button type="submit" disabled={emailBusy || emailOtp.length !== 6}>
                    {emailBusy ? "Verifying..." : "Verify new email"}
                  </Button>
                </form>
              ) : (
                <form className="form-stack" onSubmit={requestEmailOtp}>
                  <Field
                    label="New email address"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                  />
                  <Button type="submit" disabled={emailBusy}>
                    {emailBusy ? "Sending code..." : "Send verification code"}
                  </Button>
                </form>
              )}
            </Panel>

          </div>

          <IdentityVerificationPanel />
          <Panel title="Received reviews">
            {reviews.length ? (
              <div className="review-list">
                {reviews.map((review) => <ReviewCard key={review._id} review={review} />)}
              </div>
            ) : (
              <EmptyState illustration="bookings" title="No reviews yet" description="Completed rides and thoughtful reviews build your community rating." />
            )}
          </Panel>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
