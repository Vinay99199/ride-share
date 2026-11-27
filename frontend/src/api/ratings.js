import { api } from "./client";

export const ratingsApi = {
  create: (body) => api.post("/ratings", body).then(({ data }) => data),
  forUser: (userId) =>
    api.get(`/ratings/user/${userId}`).then(({ data }) => data),
  forRide: (rideId) =>
    api.get(`/ratings/ride/${rideId}`).then(({ data }) => data),
  mine: () => api.get("/ratings/my-reviews").then(({ data }) => data.reviews),
  update: (ratingId, body) =>
    api.patch(`/ratings/${ratingId}`, body).then(({ data }) => data),
  remove: (ratingId) =>
    api.delete(`/ratings/${ratingId}`).then(({ data }) => data),
};
