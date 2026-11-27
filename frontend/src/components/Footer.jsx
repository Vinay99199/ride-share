import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Illustration } from "./VisualAssets";
import { useTranslation } from "react-i18next";

const FooterLinkGroup = ({ title, links }) => (
  <nav className="footer-link-group" aria-label={title}>
    <h2 className="footer-link-group-heading">{title}</h2>
    <ul className="footer-link-list">
      {links.map(({ label, to }) => (
        <li key={`${label}-${to}`}>
          <Link to={to}>{label}</Link>
        </li>
      ))}
    </ul>
  </nav>
);

const Footer = () => {
  const { t } = useTranslation();
  const { user, driverApplication } = useAuth();
  const role = user?.role;
  const approvedDriver = driverApplication?.status === "approved";
  const canPassenger =
    ["user", "passenger"].includes(role) ||
    (role === "driver" && approvedDriver);
  const canViewDriverGuide = ["user", "driver"].includes(role);
  const canViewDriverApplication =
    role === "driver" ||
    (role === "user" &&
      driverApplication &&
      driverApplication.status !== "approved");

  const exploreLinks = [
    { label: t("common.ui.footer.home"), to: "/" },
    ...(canPassenger ? [{ label: t("common.nav.findRides"), to: "/rides" }] : []),
    { label: t("common.ui.pages.about"), to: "/about" },
    { label: t("common.ui.pages.contactOptions"), to: "/contact" },
  ];

  const userLinks = [
    ...(canPassenger ? [{ label: t("common.ui.footer.passengerGuide"), to: "/help" }] : []),
    ...(canViewDriverGuide ? [{ label: t("common.ui.footer.driverGuide"), to: "/help" }] : []),
    ...(canViewDriverApplication
      ? [{ label: t("common.ui.pages.driverApplication"), to: "/driver-application" }]
      : []),
    ...(canPassenger ? [{ label: t("common.nav.rideHistory"), to: "/bookings" }] : []),
    { label: t("common.nav.help"), to: "/help" },
  ];

  const organizationLinks =
    role === "organization"
      ? [
          { label: t("common.ui.pages.organizations"), to: "/organization/dashboard" },
          { label: t("common.ui.footer.organizationContact"), to: "/contact" },
        ]
      : [
          { label: t("common.nav.organizations"), to: "/register" },
          { label: t("common.ui.footer.organizationContact"), to: "/contact" },
        ];

  const legalLinks = [
    { label: t("common.ui.footer.privacyDraft"), to: "/privacy" },
    { label: t("common.nav.help"), to: "/help" },
    ...(canPassenger
      ? [{ label: t("common.ui.pages.reportIssue"), to: "/bookings" }]
      : []),
  ];

  const backToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <footer className="avonex-footer">
      <div className="footer-cta-wrap">
        <section className="footer-cta" aria-labelledby="footer-cta-title">
          <div className="footer-cta-copy">
            <span className="footer-eyebrow">{t("common.ui.footer.ctaEyebrow")}</span>
            <h2 id="footer-cta-title">{t("common.ui.footer.ctaTitle")}</h2>
            <p>
              {t("common.ui.footer.ctaDescription")}
            </p>
          </div>
          <Illustration kind="mobility" className="footer-cta-illustration" decorative />
          <Link className="footer-cta-button" to="/register">
            {t("common.ui.footer.getStarted")} <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>

      <div className="footer-content">
        <section className="footer-brand" aria-label={t("common.ui.pages.about")}>
          <Link className="footer-brand-link" to="/" aria-label={`${t("common.ui.footer.home")} AVONEX`}>
            <span className="footer-brand-mark" aria-hidden="true">A</span>
            <span>AVONEX</span>
          </Link>
          <strong className="footer-tagline">{t("common.ui.footer.tagline")}</strong>
          <p>{t("common.ui.footer.brandDescription")}</p>
        </section>

        <FooterLinkGroup title={t("common.ui.footer.explore")} links={exploreLinks} />
        <FooterLinkGroup title={t("common.ui.footer.forUsers")} links={userLinks} />
        <FooterLinkGroup title={t("common.nav.organizations")} links={organizationLinks} />
        <FooterLinkGroup title={t("common.ui.footer.legalSupport")} links={legalLinks} />
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>© {new Date().getFullYear()} AVONEX. {t("common.ui.footer.allRightsReserved")}</p>
          <div className="footer-bottom-actions">
            <Link to="/privacy">{t("common.ui.pages.privacy")}</Link>
            <button type="button" onClick={backToTop}>
              {t("common.ui.footer.backToTop")} <span aria-hidden="true">↑</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
