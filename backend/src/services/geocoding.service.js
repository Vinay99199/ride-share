import { geocodingConfig } from "../config/geocoding.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const PROVIDER_INTERVAL_MS = 1100;

const geocodingError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const normalizeResult = (item) => {
  if (!item || typeof item !== "object") return null;
  const longitude = Number(item.lon);
  const latitude = Number(item.lat);
  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof item.display_name !== "string" ||
    !item.display_name.trim()
  ) {
    return null;
  }

  return {
    placeId: String(item.place_id),
    name:
      typeof item.name === "string" && item.name.trim()
        ? item.name.trim()
        : item.display_name.split(",")[0].trim(),
    address: item.display_name.trim(),
    coordinates: [longitude, latitude],
  };
};

export const createGeocodingService = ({
  fetchImpl = globalThis.fetch,
  baseUrl = geocodingConfig.baseUrl,
  userAgent = geocodingConfig.userAgent,
  email = geocodingConfig.email,
  now = () => Date.now(),
  sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
  minimumIntervalMs = PROVIDER_INTERVAL_MS,
} = {}) => {
  const cache = new Map();
  let lastProviderRequestAt = 0;
  let requestQueue = Promise.resolve();

  const fromCache = (key) => {
    const cached = cache.get(key);
    if (!cached) return undefined;
    if (cached.expiresAt <= now()) {
      cache.delete(key);
      return undefined;
    }
    return cached.value;
  };

  const putCache = (key, value) => {
    if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) cache.delete(oldestKey);
    }
    cache.set(key, { value, expiresAt: now() + CACHE_TTL_MS });
  };

  const requestProvider = async (path, params) => {
    let releaseQueue;
    const previousRequest = requestQueue;
    requestQueue = new Promise((resolve) => {
      releaseQueue = resolve;
    });
    await previousRequest;

    try {
      const elapsed = now() - lastProviderRequestAt;
      if (lastProviderRequestAt && elapsed < minimumIntervalMs) {
        await sleep(minimumIntervalMs - elapsed);
      }

      const url = new URL(path, baseUrl);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
      if (email) url.searchParams.set("email", email);

      lastProviderRequestAt = now();
      const response = await fetchImpl(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": userAgent,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.status === 429) {
        throw geocodingError(
          503,
          "The place search provider is rate limiting requests. Please wait and try again."
        );
      }
      if (!response.ok) {
        throw geocodingError(
          503,
          "The place search provider is temporarily unavailable."
        );
      }
      return await response.json();
    } catch (error) {
      if (error.statusCode) throw error;
      throw geocodingError(
        503,
        "Unable to contact the place search provider. Please try again."
      );
    } finally {
      releaseQueue();
    }
  };

  const search = async (query) => {
    const normalizedQuery = query.trim().replace(/\s+/g, " ").toLowerCase();
    const key = `search:${normalizedQuery}`;
    const cached = fromCache(key);
    if (cached !== undefined) return cached;

    const items = await requestProvider("search", {
      q: query.trim(),
      format: "jsonv2",
      addressdetails: "1",
      limit: "5",
    });
    if (!Array.isArray(items)) {
      throw geocodingError(503, "The place search provider returned an invalid response.");
    }
    const results = items.map(normalizeResult).filter(Boolean);
    putCache(key, results);
    return results;
  };

  const reverse = async (longitude, latitude) => {
    const roundedLongitude = Number(longitude.toFixed(5));
    const roundedLatitude = Number(latitude.toFixed(5));
    const key = `reverse:${roundedLongitude},${roundedLatitude}`;
    const cached = fromCache(key);
    if (cached !== undefined) return cached;

    const item = await requestProvider("reverse", {
      lon: String(roundedLongitude),
      lat: String(roundedLatitude),
      format: "jsonv2",
      addressdetails: "1",
    });
    const result = normalizeResult(item);
    if (!result) {
      throw geocodingError(404, "No readable address was found for this map point.");
    }
    putCache(key, result);
    return result;
  };

  return { reverse, search };
};

const geocodingService = createGeocodingService();
export default geocodingService;
