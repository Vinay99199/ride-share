import { api } from "./client";

export const usersApi = {
  me: () =>
    api.get("/auth/me").then(({ data }) => {
      const safeUser = { ...data.user };
      delete safeUser.password;
      delete safeUser.emailOtp;
      delete safeUser.emailOtpExpiresAt;
      return safeUser;
    }),
  updateProfile: (body) =>
    api.patch("/auth/profile", body).then(({ data }) => data.user),
};
