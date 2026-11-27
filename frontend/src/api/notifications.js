import { api } from "./client";

export const notificationsApi = {
  list: (params = {}) =>
    api.get("/notifications", { params }).then(({ data }) => data),
  unreadCount: () =>
    api.get("/notifications/unread-count").then(({ data }) => data.count),
  markRead: (notificationId) =>
    api.patch(`/notifications/${notificationId}/read`).then(({ data }) => data),
  markAllRead: () =>
    api.patch("/notifications/read-all").then(({ data }) => data),
  remove: (notificationId) =>
    api.delete(`/notifications/${notificationId}`).then(({ data }) => data),
};
