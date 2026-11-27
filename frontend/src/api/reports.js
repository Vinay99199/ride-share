import { api } from "./client";

export const reportsApi = {
  create: (body) => api.post("/reports", body).then(({ data }) => data),
};
