import { useState } from "react";
import mobilityHero from "../assets/illustrations/mobility-hero.svg";
import emptyRides from "../assets/illustrations/empty-rides.svg";
import emptyBookings from "../assets/illustrations/empty-bookings.svg";
import emptyNotifications from "../assets/illustrations/empty-notifications.svg";
import campus from "../assets/illustrations/campus.svg";
import verification from "../assets/illustrations/verification.svg";
import car from "../assets/vehicles/car.svg";
import bike from "../assets/vehicles/bike.svg";
import carpoolPhoto from "../assets/photography/auth-carpool.webp";
import passengerPhoto from "../assets/photography/passenger-city.webp";
import passengerJourneyPhoto from "../assets/photography/passenger-roadtrip.webp";
import driverPhoto from "../assets/photography/driver-commute.webp";
import campusPhoto from "../assets/photography/campus-community.webp";
import campusLifePhoto from "../assets/photography/campus-life.webp";

const illustrations = {
  mobility: { src: mobilityHero, alt: "A shared car journey through a connected city" },
  rides: { src: emptyRides, alt: "A car between two route points" },
  bookings: { src: emptyBookings, alt: "A ride booking with a pickup and destination" },
  notifications: { src: emptyNotifications, alt: "A notification bell" },
  campus: { src: campus, alt: "A university campus building" },
  verification: { src: verification, alt: "A verified identity document" },
};

const photographs = {
  carpool: {
    src: carpoolPhoto,
    alt: "A driver and passenger sharing a city car journey",
    fallback: "mobility",
  },
  passenger: {
    src: passengerPhoto,
    alt: "Friends travelling together in a car",
    fallback: "mobility",
  },
  passengerJourney: {
    src: passengerJourneyPhoto,
    alt: "Passengers sharing a road trip",
    fallback: "mobility",
  },
  driver: {
    src: driverPhoto,
    alt: "A professional driver at the wheel",
    fallback: "mobility",
  },
  campus: {
    src: campusPhoto,
    alt: "Students walking together on a campus",
    fallback: "campus",
  },
  campusLife: {
    src: campusLifePhoto,
    alt: "Students walking outside a university building",
    fallback: "campus",
  },
};

const initialsFrom = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "A";

export const Illustration = ({
  kind = "mobility",
  alt,
  className = "",
  priority = false,
  decorative = false,
}) => {
  const illustration = illustrations[kind] || illustrations.mobility;
  return (
    <img
      className={`avonex-illustration ${className}`.trim()}
      src={illustration.src}
      alt={decorative ? "" : alt || illustration.alt}
      aria-hidden={decorative ? "true" : undefined}
      loading={priority ? "eager" : "lazy"}
      fetchpriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
};

export const PhotoImage = ({
  kind = "carpool",
  alt,
  className = "",
  priority = false,
  decorative = false,
}) => {
  const [failedKind, setFailedKind] = useState("");
  const photograph = photographs[kind] || photographs.carpool;
  const fallback = illustrations[photograph.fallback] || illustrations.mobility;
  const failed = failedKind === kind;

  return (
    <img
      className={`avonex-photo ${className}`.trim()}
      src={failed ? fallback.src : photograph.src}
      alt={decorative ? "" : alt || photograph.alt}
      aria-hidden={decorative ? "true" : undefined}
      loading={priority ? "eager" : "lazy"}
      fetchpriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => setFailedKind(kind)}
    />
  );
};

export const UserAvatar = ({ name, className = "", size = "" }) => (
  <span
    className={`avatar ${size ? `avatar-${size}` : ""} ${className}`.trim()}
    role="img"
    aria-label={`${name || "Community member"} avatar`}
  >
    {initialsFrom(name)}
  </span>
);

export const OrganizationLogo = ({
  name,
  shortName,
  className = "",
}) => {
  const initials = shortName
    ? shortName.trim().slice(0, 3).toUpperCase()
    : initialsFrom(name);
  return (
    <span
      className={`organization-logo ${className}`.trim()}
      role="img"
      aria-label={`${name || "Organization"} logo placeholder`}
      title={name || "Organization"}
    >
      {initials}
    </span>
  );
};

export const VehicleVisual = ({ type = "car", className = "" }) => {
  const isBike = type === "bike";
  return (
    <img
      className={`vehicle-visual ${className}`.trim()}
      src={isBike ? bike : car}
      alt={isBike ? "Motorbike" : "Car"}
      loading="lazy"
      decoding="async"
    />
  );
};
