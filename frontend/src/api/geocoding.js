import { api } from "./client";

export const geocodingApi = {
  search: (q) =>
    api.get("/geocoding/search", { params: { q } }).then(({ data }) => data.places),
  reverse: (longitude, latitude) =>
    api
      .get("/geocoding/reverse", {
        params: { lon: longitude, lat: latitude },
      })
      .then(({ data }) => data.place),
};
