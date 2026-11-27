import { api } from "./client";

export const driverApplicationsApi = {
  mine: () =>
    api.get("/driver-applications/me").then(({ data }) => data.application),
  apply: (body) =>
    api.post("/driver-applications/apply", body).then(({ data }) => data),
};
