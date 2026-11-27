export const canCancelRide = (ride) =>
  ride?.status === "scheduled" && !ride.startedAt;

export const canCancelBooking = (booking, ride) =>
  ["pending", "confirmed"].includes(booking?.status) &&
  !ride?.startedAt &&
  ride?.status !== "completed";
