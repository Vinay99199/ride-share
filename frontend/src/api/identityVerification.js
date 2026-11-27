import { api } from "./client";

export const identityVerificationApi = {
  mine: () =>
    api.get("/identity-verifications/me").then(({ data }) => data.verification),
  submit: (body) =>
    api
      .post("/identity-verifications/submit", body)
      .then(({ data }) => data),
};
