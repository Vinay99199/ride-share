import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Notice, Spinner } from "./UI";

export const ProtectedRoute = () => {
  const { user, loading, token, authError, refreshProfile } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Restoring your secure session..." />;
  if (token && authError) {
    return (
      <main className="session-error">
        <h1>We couldn't restore your session</h1>
        <Notice>{authError}</Notice>
        <Button type="button" onClick={refreshProfile}>Try again</Button>
      </main>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
};

export const AdminRoute = () => {
  const { user } = useAuth();
  if (!["organizationAdmin", "superAdmin"].includes(user?.role)) {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
};

export const PassengerRoute = () => {
  const {
    user,
    driverApplication,
    driverApplicationLoading,
    driverApplicationError,
    refreshDriverApplication,
  } = useAuth();
  if (["organizationAdmin", "superAdmin"].includes(user?.role)) {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === "driver") {
    if (driverApplicationLoading) {
      return <Spinner label="Checking approved driver status..." />;
    }
    if (driverApplicationError) {
      return (
        <main className="session-error">
          <h1>Driver access could not be checked</h1>
          <Notice>{driverApplicationError}</Notice>
          <Button type="button" onClick={refreshDriverApplication}>
            Try again
          </Button>
        </main>
      );
    }
    if (driverApplication?.status !== "approved") {
      return <Navigate to="/driver-application" replace />;
    }
    return <Outlet />;
  }
  if (!["user", "passenger"].includes(user?.role)) {
    return <Navigate to={user?.role === "organization" ? "/organization/dashboard" : "/driver/dashboard"} replace />;
  }
  return <Outlet />;
};

export const DriverAccountRoute = () => {
  const { user } = useAuth();
  if (!["user", "driver"].includes(user?.role)) {
    return <Navigate to={user?.role === "organization" ? "/organization/dashboard" : "/app"} replace />;
  }
  return <Outlet />;
};

export const OrganizationRoute = () => {
  const { user } = useAuth();
  if (user?.role !== "organization") {
    return <Navigate to={["organizationAdmin", "superAdmin"].includes(user?.role) ? "/admin" : "/app"} replace />;
  }
  return <Outlet />;
};

export const DriverRoute = () => {
  const {
    user,
    driverApplication,
    driverApplicationLoading,
    driverApplicationError,
    refreshDriverApplication,
  } = useAuth();
  const location = useLocation();

  if (["organizationAdmin", "superAdmin"].includes(user?.role)) {
    return <Navigate to="/admin" replace />;
  }
  if (!["user", "driver"].includes(user?.role)) {
    return <Navigate to={user?.role === "organization" ? "/organization/dashboard" : "/app"} replace />;
  }
  if (driverApplicationLoading) {
    return <Spinner label="Checking approved driver status..." />;
  }
  if (driverApplicationError) {
    return (
      <main className="session-error">
        <h1>Driver access could not be checked</h1>
        <Notice>{driverApplicationError}</Notice>
        <Button type="button" onClick={refreshDriverApplication}>
          Try again
        </Button>
      </main>
    );
  }
  if (driverApplication?.status !== "approved") {
    return (
      <Navigate
        to="/driver-application"
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  return <Outlet />;
};

export const RideTrackingRoute = () => {
  const {
    user,
    driverApplication,
    driverApplicationLoading,
    driverApplicationError,
    refreshDriverApplication,
  } = useAuth();

  if (["passenger", "user"].includes(user?.role)) return <Outlet />;
  if (user?.role === "driver") {
    if (driverApplicationLoading) {
      return <Spinner label="Checking approved driver status..." />;
    }
    if (driverApplicationError) {
      return (
        <main className="session-error">
          <h1>Driver access could not be checked</h1>
          <Notice>{driverApplicationError}</Notice>
          <Button type="button" onClick={refreshDriverApplication}>Try again</Button>
        </main>
      );
    }
    if (driverApplication?.status === "approved") return <Outlet />;
    return <Navigate to="/driver-application" replace />;
  }
  return (
    <Navigate
      to={["organizationAdmin", "superAdmin"].includes(user?.role)
        ? "/admin"
        : user?.role === "organization"
          ? "/organization/dashboard"
          : "/app"}
      replace
    />
  );
};
