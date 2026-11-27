import { api } from "./client";

export const authApi = {
  register: (body) => api.post("/auth/register", body).then(({ data }) => data),
  verifyEmail: (body) =>
    api.post("/auth/verify-email", body).then(({ data }) => data),
  resendOtp: (body) =>
    api.post("/auth/resend-otp", body).then(({ data }) => data),
  login: (body) => api.post("/auth/login", body).then(({ data }) => data),
  logout: () => api.post("/auth/logout").then(({ data }) => data),
  changePassword: (body) =>
    api.patch("/auth/change-password", body).then(({ data }) => data),
  requestEmailChange: (body) =>
    api.post("/auth/email-change", body).then(({ data }) => data),
  emailChangeStatus: () =>
    api.get("/auth/email-change").then(({ data }) => data),
  confirmEmailChange: (body) =>
    api.post("/auth/email-change/confirm", body).then(({ data }) => data),
};
