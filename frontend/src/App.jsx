import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { Layout } from "./components/Layout";
import {
  AdminRoute,
  DriverAccountRoute,
  DriverRoute,
  OrganizationRoute,
  PassengerRoute,
  ProtectedRoute,
  RideTrackingRoute,
} from "./components/ProtectedRoute";
import { Button, Notice, Spinner } from "./components/UI";

const LoginPage = lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.RegisterPage })));
const VerifyEmailPage = lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.VerifyEmailPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const DriverDashboardPage = lazy(() => import("./pages/DriverDashboardPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const LanguagePage = lazy(() => import("./pages/LanguagePage"));
const ReferralPage = lazy(() => import("./pages/InformationPages").then((module) => ({ default: module.ReferralPage })));
const AboutPage = lazy(() => import("./pages/InformationPages").then((module) => ({ default: module.AboutPage })));
const PrivacyPolicyPage = lazy(() => import("./pages/InformationPages").then((module) => ({ default: module.PrivacyPolicyPage })));
const ContactPage = lazy(() => import("./pages/InformationPages").then((module) => ({ default: module.ContactPage })));
const DeleteAccountPage = lazy(() => import("./pages/InformationPages").then((module) => ({ default: module.DeleteAccountPage })));
const HelpPage = lazy(() => import("./pages/InformationPages").then((module) => ({ default: module.HelpPage })));
const RideSearchPage = lazy(() => import("./pages/RidePages").then((module) => ({ default: module.RideSearchPage })));
const RideDetailsPage = lazy(() => import("./pages/RidePages").then((module) => ({ default: module.RideDetailsPage })));
const CreateRidePage = lazy(() => import("./pages/RidePages").then((module) => ({ default: module.CreateRidePage })));
const MyRidesPage = lazy(() => import("./pages/RidePages").then((module) => ({ default: module.MyRidesPage })));
const BookingsPage = lazy(() => import("./pages/BookingsPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const DriverApplicationPage = lazy(() => import("./pages/DriverApplicationPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminDataPage = lazy(() => import("./pages/AdminDataPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const RatingsPage = lazy(() => import("./pages/RatingsPage"));
const TrackingPage = lazy(() => import("./pages/TrackingPage"));
const DriverBookingsPage = lazy(() => import("./pages/DriverBookingsPage"));
const PassengerTrackingPage = lazy(() => import("./pages/PassengerTrackingPage"));
const DriverReviewsPage = lazy(() => import("./pages/DriverReviewsPage"));
const OrganizationDashboardPage = lazy(() => import("./pages/OrganizationDashboardPage"));

const HomeRedirect = () => {
  const { user, driverApplication, driverApplicationLoading } = useAuth();
  if (
    driverApplicationLoading &&
    ["user", "driver"].includes(user?.role)
  ) {
    return <Spinner label="Checking your driver access..." />;
  }
  return (
    <Navigate
      to={
        ["organizationAdmin", "superAdmin"].includes(user?.role)
          ? "/admin/analytics"
          : user?.role === "organization"
            ? "/organization/dashboard"
            : user?.role === "driver"
              ? driverApplication?.status === "approved"
                ? "/driver/dashboard"
                : "/driver-application"
              : user?.role === "user" && driverApplication?.status === "approved"
                ? "/driver/dashboard"
                : "/app"
      }
      replace
    />
  );
};

const AppRoutes = () => {
  const { loading, token, authError, refreshProfile } = useAuth();

  if (loading) {
    return (
      <main className="session-loading">
        <Spinner label="Restoring your secure session..." />
      </main>
    );
  }
  if (token && authError) {
    return (
      <main className="session-error" aria-labelledby="session-error-title">
        <h1 id="session-error-title">We couldn't restore your session</h1>
        <Notice>{authError}</Notice>
        <Button type="button" onClick={refreshProfile}>Try again</Button>
      </main>
    );
  }

  return (
    <Suspense fallback={<Spinner label="Loading AVONEX..." />}>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/password" element={<ChangePasswordPage />} />
          <Route path="/settings/language" element={<LanguagePage />} />
          <Route path="/referrals" element={<ReferralPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/delete-account" element={<DeleteAccountPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route element={<OrganizationRoute />}>
            <Route path="/organization/dashboard" element={<OrganizationDashboardPage />} />
          </Route>
          <Route element={<DriverAccountRoute />}>
            <Route path="/driver-application" element={<DriverApplicationPage />} />
          </Route>
          <Route element={<PassengerRoute />}>
            <Route path="/app" element={<DashboardPage />} />
            <Route path="/rides" element={<RideSearchPage />} />
            <Route path="/rides/:rideId" element={<RideDetailsPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/live-tracking" element={<PassengerTrackingPage />} />
            <Route path="/drivers/:userId/reviews" element={<DriverReviewsPage />} />
          </Route>
          <Route element={<RideTrackingRoute />}>
            <Route path="/rides/:rideId/tracking" element={<TrackingPage />} />
          </Route>
          <Route element={<DriverRoute />}>
            <Route path="/driver/dashboard" element={<DriverDashboardPage />} />
            <Route path="/rides/create" element={<CreateRidePage />} />
            <Route path="/my-rides" element={<MyRidesPage />} />
            <Route path="/completed-rides" element={<MyRidesPage />} />
            <Route path="/driver/live-tracking" element={<MyRidesPage />} />
            <Route path="/driver/bookings" element={<DriverBookingsPage />} />
            <Route path="/ratings" element={<RatingsPage />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/:section" element={<AdminDataPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <AuthProvider>
    <SocketProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SocketProvider>
  </AuthProvider>
);

export default App;
