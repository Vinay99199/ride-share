import { Link } from "react-router-dom";
import { EmptyState, Notice, PageHeading, Panel, PhotoHero } from "../components/UI";
import { useAuth } from "../context/AuthContext";

export const ReferralPage = () => (
  <div className="page">
    <PageHeading
      eyebrow="COMMUNITY"
      title="Refer & earn"
      description="Invite people into your verified carpooling community."
    />
    <Panel title="Referral program">
      <Notice type="info">
        Referrals are not active in AVONEX yet. There is no backend referral code, invitation tracking, reward history, or reward ledger, so no code or earnings can be generated or shared.
      </Notice>
      <p className="field-note">
        A real referral program needs server-issued codes, eligibility checks, invite attribution, and backend-controlled reward accounting.
      </p>
    </Panel>
  </div>
);

export const AboutPage = () => (
  <div className="page">
    <PhotoHero
      image="campusLife"
      className="about-photo-hero"
      eyebrow="ABOUT"
      title="Shared journeys, built for communities."
      description="AVONEX is a verified carpooling platform for employees, students, and institutions."
      note="Illustrative campus photography"
    />
    <Panel className="about-brand-panel">
      <span className="about-brand-mark" aria-hidden="true">A</span>
      <div>
        <span className="eyebrow">AVONEX · SMART MOBILITY</span>
        <h2>Make everyday travel a shared effort.</h2>
        <p>
          AVONEX connects passengers looking for a seat with approved drivers offering space on a journey. Organization-based communities help people find relevant shared rides, request seats, and coordinate their travel.
        </p>
      </div>
    </Panel>
    <div className="content-grid about-grid">
      <Panel title="Our mission">
        <p>Make community carpooling more convenient by helping passengers and approved drivers discover and coordinate shared journeys.</p>
      </Panel>
      <Panel title="Our vision">
        <p>Support more efficient transportation through trusted, community-based ride sharing for workplaces, campuses, and institutions.</p>
      </Panel>
      <Panel title="How AVONEX works">
        <ul className="about-feature-list">
          <li>Members search for a ride and request available seats.</li>
          <li>Approved drivers publish journeys and review booking requests.</li>
          <li>Booking, ride status, reviews, and authorized live tracking are managed through the platform.</li>
        </ul>
      </Panel>
      <Panel title="Verified communities">
        <p>Organization membership and driver applications are reviewed through the platform's existing approval workflows. Verification status and available actions depend on the account and organization.</p>
      </Panel>
    </div>
    <p className="field-note">No company address, registration details, support contact, or app version is published in the current configuration.</p>
  </div>
);

export const PrivacyPolicyPage = () => (
  <div className="page privacy-page">
    <PageHeading
      eyebrow="PRIVACY"
      title="Privacy policy"
      description="A plain-language summary of data handled by the current AVONEX application."
    />
    <Notice type="warning">
      Draft for legal and operational review. This is not an approved legal policy. Confirm all practices, vendors, retention periods, and user rights before publishing it as official policy.
    </Notice>
    <Panel className="privacy-content">
      <p className="privacy-updated">Draft based on the current application implementation.</p>
      <section>
        <h2>Information collected</h2>
        <p>Account records include name, email address, phone number, role, organization association, email-verification state, and account status. The profile may also include a home-location point. AVONEX does not expose a profile-photo upload field in the current account model.</p>
      </section>
      <section>
        <h2>Driver and identity verification</h2>
        <p>Driver applications include license and vehicle details needed for approval. Identity-verification records can include a legal name, document type, the last four characters of a document identifier, review status, and review metadata. Application and verification information is handled through authenticated administrative workflows; this draft does not claim that these records are encrypted.</p>
      </section>
      <section>
        <h2>Location information</h2>
        <p>The map requests browser geolocation only after a user asks to use their current location. Users can search for places or select map points; coordinates are obtained automatically and are not entered manually. Place searches and selected map points are sent to OpenStreetMap Nominatim for geocoding, with search performed only after the user submits it. Home locations and ride pickup/drop-off points may be saved with readable place labels. Satellite imagery from Esri is the default map layer; users can switch to OpenStreetMap street tiles. The selected tile provider receives map-tile requests from the browser, and its terms and attribution requirements apply.</p>
        <p>When an approved driver shares live location for a ride, location records are associated with that ride and access is limited to authorized participants. Live-location records have an expiration timestamp configured in the database; this is not a guarantee of deletion at an exact time.</p>
      </section>
      <section>
        <h2>Rides, bookings, reviews, and reports</h2>
        <p>Ride records may include route coordinates, departure time, vehicle type, seats, and price per seat. Booking records link passengers to rides and contain booking status, seats requested, and server-calculated totals. Reviews, notifications, and issue reports are associated with relevant accounts or rides. Reports submitted through the current support flow must reference a booking the submitter participated in.</p>
      </section>
      <section>
        <h2>How information is used and shared</h2>
        <p>Information supports account access, organization and driver approval, ride search, booking, notifications, reviews, live tracking, and administrative review. Relevant ride details are shared with ride participants. Administrators receive access according to their platform or organization scope. The code does not define a marketing-use policy.</p>
      </section>
      <section>
        <h2>Security</h2>
        <p>Passwords are hashed by the authentication service. Protected endpoints authenticate requests and apply role, organization, or ride-participant checks where required. The browser currently keeps the authenticated session token in session storage. This description does not make a claim about encryption at rest or guarantee that every security risk is eliminated.</p>
      </section>
      <section>
        <h2>Retention and account choices</h2>
        <p>The application does not define a general retention schedule in its user-facing settings. Live-location records include an expiry configuration, while account, ride, booking, review, and report data may remain in the database. Users can update supported profile fields, change a verified email through the existing flow, or change their password. There is currently no self-service account-deletion endpoint.</p>
      </section>
      <section>
        <h2>Contact and policy updates</h2>
        <p>No official privacy contact is configured in the application. Ride participants can submit a report about an associated booking using Help & Support. A formal privacy contact, retention schedule, and process for data access or deletion requests must be established before this draft is approved.</p>
      </section>
    </Panel>
  </div>
);

export const ContactPage = () => (
  <div className="page">
    <PageHeading
      eyebrow="CONTACT"
      title="Contact AVONEX"
      description="Support channels are shown here only when they are officially configured."
    />
    <Panel title="Support contact unavailable">
      <Notice type="warning">
        No official support email address, phone number, office address, or contact-submission API is configured. This page cannot send a message, and it will not display a made-up contact or success confirmation.
      </Notice>
      <p className="field-note">For an issue tied to a ride you participated in, use the report action on that booking. Reports are submitted to the existing administrator review workflow.</p>
      <Link className="button button-outline" to="/bookings">Open ride history</Link>
    </Panel>
  </div>
);

export const DeleteAccountPage = () => (
  <div className="page">
    <PageHeading
      eyebrow="ACCOUNT CONTROL"
      title="Delete account"
      description="Account deletion must be handled by a verified backend workflow."
    />
    <Panel title="Self-service deletion is unavailable">
      <Notice type="warning">
        AVONEX does not currently provide an authenticated self-service account-deletion endpoint. No deletion request has been submitted, and this screen will not clear local data or pretend the account was deleted.
      </Notice>
      <h3>What a safe deletion flow must handle</h3>
      <ul className="about-feature-list">
        <li>Re-authenticate the account owner and revoke active sessions.</li>
        <li>Check for active rides and bookings and apply defined cancellation rules.</li>
        <li>Preserve or anonymize bookings, reviews, verification, reports, and audit records when required by policy.</li>
        <li>Handle driver and organization relationships without deleting another account's data.</li>
      </ul>
      <p className="field-note">A SuperAdmin or organization administrator can change account status in their authorized management workflows; that is not the same as user-requested deletion.</p>
    </Panel>
  </div>
);

const helpTopics = [
  {
    title: "Getting started",
    content: <>Create an account with an eligible organization address and complete email verification before signing in. Your available workspace depends on your role and approvals.</>,
  },
  {
    title: "Passenger guide",
    content: <>Search scheduled rides, select a ride, and request the number of seats you need. A booking remains subject to the driver's decision and the ride's available seats.</>,
    link: { to: "/rides", label: "Find a ride" },
    audience: "passenger",
  },
  {
    title: "Driver guide",
    content: <>Driver tools are available after the driver application is approved. Approved drivers can publish rides, review booking requests, and manage eligible trips.</>,
    link: { to: "/driver-application", label: "Driver application status" },
    audience: "driver",
  },
  {
    title: "Booking and cancellation",
    content: <>Check the booking and ride status in your history. Cancellation actions are available only when allowed by the ride and booking state; the server enforces the final decision.</>,
    link: { to: "/bookings", label: "Open ride history" },
    audience: "passenger",
  },
  {
    title: "Live ride tracking",
    content: <>Live location is available only for an active ride when the driver shares it. Access is limited to the approved ride owner and confirmed passengers.</>,
    link: { to: "/live-tracking", label: "Passenger tracking" },
    audience: "passenger",
  },
  {
    title: "Identity and driver verification",
    content: <>Verification and driver applications are reviewed through the platform's existing workflows. Review status and next steps appear in your profile or application page.</>,
    link: { to: "/profile", label: "Open profile" },
  },
  {
    title: "Safety and reporting",
    content: <>If someone is in immediate danger, contact local emergency services. To report a platform issue, open a booking you participated in and choose Report an issue. Administrators review submitted reports.</>,
    link: { to: "/bookings", label: "Find a booking to report" },
    audience: "passenger",
  },
  {
    title: "Payments and offers",
    content: <>AVONEX currently has no wallet, payment-gateway, or promo-code integration. Do not send payment credentials through a report or message.</>,
  },
];

export const HelpPage = () => {
  const { user, driverApplication } = useAuth();
  const canPassenger =
    ["user", "passenger"].includes(user?.role) ||
    (user?.role === "driver" && driverApplication?.status === "approved");
  const canDriverAccount = ["user", "driver"].includes(user?.role);
  const visibleTopics = helpTopics.filter((topic) =>
    topic.audience === "passenger"
      ? canPassenger
      : topic.audience === "driver"
        ? canDriverAccount
        : true
  );

  return (
    <div className="page">
      <PageHeading
        eyebrow="HELP CENTER"
        title="Help & support"
        description="Guidance for using AVONEX's verified carpooling features."
        action={<Link className="button button-outline" to="/contact">Contact options</Link>}
      />
      <Panel title="Common questions" className="help-faq-panel">
        <div className="help-faq-list">
          {visibleTopics.map((topic) => (
            <details className="help-faq" key={topic.title}>
              <summary>{topic.title}</summary>
              <div className="help-faq-answer">
                <p>{topic.content}</p>
                {topic.link && <Link className="text-link" to={topic.link.to}>{topic.link.label} →</Link>}
              </div>
            </details>
          ))}
        </div>
      </Panel>
      {canPassenger && (
        <Panel title="Report a ride issue">
          <p>Issue reports must be linked to a booking where you are the passenger or ride driver.</p>
          <Link className="button button-primary" to="/bookings">Open ride history</Link>
        </Panel>
      )}
      <EmptyState
        title="Need a different support channel?"
        description="No official contact channel is configured in this application."
        action={<Link className="text-link" to="/contact">View contact availability</Link>}
      />
    </div>
  );
};
