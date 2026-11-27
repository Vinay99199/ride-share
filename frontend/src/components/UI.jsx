import { Children, cloneElement, isValidElement } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate as formatLocaleDate } from "../i18n";
import { translateStaticCopy } from "../i18n/staticCopy";
import {
  Illustration,
  PhotoImage,
  UserAvatar,
  VehicleVisual,
} from "./VisualAssets";

export const PageHeading = ({ eyebrow, title, description, action, illustration }) => {
  const { t } = useTranslation();
  return (
    <div className={`page-heading ${illustration ? "page-heading-visual" : ""}`}>
      <div>
        {eyebrow && <span className="eyebrow">{translateStaticCopy(t, eyebrow)}</span>}
        <h1>{translateStaticCopy(t, title)}</h1>
        {description && <p>{translateStaticCopy(t, description)}</p>}
      </div>
      {illustration && (
        <Illustration
          kind={illustration}
          className="page-heading-illustration"
          decorative
        />
      )}
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
};

export const PhotoHero = ({
  image,
  eyebrow,
  title,
  description,
  action,
  note,
  className = "",
}) => {
  const { t } = useTranslation();
  return (
  <section className={`photo-hero ${className}`.trim()}>
    <PhotoImage
      kind={image}
      className="photo-hero-image"
      priority
      decorative
    />
    <div className="photo-hero-shade" aria-hidden="true" />
    <div className="photo-hero-copy">
      {eyebrow && <span className="eyebrow">{translateStaticCopy(t, eyebrow)}</span>}
      <h1>{translateStaticCopy(t, title)}</h1>
      {description && <p>{translateStaticCopy(t, description)}</p>}
    </div>
    {action && <div className="photo-hero-action">{action}</div>}
    {note && <span className="photo-hero-note">{note}</span>}
  </section>
  );
};

export const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const { t } = useTranslation();
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {translateStaticCopy(t, children)}
    </button>
  );
};

export const Notice = ({ type = "error", children, onClose }) => {
  if (!children) return null;
  return (
    <div className={`notice notice-${type}`} role={type === "error" ? "alert" : "status"}>
      <span>{children}</span>
      {onClose && (
        <button className="notice-close" type="button" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
};

export const Spinner = ({ label = "Loading..." }) => {
  const { t } = useTranslation();
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      <span>{translateStaticCopy(t, label)}</span>
    </div>
  );
};

export const EmptyState = ({
  title,
  description,
  action,
  illustration = "rides",
}) => {
  const { t } = useTranslation();
  return (
  <div className="empty-state">
    <Illustration
      kind={illustration}
      className="empty-state-illustration"
      decorative
    />
    <h3>{translateStaticCopy(t, title)}</h3>
    {description && <p>{translateStaticCopy(t, description)}</p>}
    {action}
  </div>
  );
};

export const Status = ({ value }) => {
  const { t } = useTranslation();
  const status = String(value || "unknown");
  const normalized = status.toLowerCase();
  const translatableStatuses = new Set([
    "active", "inactive", "pending", "approved", "verified", "rejected",
    "confirmed", "cancelled", "completed", "reviewed", "resolved",
  ]);
  return (
    <span className={`status status-${normalized}`}>
      {translatableStatuses.has(normalized)
        ? t(`common.ui.options.${normalized}`)
        : status.replaceAll("_", " ")}
    </span>
  );
};

export const Stars = ({ value = 0 }) => (
  <span className="stars" aria-label={`${Number(value).toFixed(1)} out of 5`}>
    <span aria-hidden="true">★★★★★</span>
    <b>{Number(value || 0).toFixed(1)}</b>
  </span>
);

export const Panel = ({ title, action, children, className = "" }) => {
  const { t } = useTranslation();
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-heading">
          {title && <h2>{translateStaticCopy(t, title)}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
};

const FIELD_LABEL_KEYS = {
  "Email address": "emailAddress",
  Password: "password",
  "Full name": "fullName",
  "Phone number": "phoneNumber",
  Message: "message",
  "Organization name": "organizationName",
  "Organization type": "organizationType",
  "Website (optional)": "websiteOptional",
  "Identity document type": "identityDocumentType",
  "Vehicle type": "vehicleType",
  "Booking status": "bookingStatus",
  "Booking date": "bookingDate",
  "Issue category": "issueCategory",
  "Departure date": "departureDate",
  "Seats needed": "seatsNeeded",
  "Max price / seat": "maxPricePerSeat",
  "Search radius (km)": "searchRadiusKm",
  "Sort by": "sortBy",
  "Departure time": "departureTime",
  "Total seats": "totalSeats",
  "Price per seat": "pricePerSeat",
  "Departure from": "departureFrom",
  "Departure through": "departureThrough",
  "Sort rides": "sortRides",
  Seats: "seats",
  Role: "role",
  "Identity status": "identityStatus",
  "Account status": "accountStatus",
  Status: "status",
  City: "city",
  State: "state",
  Country: "country",
  "User ID": "userId",
  "Ride ID": "rideId",
  "Completed booking ID": "completedBookingId",
  "Short name (optional)": "shortNameOptional",
  "Last four characters only": "lastFourCharactersOnly",
  "Driving licence number": "drivingLicenceNumber",
  "Vehicle registration number": "vehicleRegistrationNumber",
  "Search name, email or phone": "searchNameEmailPhone",
  "Search name, city or domain": "searchNameCityDomain",
};

const getTranslatedFieldLabel = (label, t) => {
  const key = FIELD_LABEL_KEYS[label];
  return key ? t(`forms.labels.${key}`) : translateStaticCopy(t, label);
};

export const Field = ({ label, hint, ...props }) => {
  const { t } = useTranslation();
  const translatedLabel = getTranslatedFieldLabel(label, t);
  const translatedHint = translateStaticCopy(t, hint);
  const translatedProps = {
    ...props,
    ...(typeof props.placeholder === "string"
      ? { placeholder: translateStaticCopy(t, props.placeholder) }
      : {}),
    ...(typeof props.title === "string" ? { title: translateStaticCopy(t, props.title) } : {}),
  };
  return (
    <label className="field">
      <span>{translatedLabel}</span>
      <input {...translatedProps} />
      {translatedHint && <small>{translatedHint}</small>}
    </label>
  );
};

export const SelectField = ({ label, children, ...props }) => {
  const { t } = useTranslation();
  const translatedLabel = getTranslatedFieldLabel(label, t);
  const staticOptionValues = new Set([
    "", "all", "user", "passenger", "driver", "organizationAdmin", "superAdmin",
    "pending", "approved", "verified", "rejected", "confirmed", "cancelled", "completed",
    "reviewed", "resolved", "true", "false", "upcoming", "newest", "oldest", "read",
    "unread", "college", "university", "institute", "company", "institution", "school",
    "other", "passport", "national_id", "driver_license", "car", "bike", "departure",
    "price_asc", "price_desc", "distance", "departure_asc", "departure_desc",
    "created_desc", "created_asc", "safety", "behavior", "payment",
  ]);
  const translateStaticOptions = (options) =>
    Children.map(options, (option) => {
      if (!isValidElement(option)) return option;
      if (option.type === "option") {
        const label = option.props.children;
        if (
          staticOptionValues.has(String(option.props.value ?? "")) &&
          typeof label === "string"
        ) {
          const translatedLabel = translateStaticCopy(t, label);
          if (translatedLabel !== label) return cloneElement(option, {}, translatedLabel);
        }
        return option;
      }
      if (option.props.children) {
        return cloneElement(option, {}, translateStaticOptions(option.props.children));
      }
      return option;
    });
  return (
    <label className="field">
      <span>{translatedLabel}</span>
      <select
        {...props}
        {...(typeof props.title === "string" ? { title: translateStaticCopy(t, props.title) } : {})}
      >
        {translateStaticOptions(children)}
      </select>
    </label>
  );
};

export const HistoryTabs = ({ value, onChange, label = "Ride history views" }) => (
  <div className="ride-history-tabs" role="group" aria-label={label}>
    {[
      { value: "upcoming", label: "Upcoming" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ].map((tab) => (
      <button
        className={`ride-history-tab ${value === tab.value ? "active" : ""}`}
        type="button"
        key={tab.value}
        aria-pressed={value === tab.value}
        onClick={() => onChange(tab.value)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export const VehicleTypeSelector = ({
  label = "Vehicle type",
  name = "vehicleType",
  value = "",
  onChange,
}) => (
  <fieldset className="vehicle-selector">
    <legend>{label}</legend>
    <div className="vehicle-option-grid">
      {[
        { value: "", title: "Any vehicle", detail: "All shared rides", icon: "any" },
        { value: "car", title: "Car", detail: "Carpool seats", icon: "car" },
        { value: "bike", title: "Bike", detail: "Motorbike seats", icon: "bike" },
      ].map((option) => (
        <label className="vehicle-option" key={option.value || "any"}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
          />
          <span className="vehicle-option-card">
            <span className={`vehicle-option-icon vehicle-icon-${option.icon}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {option.icon === "bike" ? (
                  <>
                    <circle cx="6" cy="17" r="3" />
                    <circle cx="18" cy="17" r="3" />
                    <path d="m6 17 4-7h4l4 7m-8-7 4 7h-5m3-10h3" />
                  </>
                ) : option.icon === "car" ? (
                  <>
                    <path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
                    <path d="M4 11h16l1 3v5h-3v-2H6v2H3v-5l1-3Z" />
                    <path d="M7 14h.01M17 14h.01" />
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="8" />
                    <path d="M4 12h16M12 4c2.4 2.2 3.5 4.9 3.5 8S14.4 17.8 12 20M12 4c-2.4 2.2-3.5 4.9-3.5 8S9.6 17.8 12 20" />
                  </>
                )}
              </svg>
            </span>
            <span className="vehicle-option-copy">
              <strong>{option.title}</strong>
              <small>{option.detail}</small>
            </span>
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);

export const RideCard = ({ ride }) => (
  <article className="ride-card">
    <div className="ride-card-top">
      <div className="route-points">
        <span className="route-dot" />
        <span className="route-line" />
        <span className="route-dot route-dot-end" />
      </div>
      <div className="route-labels">
        <strong>{rideLocation(ride, "pickup")}</strong>
        <span>{rideLocation(ride, "drop")}</span>
      </div>
      <span className="ride-price">{Number(ride.pricePerSeat).toFixed(2)}<small>/seat</small></span>
    </div>
    <div className="ride-card-meta">
      <span>{formatDate(ride.departureTime)}</span>
      <span>{ride.availableSeats} seats left</span>
      <span className="ride-vehicle-type"><VehicleVisual type={ride.vehicleType} />{ride.vehicleType}</span>
      {Number.isFinite(ride.pickupDistanceKm) && (
        <span>{ride.pickupDistanceKm.toFixed(1)} km away</span>
      )}
      <Status value={ride.status} />
    </div>
    <div className="ride-card-bottom">
      <span className="driver-line">
        <UserAvatar name={ride.driver?.name} size="small" />
        {ride.driver?._id ? (
          <Link className="driver-profile-link" to={`/drivers/${ride.driver._id}/reviews`}>
            {ride.driver.name || "Driver"}
          </Link>
        ) : (
          ride.driver?.name || "Driver"
        )}
        {ride.driver?.rating !== undefined && <Stars value={ride.driver.rating} />}
        {Number.isFinite(ride.driver?.ratingCount) && (
          <small className="driver-review-count">
            {ride.driver.ratingCount} review{ride.driver.ratingCount === 1 ? "" : "s"}
          </small>
        )}
      </span>
      <Link className="button button-outline button-small" to={`/rides/${ride._id}`}>
        View ride details
      </Link>
    </div>
  </article>
);

export const formatDate = (value) => {
  if (!value) return "Time not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time not available"
    : formatLocaleDate(date, { dateStyle: "medium", timeStyle: "short" });
};

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "A";

export const rideLocation = (ride, kind) =>
  ride?.[`${kind}Address`] ||
  ride?.[`${kind}LocationName`] ||
  (kind === "pickup" ? "Pickup location" : "Drop-off location");
