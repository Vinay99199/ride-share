import assert from "node:assert/strict";
import test from "node:test";
import {
  createOriginValidator,
  getAllowedOrigins,
  parseClientOrigins,
  validateEnvironment,
} from "../src/config/runtime.js";

test("development CORS allows local frontend origins and rejects unknown hosts", async () => {
  const validator = createOriginValidator({ NODE_ENV: "development" });
  await new Promise((resolve, reject) => {
    validator("http://127.0.0.1:5173", (error, allowed) => {
      if (error || !allowed) reject(error ?? new Error("origin denied"));
      else resolve();
    });
  });
  await new Promise((resolve) => {
    validator("https://untrusted.example", (error) => {
      assert.equal(error.statusCode, 403);
      resolve();
    });
  });
});

test("production origins require valid HTTPS origins", () => {
  assert.deepEqual(
    parseClientOrigins("https://app.example,https://admin.example", {
      requireHttps: true,
    }),
    ["https://app.example", "https://admin.example"]
  );
  assert.throws(
    () => parseClientOrigins("https://app.example/path", { requireHttps: true }),
    /valid HTTPS origins/
  );
  assert.throws(
    () => parseClientOrigins("http://app.example", { requireHttps: true }),
    /valid HTTPS origins/
  );
  assert.deepEqual(getAllowedOrigins({ NODE_ENV: "production" }), []);
});

test("startup validates required variables, port, production secret, CORS, and email settings", () => {
  const development = {
    NODE_ENV: "development",
    MONGO_URI: "mongodb://localhost/test",
    JWT_SECRET: "development-secret",
  };
  assert.equal(validateEnvironment(development).port, 5000);
  assert.throws(
    () => validateEnvironment({ ...development, PORT: "70000" }),
    /PORT must be/
  );
  assert.throws(
    () =>
      validateEnvironment({
        ...development,
        NODE_ENV: "production",
        CLIENT_URL: "https://app.example",
        EMAIL_USER: "user@example.com",
        EMAIL_PASS: "password",
      }),
    /at least 32 characters/
  );
  assert.throws(
    () =>
      validateEnvironment({
        ...development,
        NODE_ENV: "production",
        JWT_SECRET: "x".repeat(32),
        CLIENT_URL: "http://app.example",
        EMAIL_USER: "user@example.com",
        EMAIL_PASS: "password",
      }),
    /valid HTTPS origins/
  );
  assert.equal(
    validateEnvironment({
      ...development,
      NODE_ENV: "production",
      JWT_SECRET: "x".repeat(32),
      CLIENT_URL: "https://app.example",
      EMAIL_USER: "user@example.com",
      EMAIL_PASS: "password",
    }).port,
    5000
  );
});
