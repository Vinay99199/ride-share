import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authApi } from "../api/auth";
import {
  clearStoredToken,
  errorMessage,
  getStoredToken,
  storeToken,
} from "../api/client";
import { driverApplicationsApi } from "../api/driverApplications";
import { usersApi } from "../api/users";

const AuthContext = createContext(null);

const sessionRestoreErrorMessage = (error) => {
  const status = error.response?.status;
  if (status === 503) {
    return "AVONEX authentication is temporarily unavailable, possibly because the database is reconnecting. Please try again.";
  }
  if (status >= 500) {
    return `AVONEX could not restore your session because the server returned an error (${status}). Please try again.`;
  }
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "Session validation took too long. Check your connection and try again.";
  }
  if (!error.response && error.request) {
    return "AVONEX could not be reached. Check your internet connection and confirm the API service is available.";
  }
  return errorMessage(error);
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getStoredToken()));
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [logoutWarning, setLogoutWarning] = useState("");
  const [driverApplication, setDriverApplication] = useState(null);
  const skipSessionValidation = useRef(false);
  const [driverApplicationLoading, setDriverApplicationLoading] = useState(
    Boolean(getStoredToken())
  );
  const [driverApplicationError, setDriverApplicationError] = useState("");
  const driverApplicationRequest = useRef(0);
  const sessionRestoreRequest = useRef(null);

  const clearSession = useCallback(() => {
    driverApplicationRequest.current += 1;
    clearStoredToken();
    setToken(null);
    setUser(null);
    setDriverApplication(null);
    setDriverApplicationError("");
    setAuthError("");
    setAuthNotice("");
    setLoading(false);
    setDriverApplicationLoading(false);
  }, []);

  const restoreSession = useCallback(async (sessionToken = token) => {
    const activeToken = sessionToken || getStoredToken();
    if (!activeToken || getStoredToken() !== activeToken) {
      setLoading(false);
      setUser(null);
      setAuthError("");
      return null;
    }

    if (sessionRestoreRequest.current?.token === activeToken) {
      return sessionRestoreRequest.current.promise;
    }

    setLoading(true);
    setAuthError("");
    const request = usersApi.me()
      .then((profile) => {
        if (getStoredToken() === activeToken) setUser(profile);
        return profile;
      })
      .catch((error) => {
        if (getStoredToken() !== activeToken) return null;
        if (error.response?.status === 401) {
          clearSession();
        } else {
          setAuthError(sessionRestoreErrorMessage(error));
        }
        return null;
      })
      .finally(() => {
        if (sessionRestoreRequest.current?.promise === request) {
          sessionRestoreRequest.current = null;
          if (getStoredToken() === activeToken) setLoading(false);
        }
      });

    sessionRestoreRequest.current = { token: activeToken, promise: request };
    return request;
  }, [clearSession, token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      setAuthNotice("Your session has expired or is no longer valid. Please sign in again.");
    };
    window.addEventListener("avonex:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("avonex:unauthorized", handleUnauthorized);
  }, [clearSession]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      setAuthError("");
      return;
    }

    if (skipSessionValidation.current) {
      skipSessionValidation.current = false;
      setLoading(false);
      setAuthError("");
      return;
    }

    restoreSession(token);
  }, [token, restoreSession]);

  const refreshDriverApplication = useCallback(async () => {
    if (!token) {
      setDriverApplication(null);
      setDriverApplicationLoading(false);
      return null;
    }
    if (!user) return null;
    if (!["user", "driver"].includes(user.role)) {
      setDriverApplication(null);
      setDriverApplicationLoading(false);
      return null;
    }

    const requestId = ++driverApplicationRequest.current;
    setDriverApplicationLoading(true);
    setDriverApplicationError("");
    try {
      const application = await driverApplicationsApi.mine();
      if (requestId === driverApplicationRequest.current) {
        setDriverApplication(application);
      }
      return application;
    } catch (error) {
      if (requestId === driverApplicationRequest.current) {
        setDriverApplicationError(errorMessage(error));
      }
      return null;
    } finally {
      if (requestId === driverApplicationRequest.current) {
        setDriverApplicationLoading(false);
      }
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (!token) {
      driverApplicationRequest.current += 1;
      setDriverApplication(null);
      setDriverApplicationLoading(false);
      setDriverApplicationError("");
      return;
    }
    if (!user) return;
    if (!["user", "driver"].includes(user.role)) {
      driverApplicationRequest.current += 1;
      setDriverApplication(null);
      setDriverApplicationLoading(false);
      setDriverApplicationError("");
      return;
    }
    refreshDriverApplication();
  }, [token, user?.role, refreshDriverApplication]);

  useEffect(() => {
    const handleApplicationReview = (event) => {
      if (
        ["driver_application_approved", "driver_application_rejected"].includes(
          event.detail?.type
        )
      ) {
        refreshDriverApplication();
      }
    };
    window.addEventListener("avonex:notification", handleApplicationReview);
    return () =>
      window.removeEventListener("avonex:notification", handleApplicationReview);
  }, [refreshDriverApplication]);

  const installSession = useCallback((result, { skipValidation = false } = {}) => {
    if (!result?.token || !result?.user) {
      throw new Error("The authentication response did not contain a valid session");
    }
    skipSessionValidation.current =
      skipValidation && getStoredToken() !== result.token;
    storeToken(result.token);
    setToken(result.token);
    setUser(result.user);
    setAuthError("");
    setAuthNotice("");
    setLoading(!skipValidation);
    setLogoutWarning("");
    return result;
  }, []);

  const login = useCallback(async (credentials) =>
    installSession(await authApi.login(credentials)), [installSession]);

  const logout = useCallback(async () => {
    let revoked = false;
    try {
      await authApi.logout();
      revoked = true;
      setLogoutWarning("");
    } catch {
      setLogoutWarning(
        "You were signed out on this device, but the server could not confirm token revocation. This token may remain valid until it expires."
      );
    } finally {
      clearSession();
    }
    return revoked;
  }, [clearSession]);

  const clearLogoutWarning = useCallback(() => setLogoutWarning(""), []);
  const updateUser = useCallback((profile) => setUser(profile), []);
  const refreshProfile = restoreSession;

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authError,
      authNotice,
      logoutWarning,
      clearLogoutWarning,
      login,
      logout,
      installSession,
      updateUser,
      restoreSession,
      refreshProfile,
      driverApplication,
      driverApplicationLoading,
      driverApplicationError,
      refreshDriverApplication,
    }),
    [
      user,
      token,
      loading,
      authError,
      authNotice,
      logoutWarning,
      login,
      logout,
      installSession,
      clearLogoutWarning,
      updateUser,
      restoreSession,
      refreshProfile,
      driverApplication,
      driverApplicationLoading,
      driverApplicationError,
      refreshDriverApplication,
    ]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
};

export const userId = (user) => String(user?._id || user?.id || "");
