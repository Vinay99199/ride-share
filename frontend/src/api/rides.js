import { api } from "./client";

export const ridesApi = {
  search: (params) => api.get("/rides/search", { params }).then(({ data }) => data),
  available: (params) => api.get("/rides", { params }).then(({ data }) => data),
  get: (rideId) => api.get(`/rides/${rideId}`).then(({ data }) => data.ride),
  mine: (params = {}) =>
    api.get("/rides/my-rides", { params }).then(({ data }) => data),
  create: (body) => api.post("/rides", body).then(({ data }) => data),
  cancel: (rideId) =>
    api.patch(`/rides/${rideId}/cancel`).then(({ data }) => data),
};
