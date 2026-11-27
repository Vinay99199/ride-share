import axios from "axios";

const TOKEN_KEY = "avonex_token";

export const getStoredToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    sessionStorage.removeItem(TOKEN_KEY);
    return token;
  }

  const legacyToken = sessionStorage.getItem(TOKEN_KEY);
  if (legacyToken) {
    localStorage.setItem(TOKEN_KEY, legacyToken);
    sessionStorage.removeItem(TOKEN_KEY);
  }
  return legacyToken;
};

export const storeToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
  sessionStorage.removeItem(TOKEN_KEY);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.includes("/auth/login")) {
      const requestAuthorization =
        error.config?.headers?.get?.("Authorization") ||
        error.config?.headers?.Authorization ||
        error.config?.headers?.authorization;
      const currentToken = getStoredToken();
      if (requestAuthorization === `Bearer ${currentToken}`) {
        clearStoredToken();
        window.dispatchEvent(new Event("avonex:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong. Please try again.";
