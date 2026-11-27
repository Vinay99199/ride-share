import assert from "node:assert/strict";
import test from "node:test";
import { createGeocodingController } from "../src/controllers/geocoding.controller.js";
import { createGeocodingService } from "../src/services/geocoding.service.js";

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("place search returns validated named coordinates and caches provider responses", async () => {
  let requests = 0;
  let requestUrl;
  let requestHeaders;
  const service = createGeocodingService({
    baseUrl: "https://nominatim.example/",
    userAgent: "AVONEX test agent",
    email: "maps@example.test",
    minimumIntervalMs: 0,
    fetchImpl: async (url, options) => {
      requests += 1;
      requestUrl = url;
      requestHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            place_id: 123,
            name: "Kanpur Central",
            display_name: "Kanpur Central, Kanpur, Uttar Pradesh, India",
            lon: "80.3319",
            lat: "26.4499",
          },
          {
            place_id: 124,
            name: "Invalid coordinate result",
            display_name: "Invalid",
            lon: "181",
            lat: "0",
          },
        ],
      };
    },
  });

  const first = await service.search("Kanpur Central");
  const second = await service.search("Kanpur Central");

  assert.equal(requests, 1);
  assert.equal(new URL(requestUrl).searchParams.get("q"), "Kanpur Central");
  assert.equal(new URL(requestUrl).searchParams.get("email"), "maps@example.test");
  assert.equal(requestHeaders["User-Agent"], "AVONEX test agent");
  assert.deepEqual(first, [
    {
      placeId: "123",
      name: "Kanpur Central",
      address: "Kanpur Central, Kanpur, Uttar Pradesh, India",
      coordinates: [80.3319, 26.4499],
    },
  ]);
  assert.deepEqual(second, first);
});

test("reverse geocoding validates and preserves [longitude, latitude]", async () => {
  let requestUrl;
  const service = createGeocodingService({
    baseUrl: "https://nominatim.example/",
    minimumIntervalMs: 0,
    fetchImpl: async (url) => {
      requestUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          place_id: 123,
          name: "Kanpur",
          display_name: "Kanpur, Uttar Pradesh, India",
          lon: "80.33190",
          lat: "26.44990",
        }),
      };
    },
  });

  const place = await service.reverse(80.3319, 26.4499);
  assert.equal(new URL(requestUrl).searchParams.get("lon"), "80.3319");
  assert.equal(new URL(requestUrl).searchParams.get("lat"), "26.4499");
  assert.deepEqual(place.coordinates, [80.3319, 26.4499]);
});

test("geocoding controllers reject malformed queries and surface provider errors", async () => {
  const controller = createGeocodingController({
    service: {
      search: async () => {
        throw Object.assign(new Error("provider rate limited"), { statusCode: 503 });
      },
      reverse: async () => null,
    },
    logger: { error() {} },
  });

  const invalidSearch = response();
  await controller.searchPlaces({ query: { q: "x" } }, invalidSearch);
  assert.equal(invalidSearch.statusCode, 400);

  const rateLimited = response();
  await controller.searchPlaces({ query: { q: "Kanpur" } }, rateLimited);
  assert.equal(rateLimited.statusCode, 503);
  assert.match(rateLimited.body.message, /rate limited/);

  const invalidCoordinates = response();
  await controller.reverseGeocode(
    { query: { lon: "181", lat: "26" } },
    invalidCoordinates
  );
  assert.equal(invalidCoordinates.statusCode, 400);
});

test("place search reports no results without fabricating coordinates", async () => {
  const controller = createGeocodingController({
    service: { search: async () => [], reverse: async () => null },
    logger: { error() {} },
  });
  const res = response();
  await controller.searchPlaces({ query: { q: "Some unlisted place" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.places, []);
});
