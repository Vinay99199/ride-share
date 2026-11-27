const configuredBaseUrl =
  process.env.NOMINATIM_BASE_URL?.trim() ||
  "https://nominatim.openstreetmap.org/";

export const geocodingConfig = Object.freeze({
  baseUrl: configuredBaseUrl.endsWith("/")
    ? configuredBaseUrl
    : `${configuredBaseUrl}/`,
  userAgent:
    process.env.NOMINATIM_USER_AGENT?.trim() ||
    "AVONEX Ride Sharing/1.0",
  email: process.env.NOMINATIM_EMAIL?.trim() || "",
});
