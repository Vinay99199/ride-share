import { api } from "./client";

export const bookingsApi = {
  create: (body) => api.post("/bookings", body).then(({ data }) => data),
  mine: () => api.get("/bookings/my-bookings").then(({ data }) => data.bookings),
  list: (params) =>
    api.get("/bookings/my-bookings", { params }).then(({ data }) => data),
  dashboard: () =>
    api.get("/bookings/passenger-dashboard").then(({ data }) => data),
  driverMine: () =>
    api.get("/bookings/driver-bookings").then(({ data }) => data.bookings),
  get: (bookingId) =>
    api.get(`/bookings/${bookingId}`).then(({ data }) => data.booking),
  forRide: (rideId) =>
    api.get(`/bookings/ride/${rideId}`).then(({ data }) => data.bookings),
  review: (bookingId, status) =>
    api.patch(`/bookings/${bookingId}/review`, { status }).then(({ data }) => data),
  cancel: (bookingId) =>
    api.patch(`/bookings/${bookingId}/cancel`).then(({ data }) => data),
  cancelByDriver: (bookingId) =>
    api.patch(`/bookings/${bookingId}/driver-cancel`).then(({ data }) => data),
};
