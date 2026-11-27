import { api } from "./client";

export const trackingApi = {
  startRide: (rideId) =>
    api.post(`/rides/${rideId}/start`).then(({ data }) => data),
  resumeSharing: (rideId) =>
    api.post(`/rides/${rideId}/tracking/start`).then(({ data }) => data),
  stopSharing: (rideId) =>
    api.post(`/rides/${rideId}/tracking/stop`).then(({ data }) => data),
  completeRide: (rideId) =>
    api.post(`/rides/${rideId}/complete`).then(({ data }) => data),
  latest: (rideId) =>
    api.get(`/rides/${rideId}/tracking`).then(({ data }) => data.location),
};

export const emitTrackingEvent = (socket, event, payload) =>
  new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("Tracking request timed out.")),
      9000
    );
    socket.emit(event, payload, (result) => {
      window.clearTimeout(timeout);
      if (result?.success) resolve(result);
      else reject(new Error(result?.message || "Tracking request was denied."));
    });
  });
