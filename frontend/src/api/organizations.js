import { api } from "./client";

export const organizationsApi = {
  list: (params = {}) =>
    api.get("/organizations", { params }).then(({ data }) => data),
  get: (organizationId) =>
    api.get(`/organizations/${organizationId}`).then(({ data }) => data.organization),
  mine: () =>
    api.get("/organizations/me").then(({ data }) => data),
};
