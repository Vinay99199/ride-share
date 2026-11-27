import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth, userId } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Footer from "./Footer";
import { Button, initials } from "./UI";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export const Layout = () => {
  const { t } = useTranslation();
  const { user, logout, driverApplication } = useAuth();
  const { unreadCount, toast, dismissToast, connected, socketError, notificationError } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const adminUser = ["organizationAdmin", "superAdmin"].includes(user?.role);
  const organizationUser = user?.role === "organization";
  const hideFooter =
    location.pathname === "/live-tracking" ||
    location.pathname.endsWith("/tracking");
  const driverAccount =
    user?.role === "driver" ||
    (user?.role === "user" && driverApplication?.status === "approved");
  const approvedDriver =
    driverAccount && driverApplication?.status === "approved";
  const links = adminUser
    ? [
        { to: "/admin/analytics", label: t("common.nav.adminDashboard"), mark: "AD" },
        { to: "/admin", label: t("common.nav.reviewCenter"), mark: "RC" },
        { to: "/admin/users", label: t("common.nav.userManagement"), mark: "UM" },
        ...(user?.role === "superAdmin"
          ? [{ to: "/admin/organizations", label: t("common.nav.organizations"), mark: "OR" }]
          : []),
        { to: "/admin/monitoring", label: t("common.nav.rideMonitoring"), mark: "RM" },
        { to: "/admin/reports", label: t("common.nav.reports"), mark: "RR" },
        { to: "/admin/audit", label: t("common.nav.auditLog"), mark: "AL" },
        { to: "/notifications", label: t("common.nav.notifications"), mark: "07" },
        { to: "/settings", label: t("common.nav.settings"), mark: "ST" },
        { to: "/help", label: t("common.nav.help"), mark: "HS" },
        { to: "/profile", label: t("common.nav.profile"), mark: "08" },
      ]
    : organizationUser
      ? [
          { to: "/organization/dashboard", label: t("common.nav.organizations"), mark: "OD" },
          { to: "/notifications", label: t("common.nav.notifications"), mark: "07" },
          { to: "/settings", label: t("common.nav.settings"), mark: "ST" },
          { to: "/help", label: t("common.nav.help"), mark: "HS" },
          { to: "/profile", label: t("common.nav.profile"), mark: "08" },
        ]
      : user?.role === "driver"
        ? [
            ...(approvedDriver
              ? [
                  { to: "/driver/dashboard", label: t("common.nav.driverDashboard"), mark: "01" },
                  { to: "/app", label: t("common.nav.passengerDashboard"), mark: "PD" },
                  { to: "/rides", label: t("common.nav.findRides"), mark: "02" },
                  { to: "/bookings", label: t("common.nav.bookings"), mark: "03" },
                  { to: "/live-tracking", label: t("common.nav.liveTracking"), mark: "TR" },
                  { to: "/rides/create", label: t("common.nav.createRide"), mark: "02" },
                  { to: "/my-rides", label: t("common.nav.rideHistory"), mark: "03" },
                  { to: "/driver/bookings", label: t("common.nav.bookingRequests"), mark: "04" },
                  { to: "/driver/live-tracking", label: t("common.nav.liveTracking"), mark: "05" },
                  { to: "/ratings", label: t("common.nav.ratings"), mark: "RV" },
                ]
              : [
                  { to: "/driver-application", label: t("common.nav.applicationStatus"), mark: "01" },
                ]),
            { to: "/notifications", label: t("common.nav.notifications"), mark: "07" },
            { to: "/settings", label: t("common.nav.settings"), mark: "ST" },
            { to: "/help", label: t("common.nav.help"), mark: "HS" },
            { to: "/profile", label: t("common.nav.profile"), mark: "08" },
          ]
        : [
        ...(approvedDriver
          ? [{ to: "/driver/dashboard", label: t("common.nav.driverDashboard"), mark: "01" }]
          : [{ to: "/app", label: t("common.nav.passengerDashboard"), mark: "01" }]),
        { to: "/rides", label: t("common.nav.findRides"), mark: "02" },
        { to: "/bookings", label: t("common.nav.bookings"), mark: "03" },
        { to: "/live-tracking", label: t("common.nav.liveTracking"), mark: "TR" },
        ...(user?.role === "user" && driverApplication
          ? [{ to: "/driver-application", label: t("common.nav.applicationStatus"), mark: "05" }]
          : []),
        ...(approvedDriver
          ? [
              { to: "/rides/create", label: t("common.nav.createRide"), mark: "06" },
              { to: "/my-rides", label: t("common.nav.rideHistory"), mark: "MR" },
              { to: "/driver/bookings", label: t("common.nav.bookingRequests"), mark: "BR" },
              { to: "/driver/live-tracking", label: t("common.nav.liveTracking"), mark: "LT" },
            ]
          : []),
        { to: "/notifications", label: t("common.nav.notifications"), mark: "07" },
        { to: "/settings", label: t("common.nav.settings"), mark: "ST" },
        { to: "/help", label: t("common.nav.help"), mark: "HS" },
        { to: "/profile", label: t("common.nav.profile"), mark: "08" },
        ];

  const workspaceLabel = adminUser
    ? user?.role === "superAdmin"
      ? t("common.ui.labels.platformWorkspace")
      : t("common.ui.labels.adminWorkspace")
    : organizationUser
      ? t("common.ui.labels.organizationWorkspace")
      : approvedDriver
        ? t("common.ui.labels.driverPassenger")
        : user?.role === "driver"
          ? t("common.ui.labels.driverApplicationWorkspace")
          : t("common.ui.labels.passengerWorkspace");

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);

  const dismissNotification = () => {
    const destination = toast?.relatedRide
        ? `/rides/${toast.relatedRide}`
        : toast?.relatedBooking
          ? "/bookings"
        : "/notifications";
    dismissToast();
    navigate(destination);
  };

  const signOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className={`mobile-menu-toggle ${mobileNavOpen ? "is-open" : ""}`}
          type="button"
          aria-label={mobileNavOpen ? t("common.nav.closeMenu") : t("common.nav.openMenu")}
          aria-expanded={mobileNavOpen}
          aria-controls="primary-navigation"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <NavLink className="brand" to={adminUser ? "/admin/analytics" : organizationUser ? "/organization/dashboard" : approvedDriver ? "/driver/dashboard" : user?.role === "driver" ? "/driver-application" : "/app"} aria-label="AVONEX home">
          <span className="brand-mark">A</span>
          <span>AVONEX<small>SMART MOBILITY</small></span>
        </NavLink>
        <div className="topbar-right">
          <LanguageSwitcher compact />
          <ThemeSwitcher compact />
          <span className={`connection-pill ${connected ? "is-online" : ""}`}>
            <i /> {connected
              ? t("common.ui.labels.connectionLive")
              : socketError
                ? t("common.ui.labels.connectionReconnecting")
                : t("common.ui.labels.connectionOffline")}
          </span>
          <NavLink
            className="topbar-notifications"
            to="/notifications"
            aria-label={`${t("common.nav.notifications")}${unreadCount ? `, ${unreadCount} ${t("common.ui.options.unread")}` : ""}`}
            title={t("common.nav.notifications")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
            {unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </NavLink>
          <NavLink
            className="topbar-user"
            to="/profile"
            aria-label={`${t("common.nav.profile")}: ${user?.name || t("common.ui.labels.signedInAccount")}`}
          >
            <span className="avatar">{initials(user?.name)}</span>
            <span className="topbar-user-name">{user?.name || "Account"}</span>
          </NavLink>
          <Button variant="ghost" className="logout-button" onClick={signOut}>
            {t("common.nav.signOut")}
          </Button>
        </div>
      </header>

      {mobileNavOpen && (
        <button
          className="mobile-nav-overlay"
          type="button"
          aria-label={t("common.ui.labels.closeNavigation")}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className="app-body">
        <aside className={`sidebar ${mobileNavOpen ? "mobile-nav-open" : ""}`}>
          <div className="workspace-label">{workspaceLabel}</div>
          <NavLink
            className="sidebar-profile"
            to="/profile"
            onClick={() => setMobileNavOpen(false)}
            aria-label={`Profile for ${user?.name || "user"}`}
          >
            <span className="avatar">{initials(user?.name)}</span>
            <span className="sidebar-profile-copy">
              <strong>{user?.name || "Account"}</strong>
              <small>{user?.email || t("common.ui.labels.signedInAccount")}</small>
            </span>
            <span className="sidebar-account-status">
              {user?.isActive === false
                ? t("common.ui.labels.inactive")
                : t("common.ui.labels.profile")}
              {" · "}
              {user?.isEmailVerified
                ? t("common.ui.labels.emailVerified")
                : t("common.ui.labels.emailPending")}
            </span>
          </NavLink>
          <nav id="primary-navigation" aria-label={t("common.ui.labels.mainNavigation")}>
            {links.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === "/admin"} onClick={() => setMobileNavOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <NavIcon to={to} />
                <span>{label}</span>
                {to === "/notifications" && unreadCount > 0 && (
                  <span className="nav-count">{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <span className="muted tiny">Account · {userId(user).slice(-6)}</span>
          </div>
        </aside>

        <main className="main-content">
          {socketError && (
            <div className="realtime-banner" role="status">
              {t("common.ui.labels.realtimeReconnecting")}
            </div>
          )}
          {notificationError && (
            <div className="realtime-banner" role="status">
              Notification status could not be refreshed: {notificationError}
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {!hideFooter && <Footer />}

      {toast && (
        <button className="toast-card" onClick={dismissNotification} type="button">
          <span className="toast-kicker">{t("common.ui.labels.newNotification")}</span>
          <strong>{toast.title}</strong>
          <span>{toast.message}</span>
          <span className="toast-close" onClick={(event) => { event.stopPropagation(); dismissToast(); }}>×</span>
        </button>
      )}
    </div>
  );
};

const iconPaths = {
  home: [
    "M3 10.5 12 3l9 7.5",
    "M5.5 9.5V21h13V9.5M9.5 21v-7h5v7",
  ],
  search: ["M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z", "m16 16 5 5"],
  ticket: ["M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Z", "M13 8v2M13 14v2"],
  route: ["M6 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM18 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z", "M8 6h5a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-2a3 3 0 0 0-3 3v2"],
  car: ["m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11", "M4 11h16l1 3v5h-3v-2H6v2H3v-5l1-3Z", "M7 14h.01M17 14h.01"],
  plus: ["M12 5v14M5 12h14"],
  bell: ["M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9", "M10 21h4"],
  user: ["M20 21a8 8 0 0 0-16 0", "M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
  shield: ["M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z", "m9 12 2 2 4-4"],
  inbox: ["M4 4h16v16H4z", "M4 13h4l2 3h4l2-3h4"],
  org: ["M4 21V5l8-3 8 3v16", "M2 21h20", "M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4"],
  reports: ["M4 19V5M4 19h17", "m7 15 4-4 3 2 6-7"],
  history: ["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5", "M12 7v5l3 2"],
  star: ["m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"],
  locate: ["M12 3v3M12 18v3M3 12h3M18 12h3", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
};

const navIconFor = (to) => {
  if (to === "/app" || to.includes("dashboard") || to === "/admin/analytics") return "home";
  if (to === "/rides") return "search";
  if (to === "/bookings") return "ticket";
  if (to.includes("tracking")) return "locate";
  if (to.includes("create")) return "plus";
  if (to.includes("my-rides") || to.includes("monitoring")) return "car";
  if (to.includes("application")) return "shield";
  if (to.includes("driver/bookings") || to === "/admin") return "inbox";
  if (to.includes("organization")) return "org";
  if (to.includes("reports")) return "reports";
  if (to.includes("audit") || to.includes("completed")) return "history";
  if (to.includes("ratings") || to.includes("reviews")) return "star";
  if (to.includes("notifications")) return "bell";
  if (to.includes("settings")) return "shield";
  if (to.includes("help") || to.includes("support")) return "inbox";
  if (to.includes("profile") || to.includes("users")) return "user";
  if (to.includes("support")) return "reports";
  return "route";
};

const NavIcon = ({ to }) => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {iconPaths[navIconFor(to)].map((path) => <path key={path} d={path} />)}
  </svg>
);
